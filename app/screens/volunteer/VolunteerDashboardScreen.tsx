import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { VolunteerTabScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';
import { VarkariInteractiveMap } from '../../components/map/VarkariInteractiveMap';
import { VarkariMapModal } from '../../components/map/VarkariMapModal';

export const VolunteerDashboardScreen: React.FC<
  VolunteerTabScreenProps<'VolunteerDashboard'>
> = () => {
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [mapModalVisible, setMapModalVisible] = useState<boolean>(false);
  const [selectedMapPointId, setSelectedMapPointId] = useState<string | null>(null);
  const [claimedAlerts, setClaimedAlerts] = useState<Record<string, boolean>>({
    'alt-anita': true, // Anita Desai is currently claimed in progress
  });

  const handleToggleDuty = () => {
    setIsAvailable((prev) => !prev);
  };

  const handleRespond = (name: string, id: string) => {
    Alert.alert(
      'Respond to Alert',
      `Do you want to claim the alert for ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim & Respond',
          style: 'default',
          onPress: () => {
            setClaimedAlerts((prev) => ({ ...prev, [id]: true }));
          },
        },
      ],
    );
  };

  const handleCall = (name: string) => {
    Alert.alert('Calling Pilgrim', `Dialing registered emergency contact for ${name}...`);
  };

  const handleOpenPOI = (pointId: string) => {
    setSelectedMapPointId(pointId);
    setMapModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. TOP NAVBAR */}
      <View style={styles.topNavbar}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navIconBtn}
          onPress={() => {}}
        >
          <Ionicons name="menu-outline" size={26} color={colors.maroon} />
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
              <Text style={styles.nearbyCountPillText}>3 Nearby</Text>
            </View>
          </View>
          <Text style={styles.liveQueueSubtext}>Live Dispatch Queue</Text>
        </View>

        {/* 4. ALERTS STACK */}
        <View style={styles.alertsContainer}>
          {/* ALERT CARD 1: RAMESH KULKARNI, 68 (Critical) */}
          <View style={[styles.alertCard, styles.alertCardCritical]}>
            <View style={styles.alertCardHeader}>
              <View style={styles.alertIconCircleRed}>
                <MaterialIcons name="medical-services" size={24} color="#DC2626" />
              </View>
              <View style={styles.alertInfoTextGroup}>
                <View style={styles.titleWithTimestampRow}>
                  <Text style={styles.pilgrimName}>Ramesh Kulkarni, 68</Text>
                  <Text style={styles.timestampText}>2m ago</Text>
                </View>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={13} color="#6B7280" />
                  <Text style={styles.locationText}>180m away · Wakhari Main Gate</Text>
                </View>
              </View>
            </View>

            {/* Emergency Distress Reason Snippet */}
            <View style={styles.reasonBox}>
              <Text style={styles.reasonText}>
                ⚠️ Severe Chest Discomfort & High Blood Pressure
              </Text>
            </View>

            {/* Tags: Important info in short */}
            <View style={styles.tagsRow}>
              <View style={styles.tagPill}>
                <Text style={styles.tagPillText}>🫀 Hypertension</Text>
              </View>
              <View style={styles.tagPill}>
                <Text style={styles.tagPillText}>🩸 B+</Text>
              </View>
              <View style={styles.tagPill}>
                <Text style={styles.tagPillText}>🚩 Dindi #04</Text>
              </View>
            </View>

            {/* Primary Action Button */}
            {claimedAlerts['alt-ramesh'] ? (
              <View style={styles.claimedByYouBanner}>
                <Text style={styles.claimedByYouBannerText}>Claimed by you</Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleRespond('Ramesh Kulkarni', 'alt-ramesh')}
                style={styles.respondNowButton}
              >
                <FontAwesome5
                  name="running"
                  size={15}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.respondNowButtonText}>Respond Now · ~2 min walk</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ALERT CARD 2: ANITA DESAI, 54 (In Progress / Claimed) */}
          <View style={[styles.alertCard, styles.alertCardInProgress]}>
            {/* Top Right In Progress Badge */}
            <View style={styles.inProgressBadge}>
              <Ionicons
                name="checkmark"
                size={13}
                color="#FFFFFF"
                style={{ marginRight: 3 }}
              />
              <Text style={styles.inProgressBadgeText}>In Progress</Text>
            </View>

            <View style={styles.alertCardHeader}>
              <View style={styles.alertIconCircleBlue}>
                <Ionicons name="water-outline" size={24} color="#0284C7" />
              </View>
              <View style={styles.alertInfoTextGroup}>
                <View style={styles.titleWithTimestampRow}>
                  <Text style={styles.pilgrimName}>Anita Desai, 54</Text>
                  <Text style={[styles.timestampText, { marginRight: 85 }]}>5m ago</Text>
                </View>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={13} color="#6B7280" />
                  <Text style={styles.locationText}>50m away · Water Station 2</Text>
                </View>
              </View>
            </View>

            {/* Distress Reason */}
            <View style={styles.reasonBoxBlue}>
              <Text style={styles.reasonTextBlue}>
                💧 Acute Dehydration & Heat Exhaustion
              </Text>
            </View>

            {/* Tags */}
            <View style={styles.tagsRow}>
              <View style={styles.tagPillBlue}>
                <Text style={styles.tagPillBlueText}>🩸 O+</Text>
              </View>
              <View style={styles.tagPillBlue}>
                <Text style={styles.tagPillBlueText}>Dehydration</Text>
              </View>
              <View style={styles.tagPillBlue}>
                <Text style={styles.tagPillBlueText}>🚩 Dindi #12</Text>
              </View>
            </View>

            {/* Action Buttons for Claimed State */}
            <View style={styles.claimedActionRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedMapPointId('med-1');
                  setMapModalVisible(true);
                }}
                style={styles.claimedActionBtn}
              >
                <Ionicons name="navigate-outline" size={15} color="#0369A1" />
                <Text style={styles.claimedActionBtnText}>Navigate (50m)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleCall('Anita Desai')}
                style={styles.claimedActionBtn}
              >
                <Ionicons name="call-outline" size={15} color="#0369A1" />
                <Text style={styles.claimedActionBtnText}>Call Pilgrim</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ALERT CARD 3: SURESH PATIL, 62 (Mobility Assist) */}
          <View style={[styles.alertCard, styles.alertCardMobility]}>
            <View style={styles.alertCardHeader}>
              <View style={styles.alertIconCircleAmber}>
                <FontAwesome5 name="wheelchair" size={19} color="#FFFFFF" />
              </View>
              <View style={styles.alertInfoTextGroup}>
                <View style={styles.titleWithTimestampRow}>
                  <Text style={styles.pilgrimName}>Suresh Patil, 62</Text>
                  <Text style={styles.timestampText}>14m ago</Text>
                </View>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={13} color="#6B7280" />
                  <Text style={styles.locationText}>320m away · Rest Pavilion</Text>
                </View>
              </View>
            </View>

            {/* Distress Reason */}
            <View style={styles.reasonBoxAmber}>
              <Text style={styles.reasonTextAmber}>
                ♿ Wheelchair Assistance Needed at Pavilion
              </Text>
            </View>

            {/* Tags */}
            <View style={styles.tagsRow}>
              <View style={styles.tagPillAmber}>
                <Text style={styles.tagPillAmberText}>Mobility Assist</Text>
              </View>
              <View style={styles.tagPillAmber}>
                <Text style={styles.tagPillAmberText}>🩸 A+</Text>
              </View>
              <View style={styles.tagPillAmber}>
                <Text style={styles.tagPillAmberText}>🚩 Dindi #01</Text>
              </View>
            </View>

            {/* Primary Action Button */}
            {claimedAlerts['alt-suresh'] ? (
              <View style={styles.claimedByYouBanner}>
                <Text style={styles.claimedByYouBannerText}>Claimed by you</Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleRespond('Suresh Patil', 'alt-suresh')}
                style={styles.respondNowButton}
              >
                <FontAwesome5
                  name="running"
                  size={15}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.respondNowButtonText}>Respond Now · ~4 min walk</Text>
              </TouchableOpacity>
            )}
          </View>
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
              <Text style={styles.legendText}>3 Nearby Alerts</Text>
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

      {/* Full Map Modal */}
      <VarkariMapModal
        visible={mapModalVisible}
        onClose={() => setMapModalVisible(false)}
        initialPointId={selectedMapPointId}
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
  },
  volunteerName: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    color: '#1C1B1F',
    marginTop: 2,
  },
  sectorLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  sectorLocationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 3,
  },
  dutyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  dutyBadgeAvailable: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  dutyBadgeBusy: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  dutyBadgeText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
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
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  sectionTitleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 21,
    fontWeight: typography.fontWeight.bold,
    color: '#1C1B1F',
  },
  nearbyCountPill: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  nearbyCountPillText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  liveQueueSubtext: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: typography.fontWeight.medium,
  },
  alertsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  alertCardCritical: {
    borderLeftWidth: 4,
    borderLeftColor: '#C2410C',
  },
  alertCardInProgress: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  alertCardMobility: {
    borderLeftWidth: 4,
    borderLeftColor: '#854D0E',
  },
  inProgressBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomLeftRadius: 14,
  },
  inProgressBadgeText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertIconCircleRed: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  alertIconCircleBlue: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  alertIconCircleAmber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#854D0E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: '#1C1B1F',
  },
  timestampText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: typography.fontWeight.medium,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 3,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  reasonBox: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  reasonText: {
    fontSize: 13,
    color: '#9A3412',
    fontWeight: typography.fontWeight.medium,
  },
  reasonBoxBlue: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  reasonTextBlue: {
    fontSize: 13,
    color: '#0369A1',
    fontWeight: typography.fontWeight.medium,
  },
  reasonBoxAmber: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  reasonTextAmber: {
    fontSize: 13,
    color: '#78350F',
    fontWeight: typography.fontWeight.medium,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  tagPill: {
    backgroundColor: '#F5F5F4',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
    color: '#44403C',
  },
  tagPillBlue: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  tagPillBlueText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
    color: '#0369A1',
  },
  tagPillAmber: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tagPillAmberText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
    color: '#78350F',
  },
  respondNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8C4A00',
    height: 48,
    borderRadius: 14,
    shadowColor: '#8C4A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  respondNowButtonText: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  claimedActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  claimedActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 6,
  },
  claimedActionBtnText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: '#0369A1',
  },
  claimedByYouBanner: {
    height: 46,
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimedByYouBannerText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: '#0369A1',
  },
  areaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    marginTop: 4,
  },
  areaHeading: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    color: '#1C1B1F',
  },
  areaSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  viewFullMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  viewFullMapText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: '#9A3412',
  },
  mapPreviewWrapper: {
    height: 190,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    marginBottom: spacing.sm,
  },
  mapLegendOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  legendDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  legendText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: '#1C1B1F',
  },
  poiChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  poiChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE8DE',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  poiChipEmoji: {
    fontSize: 13,
  },
  poiChipText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: '#1C1B1F',
  },
});

export default VolunteerDashboardScreen;
