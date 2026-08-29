import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Vibration,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { VolunteerTabScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';
import {
  VarkariInteractiveMap,
  ActiveSOSMapData,
  ClaimedRouteMapData,
} from '../../components/map/VarkariInteractiveMap';
import { VarkariMapModal } from '../../components/map/VarkariMapModal';
import { useUserProfile } from '../../lib/userStore';
import {
  fetchEmergencyAlerts,
  claimEmergencyAlert,
  resolveEmergencyAlert,
  subscribeToEmergencyAlerts,
  createAlertFromBlePacket,
  EmergencyAlert,
  calculateDynamicPriority,
  prioritizeEmergencyAlerts,
} from '../../services/alertService';
import { bleMeshManager } from '../../services/bleMeshManager';
import { BleMeshStatusBanner } from '../../components/sos/BleMeshStatusBanner';
import { BleSosPacket, estimateDistanceFromRssi } from '../../services/bleMeshPacket';

export const VolunteerDashboardScreen: React.FC<
  VolunteerTabScreenProps<'VolunteerDashboard'>
> = () => {
  const profile = useUserProfile();
  const volunteerId = profile?.id || 'vol-logged-in';
  const volunteerName = profile?.fullName || 'Volunteer';
  const volunteerPhone = profile?.mobileNumber || '+91 98221 55660';
  const assignedSector = profile?.assignedSector || 'Sector 1 (Wakhari Gate)';

  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mapModalVisible, setMapModalVisible] = useState<boolean>(false);
  const [selectedMapPointId, setSelectedMapPointId] = useState<string | null>(null);
  const [activeClaimedRoute, setActiveClaimedRoute] = useState<ClaimedRouteMapData | null>(null);
  const [modalActiveSos, setModalActiveSos] = useState<ActiveSOSMapData | null>(null);
  const [isBleScanning, setIsBleScanning] = useState<boolean>(false);
  const [lastBleReceived, setLastBleReceived] = useState<{ name: string; distance: string } | null>(null);

  const currentVolunteer = {
    id: volunteerId,
    name: volunteerName,
    phone: volunteerPhone,
  };

  // Helper: check if a specific alert was claimed by THIS logged-in volunteer
  const isAlertClaimedByMe = (item: EmergencyAlert) => {
    if (item.status !== 'in_progress') return false;
    const matchesId = Boolean(item.responder_id && item.responder_id === currentVolunteer.id);
    const matchesName = Boolean(
      item.responder_name &&
        currentVolunteer.name &&
        item.responder_name.trim().toLowerCase() === currentVolunteer.name.trim().toLowerCase() &&
        currentVolunteer.name.toLowerCase() !== 'volunteer',
    );
    return matchesId || matchesName;
  };

  // Helper: check if a specific alert was claimed by ANOTHER volunteer
  const isAlertClaimedByOther = (item: EmergencyAlert) => {
    return item.status === 'in_progress' && !isAlertClaimedByMe(item);
  };

  // Load live alerts from Supabase on mount and subscribe to Realtime updates + fast polling fallback
  useEffect(() => {
    loadAlerts();

    // 1. Supabase Realtime Postgres Changes Subscription
    const unsubscribe = subscribeToEmergencyAlerts((payload) => {
      console.log('[VolunteerDashboard] Realtime alert update:', payload.eventType);

      if (payload.eventType === 'INSERT') {
        const newAlert = payload.new as EmergencyAlert;
        Vibration.vibrate([0, 250, 100, 250]);
        setAlerts((prev) => {
          const exists = prev.some((a) => a.id === newAlert.id);
          const list = exists ? prev.map((a) => (a.id === newAlert.id ? newAlert : a)) : [newAlert, ...prev];
          return prioritizeEmergencyAlerts(list);
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedAlert = payload.new as EmergencyAlert;
        setAlerts((prev) => {
          const list = prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a));
          return prioritizeEmergencyAlerts(list);
        });
      } else if (payload.eventType === 'DELETE') {
        setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
        setActiveClaimedRoute(null);
      }
    });

    // 2. Fast 3.5s Polling Fallback to guarantee delivery & dynamic waiting time updates
    const pollInterval = setInterval(() => {
      fetchEmergencyAlerts().then(({ alerts: freshAlerts, error }) => {
        if (!error && freshAlerts) {
          setAlerts((prev) => {
            const prevIds = new Set(prev.map((a) => a.id));
            const hasNew = freshAlerts.some((a) => !prevIds.has(a.id) && a.status === 'nearby');
            if (hasNew) {
              Vibration.vibrate([0, 200, 100, 200]);
            }
            return freshAlerts;
          });
        }
      });
    }, 3500);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  // 3. BLE Mesh Scanning for Offline SOS Beacons
  useEffect(() => {
    const startBleScan = async () => {
      const started = await bleMeshManager.startScanning();
      if (started) {
        setIsBleScanning(true);
        console.log('[VolunteerDashboard] BLE Mesh scanning started');
      }
    };

    startBleScan();

    // Listen for incoming BLE SOS beacons
    const removeBleListener = bleMeshManager.addEventListener(async (event) => {
      if (event.type === 'sos_received' && event.packet) {
        const packet = event.packet;
        const dist = event.estimatedDistance
          ? `~${Math.round(event.estimatedDistance)}m away`
          : 'Nearby';

        console.log(`[VolunteerDashboard] 🚨 BLE SOS from ${packet.pilgrimName} (${dist})`);

        // Intense vibration + alert
        Vibration.vibrate([0, 500, 200, 500, 200, 1000]);

        setLastBleReceived({ name: packet.pilgrimName, distance: dist });

        // Upload to Supabase (gateway bridge)
        const { alert: uploadedAlert, error } = await createAlertFromBlePacket(packet);

        if (uploadedAlert) {
          // Add to local alerts list (it will also come via Supabase Realtime)
          setAlerts((prev) => {
            const exists = prev.some((a) => a.id === uploadedAlert.id);
            if (exists) return prev;
            return prioritizeEmergencyAlerts([uploadedAlert, ...prev]);
          });
        }

        Alert.alert(
          '🚨 OFFLINE SOS VIA BLUETOOTH',
          `Pilgrim: ${packet.pilgrimName}\n` +
          `Problem: ${packet.problemType}\n` +
          `Blood Group: ${packet.bloodGroup}\n` +
          `Location: ${packet.latitude.toFixed(4)}, ${packet.longitude.toFixed(4)}\n` +
          `Distance: ${dist}\n\n` +
          (error
            ? `⚠️ Cloud upload failed: ${error}`
            : '✅ Alert uploaded to cloud dashboard.'),
          [
            {
              text: 'Respond Now',
              onPress: () => {
                if (uploadedAlert) handleRespond(uploadedAlert);
              },
            },
            { text: 'Dismiss', style: 'cancel' },
          ],
        );

        // Clear the "received" indicator after 10 seconds
        setTimeout(() => setLastBleReceived(null), 10000);
      }

      if (event.type === 'status_changed') {
        setIsBleScanning(event.status === 'scanning');
      }
    });

    return () => {
      removeBleListener();
      bleMeshManager.stopScanning();
      setIsBleScanning(false);
    };
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    const { alerts: fetchedAlerts, error } = await fetchEmergencyAlerts();
    setIsLoading(false);

    if (!error && fetchedAlerts) {
      setAlerts(fetchedAlerts);
    }
  };

  const handleToggleDuty = () => {
    setIsAvailable((prev) => !prev);
  };

  // ATOMIC CLAIM ACTION (Respond Now)
  const handleRespond = (alertItem: EmergencyAlert) => {
    Alert.alert(
      'Respond to Alert',
      `Do you want to claim and dispatch to ${alertItem.pilgrim_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim & Respond',
          style: 'default',
          onPress: async () => {
            Vibration.vibrate(50);
            const { alert: claimed, alreadyClaimed, claimedBy, error } =
              await claimEmergencyAlert(alertItem.id, currentVolunteer);

            if (alreadyClaimed) {
              Alert.alert(
                'Already Claimed',
                `This emergency alert has already been claimed by ${claimedBy || 'another volunteer'}.`,
              );
              loadAlerts();
              return;
            }

            if (error) {
              Alert.alert('Claim Error', error);
              return;
            }

            if (claimed) {
              // Update state locally
              setAlerts((prev) =>
                prioritizeEmergencyAlerts(prev.map((a) => (a.id === claimed.id ? claimed : a))),
              );

              // Open navigation route
              handleNavigate(claimed);
            }
          },
        },
      ],
    );
  };

  // DIRECT NAVIGATION ROUTE MAP ACTION
  const handleNavigate = (alertItem: EmergencyAlert) => {
    const sosLat = alertItem.latitude || 17.7120;
    const sosLng = alertItem.longitude || 75.2410;
    const route: ClaimedRouteMapData = {
      volunteerLat: sosLat + 0.0022,
      volunteerLng: sosLng - 0.0018,
      sosLat,
      sosLng,
      claimedAt: alertItem.claimed_at || alertItem.updated_at || new Date().toISOString(),
      durationMs: 35000,
      pilgrimName: alertItem.pilgrim_name,
      problemType: alertItem.problem_type,
      distance: alertItem.distance_away || '280m away',
      eta: '~1 min walk',
    };
    const sosData: ActiveSOSMapData = {
      id: alertItem.id,
      lat: sosLat,
      lng: sosLng,
      pilgrimName: alertItem.pilgrim_name,
      problemType: alertItem.problem_type,
      status: alertItem.status,
      responderName: alertItem.responder_name || volunteerName,
      responderPhone: alertItem.responder_phone || volunteerPhone,
      claimedAt: alertItem.claimed_at,
    };
    setActiveClaimedRoute(route);
    setModalActiveSos(sosData);
    setSelectedMapPointId(null);
    setMapModalVisible(true);
  };

  // PREVIEW OTHER VOLUNTEER'S INCIDENT ON MAP (Read-only observation)
  const handlePreviewOtherMap = (alertItem: EmergencyAlert) => {
    const sosLat = alertItem.latitude || 17.7120;
    const sosLng = alertItem.longitude || 75.2410;
    const route: ClaimedRouteMapData = {
      volunteerLat: sosLat + 0.0022,
      volunteerLng: sosLng - 0.0018,
      sosLat,
      sosLng,
      claimedAt: alertItem.claimed_at || alertItem.updated_at || new Date().toISOString(),
      durationMs: 35000,
      pilgrimName: alertItem.pilgrim_name,
      problemType: alertItem.problem_type,
      distance: alertItem.distance_away || '280m away',
      eta: '~1 min walk',
    };
    const sosData: ActiveSOSMapData = {
      id: alertItem.id,
      lat: sosLat,
      lng: sosLng,
      pilgrimName: alertItem.pilgrim_name,
      problemType: alertItem.problem_type,
      status: alertItem.status,
      responderName: alertItem.responder_name || 'Volunteer Responder',
      responderPhone: alertItem.responder_phone,
      claimedAt: alertItem.claimed_at,
    };
    setActiveClaimedRoute(route);
    setModalActiveSos(sosData);
    setSelectedMapPointId(null);
    setMapModalVisible(true);
  };

  // RESOLVE ACTION
  const handleResolve = (alertItem: EmergencyAlert) => {
    Alert.alert(
      'Resolve Emergency',
      `Confirm that ${alertItem.pilgrim_name} has been safely assisted and the incident can be closed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Resolved',
          style: 'destructive',
          onPress: async () => {
            Vibration.vibrate(60);
            const { error } = await resolveEmergencyAlert(
              alertItem.id,
              'Volunteer arrived on scene and stabilized pilgrim.',
              true,
            );

            if (error) {
              Alert.alert('Resolve Error', error);
              return;
            }

            // Immediately remove from active state
            setAlerts((prev) => prev.filter((a) => a.id !== alertItem.id));
            setActiveClaimedRoute(null);
            Alert.alert('Emergency Resolved', 'Incident marked resolved and removed from live database.');
          },
        },
      ],
    );
  };

  const handleCall = (phone?: string, name?: string) => {
    const targetPhone = phone || '+91 94230 11221';
    Vibration.vibrate(30);
    Linking.openURL(`tel:${targetPhone}`).catch(() => {
      Alert.alert('Calling Pilgrim', `Dialing ${targetPhone} for ${name || 'Pilgrim'}...`);
    });
  };

  const handleOpenPOI = (pointId: string) => {
    setActiveClaimedRoute(null);
    setModalActiveSos(null);
    setSelectedMapPointId(pointId);
    setMapModalVisible(true);
  };

  // Dynamically prioritize active queue
  const activeAlerts = prioritizeEmergencyAlerts(alerts.filter((a) => a.status !== 'resolved'));
  const nearbyCount = alerts.filter((a) => a.status === 'nearby').length;
  const nearestAlert = activeAlerts.find((a) => a.status === 'nearby');
  const nearestDistance = nearestAlert?.distance_away || (nearestAlert ? '180m' : null);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  // Active alert claimed exclusively by THIS logged-in volunteer
  const myClaimedAlert = alerts.find((a) => isAlertClaimedByMe(a));

  const myClaimedMapRoute: ClaimedRouteMapData | null = myClaimedAlert
    ? {
        volunteerLat: (myClaimedAlert.latitude || 17.7120) + 0.0022,
        volunteerLng: (myClaimedAlert.longitude || 75.2410) - 0.0018,
        sosLat: myClaimedAlert.latitude || 17.7120,
        sosLng: myClaimedAlert.longitude || 75.2410,
        claimedAt: myClaimedAlert.claimed_at || myClaimedAlert.updated_at || new Date().toISOString(),
        durationMs: 35000,
        pilgrimName: myClaimedAlert.pilgrim_name,
        problemType: myClaimedAlert.problem_type,
        distance: myClaimedAlert.distance_away || '280m away',
        eta: '~1 min walk',
      }
    : null;

  const myActiveSosForMap: ActiveSOSMapData | null = myClaimedAlert
    ? {
        id: myClaimedAlert.id,
        lat: myClaimedAlert.latitude || 17.7120,
        lng: myClaimedAlert.longitude || 75.2410,
        pilgrimName: myClaimedAlert.pilgrim_name,
        problemType: myClaimedAlert.problem_type,
        status: myClaimedAlert.status,
        responderName: myClaimedAlert.responder_name || volunteerName,
        responderPhone: myClaimedAlert.responder_phone || volunteerPhone,
        claimedAt: myClaimedAlert.claimed_at,
      }
    : null;

  // Helper to render distinct priority badges
  const renderPriorityBadge = (alert: EmergencyAlert, isCompact: boolean = false) => {
    const priority =
      alert.priorityData?.priorityLevel ||
      alert.priority_level ||
      (alert.severity === 'critical' ? 'CRITICAL' : 'MODERATE');

    switch (priority) {
      case 'CRITICAL':
        return (
          <View style={[styles.priorityBadgeCritical, isCompact && styles.priorityBadgeCompact]}>
            <View style={styles.priorityPulseDotRed} />
            <Text style={[styles.priorityBadgeTextCritical, isCompact && styles.priorityBadgeTextCompact]}>
              CRITICAL
            </Text>
          </View>
        );
      case 'HIGH':
        return (
          <View style={[styles.priorityBadgeHigh, isCompact && styles.priorityBadgeCompact]}>
            <Ionicons name="flame" size={isCompact ? 10 : 12} color="#C2410C" style={{ marginRight: 2 }} />
            <Text style={[styles.priorityBadgeTextHigh, isCompact && styles.priorityBadgeTextCompact]}>
              HIGH
            </Text>
          </View>
        );
      case 'MODERATE':
        return (
          <View style={[styles.priorityBadgeModerate, isCompact && styles.priorityBadgeCompact]}>
            <Ionicons name="alert-circle" size={isCompact ? 10 : 12} color="#B45309" style={{ marginRight: 2 }} />
            <Text style={[styles.priorityBadgeTextModerate, isCompact && styles.priorityBadgeTextCompact]}>
              MODERATE
            </Text>
          </View>
        );
      case 'LOW':
      default:
        return (
          <View style={[styles.priorityBadgeLow, isCompact && styles.priorityBadgeCompact]}>
            <Text style={[styles.priorityBadgeTextLow, isCompact && styles.priorityBadgeTextCompact]}>
              LOW
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. TOP NAVBAR */}
      <View style={styles.topNavbar}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navIconBtn}
          onPress={loadAlerts}
        >
          <Ionicons name="refresh-outline" size={24} color={colors.maroon} />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>VariRaksha</Text>

        <View style={styles.avatarWrapper}>
          <Image
            source={require('../../../assets/images/volunteer.png')}
            style={styles.avatarImage}
          />
          <View
            style={[
              styles.avatarOnlineDot,
              { backgroundColor: isAvailable ? '#22C55E' : '#EAB308' },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. OPERATIONAL VOLUNTEER STATUS CARD */}
        <View style={styles.statusCard}>
          <View style={styles.statusCardLeft}>
            <Text style={styles.statusLabel}>VOLUNTEER DASHBOARD</Text>
            <Text style={styles.volunteerName}>{volunteerName}</Text>
            <View style={styles.sectorLocationRow}>
              <Ionicons name="location-sharp" size={13} color={colors.maroon} />
              <Text style={styles.sectorLocationText}>
                {assignedSector} · 750m radius
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleToggleDuty}
            style={[
              styles.dutyBadge,
              isAvailable ? styles.dutyBadgeAvailable : styles.dutyBadgeBusy,
            ]}
          >
            <Ionicons
              name={isAvailable ? 'checkmark-circle-outline' : 'pause-circle-outline'}
              size={16}
              color={isAvailable ? '#15803D' : '#B45309'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.dutyBadgeText,
                isAvailable ? styles.dutyTextAvailable : styles.dutyTextBusy,
              ]}
            >
              {isAvailable ? 'Available' : 'Busy'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* BLE MESH SCANNING STATUS BANNER */}
        {isBleScanning && !lastBleReceived && (
          <BleMeshStatusBanner mode="scanning" />
        )}
        {lastBleReceived && (
          <BleMeshStatusBanner
            mode="received"
            pilgrimName={lastBleReceived.name}
            distance={lastBleReceived.distance}
          />
        )}

        {/* 🚨 ACTIVE EMERGENCY DISPATCH CARD (ONLY VISIBLE FOR THE VOLUNTEER WHO CLAIMED IT) */}
        {myClaimedAlert && myClaimedMapRoute && (
          <View style={styles.activeDispatchSectionCard}>
            <View style={styles.activeDispatchHeader}>
              <View style={styles.activeDispatchHeaderLeft}>
                <View style={styles.pulseDotRed} />
                <Text style={styles.activeDispatchTitle}>LIVE EMERGENCY DISPATCH</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleNavigate(myClaimedAlert)}
                style={styles.expandHeaderPill}
              >
                <Text style={styles.expandHeaderPillText}>Full Map</Text>
                <Ionicons name="expand" size={12} color="#0284C7" />
              </TouchableOpacity>
            </View>

            <Text style={styles.activeDispatchSubtext} numberOfLines={1}>
              Navigating to: {myClaimedAlert.pilgrim_name} · {myClaimedAlert.problem_type}
            </Text>

            {/* Embedded Live Synchronized Navigation Map */}
            <View style={styles.topMapEmbedWrapper}>
              <VarkariInteractiveMap
                isFullScreen={false}
                activeSOS={myActiveSosForMap}
                claimedRoute={myClaimedMapRoute}
                onExpand={() => handleNavigate(myClaimedAlert)}
                onCallVolunteer={() => handleCall(myClaimedAlert.pilgrim_phone, myClaimedAlert.pilgrim_name)}
                onResolveSOS={() => handleResolve(myClaimedAlert)}
              />
            </View>

            <View style={styles.topDispatchActionRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleNavigate(myClaimedAlert)}
                style={styles.topDispatchNavBtn}
              >
                <Ionicons name="navigate" size={15} color="#FFFFFF" />
                <Text style={styles.topDispatchNavBtnText}>Open Full Navigation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleCall(myClaimedAlert.pilgrim_phone, myClaimedAlert.pilgrim_name)}
                style={styles.topDispatchCallBtn}
              >
                <Ionicons name="call" size={15} color="#0284C7" />
                <Text style={styles.topDispatchCallBtnText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleResolve(myClaimedAlert)}
                style={styles.topDispatchResolveBtn}
              >
                <Ionicons name="checkmark-done" size={15} color="#15803D" />
                <Text style={styles.topDispatchResolveBtnText}>Resolve</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 3. INCOMING ALERTS SECTION HEADER */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithDot}>
            <Text style={styles.sectionHeading}>Prioritized Response Queue</Text>
            <View style={styles.nearbyCountPill}>
              <Text style={styles.nearbyCountPillText}>{nearbyCount} Nearby</Text>
            </View>
          </View>
          <TouchableOpacity onPress={loadAlerts} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isLoading && <ActivityIndicator size="small" color={colors.maroon} style={{ marginRight: 4 }} />}
            <Text style={styles.liveQueueSubtext}>Live Dynamic Triage</Text>
          </TouchableOpacity>
        </View>

        {/* 4. REALTIME DYNAMIC PRIORITIZED ALERTS STACK */}
        <View style={styles.alertsContainer}>
          {isLoading && alerts.length === 0 ? (
            <View style={styles.emptyQueueCard}>
              <ActivityIndicator size="large" color={colors.maroon} />
              <Text style={[styles.emptyQueueSubtitle, { marginTop: 12 }]}>
                Calculating live response priorities...
              </Text>
            </View>
          ) : activeAlerts.length === 0 ? (
            <View style={styles.emptyQueueCard}>
              <Ionicons name="shield-checkmark" size={36} color="#15803D" />
              <Text style={styles.emptyQueueTitle}>All Clear in {assignedSector}</Text>
              <Text style={styles.emptyQueueSubtitle}>
                No active SOS alerts in your corridor. Stand by for live incoming alerts.
              </Text>
            </View>
          ) : (
            activeAlerts.map((item) => {
              const claimedByMe = isAlertClaimedByMe(item);
              const claimedByOther = isAlertClaimedByOther(item);
              const isCritical = item.severity === 'critical' || item.priority_level === 'CRITICAL';
              const detailNote = item.notes || item.description || '';
              const explanationText =
                item.priorityData?.explanation ||
                item.priority_explanation ||
                (item.medical_context ? `${item.medical_context} · Standard response` : item.problem_type);

              // DIFFERENT COMPACT UI FOR VOLUNTEERS WHO DID NOT CLAIM THIS ALERT
              if (claimedByOther) {
                return (
                  <View key={item.id} style={styles.alertCardCompactOther}>
                    <View style={styles.compactOtherHeader}>
                      <View style={styles.compactOtherLeft}>
                        <View style={styles.compactOtherIconCircle}>
                          <Ionicons name="shield-checkmark" size={16} color="#0284C7" />
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={styles.compactOtherTitleRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                              <Text style={styles.compactOtherPilgrimName}>
                                {item.pilgrim_name}
                                {item.pilgrim_age ? `, ${item.pilgrim_age}` : ''}
                              </Text>
                              {renderPriorityBadge(item, true)}
                            </View>
                            <Text style={styles.compactOtherTimestamp}>
                              {formatTimeAgo(item.created_at)}
                            </Text>
                          </View>

                          <Text style={styles.compactOtherSubtext} numberOfLines={1}>
                            ⚠️ {item.problem_type}
                            {detailNote ? ` (${detailNote})` : ''}
                          </Text>

                          <View style={styles.compactOtherBadgeRow}>
                            <View style={styles.compactClaimedByBadge}>
                              <Ionicons name="person" size={10} color="#0369A1" style={{ marginRight: 3 }} />
                              <Text style={styles.compactClaimedByText}>
                                Claimed by {item.responder_name || 'Volunteer'}
                              </Text>
                            </View>
                            <Text style={styles.compactLocationText}>
                              · {item.location_name || 'Corridor'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Small Minimal View Map Button */}
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => handlePreviewOtherMap(item)}
                        style={styles.compactViewMapBtn}
                      >
                        <Ionicons name="map-outline" size={13} color="#0284C7" />
                        <Text style={styles.compactViewMapBtnText}>Map</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              // FULL EXPANDED CARD FOR NEW INCOMING ALERTS OR ALERTS CLAIMED BY THIS VOLUNTEER
              return (
                <View
                  key={item.id}
                  style={[
                    styles.alertCard,
                    isCritical
                      ? styles.alertCardCritical
                      : claimedByMe
                      ? styles.alertCardInProgress
                      : styles.alertCardMobility,
                  ]}
                >
                  {/* In Progress Status Badge */}
                  {claimedByMe && (
                    <View style={styles.inProgressBadge}>
                      <Ionicons
                        name="checkmark"
                        size={13}
                        color="#FFFFFF"
                        style={{ marginRight: 3 }}
                      />
                      <Text style={styles.inProgressBadgeText}>In Progress</Text>
                    </View>
                  )}

                  {/* Header: Avatar icon, Name, Priority Badge, Timestamp, Location */}
                  <View style={styles.alertCardHeader}>
                    <View
                      style={[
                        styles.alertIconCircle,
                        isCritical
                          ? styles.alertIconCircleRed
                          : claimedByMe
                          ? styles.alertIconCircleBlue
                          : styles.alertIconCircleAmber,
                      ]}
                    >
                      {isCritical ? (
                        <MaterialIcons name="medical-services" size={22} color="#DC2626" />
                      ) : claimedByMe ? (
                        <Ionicons name="water-outline" size={22} color="#0284C7" />
                      ) : (
                        <FontAwesome5 name="hands-helping" size={18} color="#FFFFFF" />
                      )}
                    </View>

                    <View style={styles.alertInfoTextGroup}>
                      <View style={styles.titleWithTimestampRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                          <Text style={styles.pilgrimName}>
                            {item.pilgrim_name}
                            {item.pilgrim_age ? `, ${item.pilgrim_age}` : ''}
                          </Text>
                          {renderPriorityBadge(item)}
                        </View>
                        <Text style={[styles.timestampText, claimedByMe && { marginRight: 85 }]}>
                          {formatTimeAgo(item.created_at)}
                        </Text>
                      </View>
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={13} color="#6B7280" />
                        <Text style={styles.locationText}>
                          {item.distance_away || 'Live SOS'} · {item.location_name || 'Corridor'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Distress Reason Box */}
                  <View
                    style={[
                      styles.reasonBox,
                      claimedByMe && styles.reasonBoxBlue,
                    ]}
                  >
                    <Text
                      style={[
                        styles.reasonText,
                        claimedByMe && styles.reasonTextBlue,
                      ]}
                    >
                      ⚠️ {item.problem_type}
                      {detailNote ? ` (${detailNote})` : ''}
                    </Text>
                  </View>

                  {/* Dynamic Priority Explanation Tag / Triage Factors */}
                  {explanationText && (
                    <View style={styles.priorityExplanationBanner}>
                      <Ionicons name="speedometer-outline" size={13} color="#475569" style={{ marginRight: 5 }} />
                      <Text style={styles.priorityExplanationText} numberOfLines={1}>
                        {explanationText}
                      </Text>
                    </View>
                  )}

                  {/* Medical Context / Tags */}
                  <View style={styles.tagsRow}>
                    {item.medical_context && (
                      <View style={styles.tagPill}>
                        <Text style={styles.tagPillText}>🏥 {item.medical_context}</Text>
                      </View>
                    )}
                    {item.dindi_name && (
                      <View style={styles.tagPill}>
                        <Text style={styles.tagPillText}>🚩 {item.dindi_name}</Text>
                      </View>
                    )}
                  </View>

                  {/* Primary Actions Based on Claim State */}
                  {claimedByMe ? (
                    <View>
                      <View style={styles.claimedByYouBanner}>
                        <Ionicons name="shield-checkmark" size={14} color="#15803D" style={{ marginRight: 4 }} />
                        <Text style={styles.claimedByYouBannerText}>
                          Claimed by you · En Route
                        </Text>
                      </View>

                      <View style={styles.claimedActionRow}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleNavigate(item)}
                          style={styles.claimedActionBtn}
                        >
                          <Ionicons name="navigate-outline" size={15} color="#0369A1" />
                          <Text style={styles.claimedActionBtnText}>Navigate</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleCall(item.pilgrim_phone, item.pilgrim_name)}
                          style={styles.claimedActionBtn}
                        >
                          <Ionicons name="call-outline" size={15} color="#0369A1" />
                          <Text style={styles.claimedActionBtnText}>Call</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleResolve(item)}
                          style={[styles.claimedActionBtn, styles.claimedResolveBtn]}
                        >
                          <Ionicons name="checkmark-done" size={15} color="#15803D" />
                          <Text style={[styles.claimedActionBtnText, { color: '#15803D' }]}>
                            Resolve
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleRespond(item)}
                      style={[
                        styles.respondNowButton,
                        isCritical && styles.respondNowButtonCritical,
                      ]}
                    >
                      <FontAwesome5
                        name="running"
                        size={15}
                        color="#FFFFFF"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.respondNowButtonText}>
                        {isCritical ? 'Respond to Critical SOS · Immediate' : 'Respond Now · ~1 min walk'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* 5. AREA OVERVIEW & MAP SECTION */}
        <View style={styles.areaHeaderRow}>
          <View>
            <Text style={styles.areaHeading}>Area Overview</Text>
            <Text style={styles.areaSubtext}>
              {assignedSector} · {nearestDistance ? `Nearest SOS ${nearestDistance}` : 'No active alerts'}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              setActiveClaimedRoute(null);
              setModalActiveSos(null);
              setSelectedMapPointId(null);
              setMapModalVisible(true);
            }}
            style={styles.viewFullMapBtn}
          >
            <Text style={styles.viewFullMapText}>View full map</Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color="#9A3412"
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>

        {/* Map Preview Container with Legend */}
        <View style={styles.mapPreviewWrapper}>
          <VarkariInteractiveMap
            isFullScreen={false}
            activeSOS={myActiveSosForMap}
            claimedRoute={myClaimedMapRoute}
            onExpand={() => {
              setSelectedMapPointId(null);
              setMapModalVisible(true);
            }}
            onCallVolunteer={() => {
              if (myClaimedAlert) handleCall(myClaimedAlert.pilgrim_phone, myClaimedAlert.pilgrim_name);
            }}
            onResolveSOS={() => {
              if (myClaimedAlert) handleResolve(myClaimedAlert);
            }}
          />

          {/* Floating Map Legend Overlay */}
          <View style={styles.mapLegendOverlay}>
            <View style={styles.legendRow}>
              <View style={styles.legendDotGreen} />
              <Text style={styles.legendText}>You ({assignedSector.split(' ')[0]})</Text>
            </View>
            <View style={[styles.legendRow, { marginTop: 4 }]}>
              <View style={styles.legendDotRed} />
              <Text style={styles.legendText}>
                {nearbyCount} Nearby Alert{nearbyCount === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick POI Chips */}
        <View style={styles.poiChipsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleOpenPOI('med-1')}
            style={styles.poiChip}
          >
            <Text style={styles.poiChipEmoji}>🏥</Text>
            <Text style={styles.poiChipText}>Medical (350m)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleOpenPOI('wat-1')}
            style={styles.poiChip}
          >
            <Text style={styles.poiChipEmoji}>💧</Text>
            <Text style={styles.poiChipText}>Water (150m)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleOpenPOI('food-1')}
            style={styles.poiChip}
          >
            <Text style={styles.poiChipEmoji}>🍲</Text>
            <Text style={styles.poiChipText}>Annachhatra (400m)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Full Map Modal with Route Navigation Line */}
      <VarkariMapModal
        visible={mapModalVisible}
        onClose={() => {
          setMapModalVisible(false);
          setActiveClaimedRoute(null);
          setModalActiveSos(null);
        }}
        initialPointId={selectedMapPointId}
        activeSOS={modalActiveSos || myActiveSosForMap}
        claimedRoute={activeClaimedRoute || myClaimedMapRoute}
        onCallVolunteer={(phone) => handleCall(phone)}
        onResolveSOS={() => {
          if (myClaimedAlert) handleResolve(myClaimedAlert);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF5ED',
  },
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FAF5ED',
  },
  navIconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: '#5D001E',
    letterSpacing: 0.3,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#EFE8DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: spacing.md,
  },
  statusCardLeft: {
    flex: 1,
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  volunteerName: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: '#1C1917',
    marginBottom: 4,
  },
  sectorLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectorLocationText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 3,
  },
  dutyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  dutyBadgeAvailable: {
    backgroundColor: '#DCFCE7',
  },
  dutyBadgeBusy: {
    backgroundColor: '#FEF3C7',
  },
  dutyBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dutyTextAvailable: {
    color: '#15803D',
  },
  dutyTextBusy: {
    color: '#B45309',
  },
  activeDispatchSectionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  activeDispatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeDispatchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    marginRight: 6,
  },
  activeDispatchTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.6,
  },
  expandHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  expandHeaderPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  activeDispatchSubtext: {
    fontSize: 13,
    color: '#F1F5F9',
    fontWeight: '700',
    marginBottom: 10,
  },
  topMapEmbedWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  topDispatchActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  topDispatchNavBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  topDispatchNavBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  topDispatchCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  topDispatchCallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  topDispatchResolveBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#064E3B',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  topDispatchResolveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: typography.fontWeight.bold,
    color: '#1C1917',
    marginRight: 8,
  },
  nearbyCountPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  nearbyCountPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  liveQueueSubtext: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  alertsContainer: {
    gap: 12,
    marginBottom: spacing.lg,
  },
  emptyQueueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFE8DE',
  },
  emptyQueueTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 8,
  },
  emptyQueueSubtitle: {
    fontSize: 13,
    color: '#78716C',
    textAlign: 'center',
    marginTop: 4,
  },

  // PRIORITY BADGES
  priorityBadgeCritical: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityBadgeHigh: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityBadgeModerate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    borderColor: '#FDE047',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityBadgeLow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  priorityPulseDotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginRight: 4,
  },
  priorityBadgeTextCritical: {
    fontSize: 10,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  priorityBadgeTextHigh: {
    fontSize: 10,
    fontWeight: '900',
    color: '#C2410C',
    letterSpacing: 0.5,
  },
  priorityBadgeTextModerate: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.4,
  },
  priorityBadgeTextLow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.4,
  },
  priorityBadgeTextCompact: {
    fontSize: 9,
  },

  // PRIORITY EXPLANATION BANNER
  priorityExplanationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  priorityExplanationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },

  // COMPACT CARD FOR ALERTS CLAIMED BY ANOTHER VOLUNTEER
  alertCardCompactOther: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  compactOtherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactOtherLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 10,
  },
  compactOtherIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  compactOtherTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  compactOtherPilgrimName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  compactOtherTimestamp: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  compactOtherSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  compactOtherBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  compactClaimedByBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  compactClaimedByText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  compactLocationText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 4,
  },
  compactViewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 4,
  },
  compactViewMapBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },

  // FULL CARD FOR NEW ALERTS OR OWN CLAIMED ALERTS
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  alertCardCritical: {
    borderLeftWidth: 5,
    borderLeftColor: '#DC2626',
  },
  alertCardInProgress: {
    borderLeftWidth: 5,
    borderLeftColor: '#0284C7',
    backgroundColor: '#FBFDFF',
  },
  alertCardMobility: {
    borderLeftWidth: 5,
    borderLeftColor: '#D97706',
  },
  inProgressBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 5,
  },
  inProgressBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertIconCircleRed: {
    backgroundColor: '#FEE2E2',
  },
  alertIconCircleBlue: {
    backgroundColor: '#E0F2FE',
  },
  alertIconCircleAmber: {
    backgroundColor: '#D97706',
  },
  alertInfoTextGroup: {
    flex: 1,
  },
  titleWithTimestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pilgrimName: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: '#1C1917',
  },
  timestampText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 3,
    fontWeight: '500',
  },
  reasonBox: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  reasonBoxBlue: {
    backgroundColor: '#F0F9FF',
  },
  reasonText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
  },
  reasonTextBlue: {
    color: '#0369A1',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  respondNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  respondNowButtonCritical: {
    backgroundColor: '#B91C1C',
  },
  respondNowButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  claimedByYouBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  claimedByYouBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  claimedActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  claimedActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  claimedResolveBtn: {
    backgroundColor: '#DCFCE7',
  },
  claimedActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  areaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  areaHeading: {
    fontSize: 17,
    fontWeight: typography.fontWeight.bold,
    color: '#1C1917',
  },
  areaSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  viewFullMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewFullMapText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9A3412',
  },
  mapPreviewWrapper: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mapLegendOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFE5D8',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  legendDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  poiChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  poiChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE8DE',
    gap: 4,
  },
  poiChipEmoji: {
    fontSize: 14,
  },
  poiChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
});

export default VolunteerDashboardScreen;
