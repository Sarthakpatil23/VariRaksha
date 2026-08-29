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
import { VarkariInteractiveMap, ClaimedRouteMapData } from '../../components/map/VarkariInteractiveMap';
import { VarkariMapModal } from '../../components/map/VarkariMapModal';
import {
  fetchEmergencyAlerts,
  claimEmergencyAlert,
  resolveEmergencyAlert,
  subscribeToEmergencyAlerts,
  EmergencyAlert,
} from '../../services/alertService';

// Default initial alerts in case DB is newly initialized or offline
const INITIAL_DEFAULT_ALERTS: EmergencyAlert[] = [
  {
    id: 'e1111111-1111-1111-1111-111111111101',
    pilgrim_name: 'Ramesh Kulkarni',
    pilgrim_phone: '+91 94230 11221',
    pilgrim_age: 68,
    pilgrim_gender: 'Male',
    dindi_name: 'Sant Tukaram Maharaj Dindi #04',
    problem_type: 'Severe Chest Discomfort & High Blood Pressure',
    medical_context: 'Hypertension · Cardiac Stent (2021) · Blood Group B+',
    severity: 'critical',
    status: 'nearby',
    distance_away: '180m away',
    location_name: 'Wakhari Main Gate',
    latitude: 17.6862,
    longitude: 75.3225,
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: 'e2222222-2222-2222-2222-222222222202',
    pilgrim_name: 'Anita Desai',
    pilgrim_phone: '+91 94230 10002',
    pilgrim_age: 54,
    pilgrim_gender: 'Female',
    dindi_name: 'Alandi Dindi #12',
    problem_type: 'Acute Dehydration & Heat Exhaustion',
    medical_context: 'Dehydration · Blood Group O+',
    severity: 'moderate',
    status: 'in_progress',
    distance_away: '50m away',
    location_name: 'Water Station 2',
    latitude: 17.6845,
    longitude: 75.3195,
    responder_id: 'vol-rajwardhan',
    responder_name: 'Rajwardhan Patil',
    responder_phone: '+91 98221 55660',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'e3333333-3333-3333-3333-333333333303',
    pilgrim_name: 'Suresh Patil',
    pilgrim_phone: '+91 94230 40003',
    pilgrim_age: 62,
    pilgrim_gender: 'Male',
    dindi_name: 'Dindi #01',
    problem_type: 'Wheelchair Assistance Needed at Pavilion',
    medical_context: 'Mobility Assist · Blood Group A+',
    severity: 'moderate',
    status: 'nearby',
    distance_away: '320m away',
    location_name: 'Rest Pavilion',
    latitude: 17.6875,
    longitude: 75.3240,
    created_at: new Date(Date.now() - 14 * 60000).toISOString(),
  },
];

export const VolunteerDashboardScreen: React.FC<
  VolunteerTabScreenProps<'VolunteerDashboard'>
> = () => {
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(INITIAL_DEFAULT_ALERTS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mapModalVisible, setMapModalVisible] = useState<boolean>(false);
  const [selectedMapPointId, setSelectedMapPointId] = useState<string | null>(null);
  const [activeClaimedRoute, setActiveClaimedRoute] = useState<ClaimedRouteMapData | null>(null);

  const currentVolunteer = {
    id: 'vol-rajwardhan',
    name: 'Rajwardhan Patil',
    phone: '+91 98221 55660',
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
          if (exists) return prev;
          return [newAlert, ...prev];
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedAlert = payload.new as EmergencyAlert;
        setAlerts((prev) =>
          prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a)),
        );
      } else if (payload.eventType === 'DELETE') {
        setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
      }
    });

    // 2. Fast 3.5s Polling Fallback to guarantee delivery even if mobile socket sleeps
    const pollInterval = setInterval(() => {
      fetchEmergencyAlerts().then(({ alerts: freshAlerts, error }) => {
        if (!error && freshAlerts && freshAlerts.length > 0) {
          setAlerts((prev) => {
            // Check if there are newly added alerts that we haven't seen yet
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

  const loadAlerts = async () => {
    setIsLoading(true);
    const { alerts: fetchedAlerts, error } = await fetchEmergencyAlerts();
    setIsLoading(false);

    if (!error && fetchedAlerts.length > 0) {
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
                `This emergency alert is already being handled by ${claimedBy || 'another volunteer'}.`,
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
                prev.map((a) => (a.id === claimed.id ? claimed : a)),
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
    const route: ClaimedRouteMapData = {
      volunteerLat: 17.6854,
      volunteerLng: 75.3211,
      sosLat: alertItem.latitude || 17.7120,
      sosLng: alertItem.longitude || 75.2410,
      pilgrimName: alertItem.pilgrim_name,
      problemType: alertItem.problem_type,
      distance: alertItem.distance_away || '180m away',
      eta: '~2 min walk',
    };
    setActiveClaimedRoute(route);
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
            const { alert: resolved, error } = await resolveEmergencyAlert(
              alertItem.id,
              'Volunteer arrived on scene and stabilized pilgrim.',
            );

            if (error) {
              Alert.alert('Resolve Error', error);
              return;
            }

            if (resolved) {
              setAlerts((prev) =>
                prev.map((a) => (a.id === resolved.id ? resolved : a)),
              );
              Alert.alert('Emergency Resolved', 'Incident marked as completed.');
            }
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
    setSelectedMapPointId(pointId);
    setMapModalVisible(true);
  };

  // Filter active incoming / in-progress alerts
  const activeAlerts = alerts.filter((a) => a.status !== 'resolved');
  const nearbyCount = alerts.filter((a) => a.status === 'nearby').length;

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  // Find if there is an active claimed alert by this volunteer
  const currentlyClaimedAlert = alerts.find(
    (a) =>
      a.status === 'in_progress' &&
      (a.responder_id === currentVolunteer.id ||
        a.responder_name?.toLowerCase() === currentVolunteer.name.toLowerCase()),
  );

  const currentMapRoute: ClaimedRouteMapData | null =
    activeClaimedRoute ||
    (currentlyClaimedAlert
      ? {
          volunteerLat: 17.6854,
          volunteerLng: 75.3211,
          sosLat: currentlyClaimedAlert.latitude || 17.7120,
          sosLng: currentlyClaimedAlert.longitude || 75.2410,
          pilgrimName: currentlyClaimedAlert.pilgrim_name,
          problemType: currentlyClaimedAlert.problem_type,
          distance: currentlyClaimedAlert.distance_away || '180m away',
          eta: '~2 min walk',
        }
      : null);

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
            <Text style={styles.volunteerName}>Rajwardhan Patil</Text>
            <View style={styles.sectorLocationRow}>
              <Ionicons name="location-sharp" size={13} color={colors.maroon} />
              <Text style={styles.sectorLocationText}>
                Sector 1 (Alankapuram) · 750m radius
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

        {/* 3. INCOMING ALERTS SECTION HEADER */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithDot}>
            <Text style={styles.sectionHeading}>Incoming Alerts</Text>
            <View style={styles.nearbyCountPill}>
              <Text style={styles.nearbyCountPillText}>{nearbyCount} Nearby</Text>
            </View>
          </View>
          <TouchableOpacity onPress={loadAlerts} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isLoading && <ActivityIndicator size="small" color={colors.maroon} style={{ marginRight: 4 }} />}
            <Text style={styles.liveQueueSubtext}>Live Dispatch Queue</Text>
          </TouchableOpacity>
        </View>

        {/* 4. REALTIME DYNAMIC ALERTS STACK */}
        <View style={styles.alertsContainer}>
          {activeAlerts.length === 0 ? (
            <View style={styles.emptyQueueCard}>
              <Ionicons name="shield-checkmark" size={36} color="#15803D" />
              <Text style={styles.emptyQueueTitle}>All Clear in Sector 1</Text>
              <Text style={styles.emptyQueueSubtitle}>
                No active SOS alerts in your corridor. Stand by for live notifications.
              </Text>
            </View>
          ) : (
            activeAlerts.map((item) => {
              const isClaimedByMe =
                item.responder_id === currentVolunteer.id ||
                item.responder_name?.toLowerCase() === currentVolunteer.name.toLowerCase();
              const isClaimedByOther = item.status === 'in_progress' && !isClaimedByMe;
              const isCritical = item.severity === 'critical';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.alertCard,
                    isCritical
                      ? styles.alertCardCritical
                      : item.status === 'in_progress'
                      ? styles.alertCardInProgress
                      : styles.alertCardMobility,
                  ]}
                >
                  {/* In Progress Status Badge */}
                  {item.status === 'in_progress' && (
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

                  {/* Header: Avatar icon, Name, Timestamp, Location */}
                  <View style={styles.alertCardHeader}>
                    <View
                      style={[
                        styles.alertIconCircle,
                        isCritical
                          ? styles.alertIconCircleRed
                          : item.status === 'in_progress'
                          ? styles.alertIconCircleBlue
                          : styles.alertIconCircleAmber,
                      ]}
                    >
                      {isCritical ? (
                        <MaterialIcons name="medical-services" size={22} color="#DC2626" />
                      ) : item.status === 'in_progress' ? (
                        <Ionicons name="water-outline" size={22} color="#0284C7" />
                      ) : (
                        <FontAwesome5 name="hands-helping" size={18} color="#FFFFFF" />
                      )}
                    </View>

                    <View style={styles.alertInfoTextGroup}>
                      <View style={styles.titleWithTimestampRow}>
                        <Text style={styles.pilgrimName}>
                          {item.pilgrim_name}
                          {item.pilgrim_age ? `, ${item.pilgrim_age}` : ''}
                        </Text>
                        <Text style={[styles.timestampText, item.status === 'in_progress' && { marginRight: 85 }]}>
                          {formatTimeAgo(item.created_at)}
                        </Text>
                      </View>
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={13} color="#6B7280" />
                        <Text style={styles.locationText}>
                          {item.distance_away || '180m away'} · {item.location_name || 'Sector 1'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Distress Reason Box */}
                  <View
                    style={[
                      styles.reasonBox,
                      item.status === 'in_progress' && styles.reasonBoxBlue,
                    ]}
                  >
                    <Text
                      style={[
                        styles.reasonText,
                        item.status === 'in_progress' && styles.reasonTextBlue,
                      ]}
                    >
                      ⚠️ {item.problem_type}
                      {item.description ? ` (${item.description})` : ''}
                    </Text>
                  </View>

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

                  {/* Primary Actions Based on Lifecycle State */}
                  {isClaimedByMe ? (
                    <View>
                      <View style={styles.claimedByYouBanner}>
                        <Ionicons name="shield-checkmark" size={14} color="#15803D" style={{ marginRight: 4 }} />
                        <Text style={styles.claimedByYouBannerText}>Claimed by you</Text>
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
                  ) : isClaimedByOther ? (
                    <View style={styles.claimedByOtherBanner}>
                      <Text style={styles.claimedByOtherBannerText}>
                        Claimed by {item.responder_name || 'another responder'}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleRespond(item)}
                      style={styles.respondNowButton}
                    >
                      <FontAwesome5
                        name="running"
                        size={15}
                        color="#FFFFFF"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.respondNowButtonText}>
                        Respond Now · ~2 min walk
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
            <Text style={styles.areaSubtext}>Sector 1 Corridor · Nearest SOS 180m</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              setActiveClaimedRoute(null);
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
            claimedRoute={currentMapRoute}
            onExpand={() => {
              setSelectedMapPointId(null);
              setMapModalVisible(true);
            }}
          />

          {/* Floating Map Legend Overlay */}
          <View style={styles.mapLegendOverlay}>
            <View style={styles.legendRow}>
              <View style={styles.legendDotGreen} />
              <Text style={styles.legendText}>You (Sector 1)</Text>
            </View>
            <View style={[styles.legendRow, { marginTop: 4 }]}>
              <View style={styles.legendDotRed} />
              <Text style={styles.legendText}>{nearbyCount} Nearby Alerts</Text>
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
        }}
        initialPointId={selectedMapPointId}
        claimedRoute={currentMapRoute}
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
    marginBottom: 10,
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
  claimedByOtherBanner: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  claimedByOtherBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
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
