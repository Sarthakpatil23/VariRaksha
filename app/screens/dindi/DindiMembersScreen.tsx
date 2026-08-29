import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DindiLeaderTabScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';
import { DindiMember } from '../../types';

interface ExtendedDindiMember extends DindiMember {
  bloodGroup?: string;
  battery?: string;
  emergencyContact?: string;
}

const MOCK_MEMBERS: ExtendedDindiMember[] = [
  {
    id: 'm1',
    name: 'Pandurang Patil',
    mobileNumber: '+91 98765 43210',
    status: 'urgent_alert',
    lastSeen: '8 mins ago',
    distanceAway: '420m NW (Drifted)',
    age: 64,
    gender: 'M',
    bloodGroup: 'O+',
    battery: '68%',
  },
  {
    id: 'm2',
    name: 'Shantabai Shinde',
    mobileNumber: '+91 98123 45678',
    status: 'urgent_alert',
    lastSeen: '15 mins ago',
    distanceAway: '150m Behind',
    age: 70,
    gender: 'F',
    bloodGroup: 'B+',
    battery: '42%',
  },
  {
    id: 'm3',
    name: 'Ramesh Kulkarni',
    mobileNumber: '+91 98222 33344',
    status: 'checked_in',
    lastSeen: '2 mins ago',
    age: 68,
    gender: 'M',
    bloodGroup: 'B+',
    battery: '85%',
  },
  {
    id: 'm4',
    name: 'Ganesh Deshmukh',
    mobileNumber: '+91 98999 88877',
    status: 'checked_in',
    lastSeen: '1 min ago',
    age: 55,
    gender: 'M',
    bloodGroup: 'A+',
    battery: '92%',
  },
  {
    id: 'm5',
    name: 'Sunita Pawar',
    mobileNumber: '+91 98444 55566',
    status: 'checked_in',
    lastSeen: 'Just now',
    age: 61,
    gender: 'F',
    bloodGroup: 'AB+',
    battery: '77%',
  },
  {
    id: 'm6',
    name: 'Tukaram Shinde',
    mobileNumber: '+91 98333 22211',
    status: 'checked_in',
    lastSeen: '3 mins ago',
    age: 58,
    gender: 'M',
    bloodGroup: 'O+',
    battery: '81%',
  },
  {
    id: 'm7',
    name: 'Anusaya Gaikwad',
    mobileNumber: '+91 98111 99988',
    status: 'not_checked_in',
    lastSeen: '45 mins ago',
    age: 66,
    gender: 'F',
    bloodGroup: 'A-',
    battery: '35%',
  },
];

type FilterType = 'all' | 'checked_in' | 'urgent' | 'pending';

export const DindiMembersScreen: React.FC<
  DindiLeaderTabScreenProps<'DindiMembers'>
> = ({ navigation }) => {
  const { t } = useTranslation();
  const [members, setMembers] = useState<ExtendedDindiMember[]>(MOCK_MEMBERS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.mobileNumber.includes(searchQuery);

      if (!matchesSearch) return false;

      if (activeFilter === 'checked_in') return m.status === 'checked_in';
      if (activeFilter === 'urgent') return m.status === 'urgent_alert';
      if (activeFilter === 'pending') return m.status === 'not_checked_in';
      return true;
    });
  }, [members, searchQuery, activeFilter]);

  const urgentCount = members.filter((m) => m.status === 'urgent_alert').length;
  const checkedInCount = members.filter((m) => m.status === 'checked_in').length;
  const pendingCount = members.filter((m) => m.status === 'not_checked_in').length;

  const handleCall = (member: ExtendedDindiMember) => {
    Vibration.vibrate(40);
    Alert.alert('📞 Direct Call', `Calling ${member.name} (${member.mobileNumber})...`);
  };

  const handleSoundPing = (member: ExtendedDindiMember) => {
    Vibration.vibrate([0, 100, 80, 100]);
    Alert.alert('🔔 Sound Alarm Triggered', `Triggered beeper on ${member.name}'s phone.`);
  };

  const handleToggleCheckIn = (id: string, currentStatus: string, name: string) => {
    Vibration.vibrate(60);
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: currentStatus === 'checked_in' ? 'not_checked_in' : 'checked_in',
              lastSeen: 'Just now',
            }
          : m,
      ),
    );
    Alert.alert(
      'Status Updated',
      `${name} marked as ${currentStatus === 'checked_in' ? 'Pending' : 'Checked In'}.`,
    );
  };

  const renderMember = ({ item }: { item: ExtendedDindiMember }) => {
    const isUrgent = item.status === 'urgent_alert';
    const isCheckedIn = item.status === 'checked_in';

    return (
      <View
        style={[
          styles.memberCard,
          isUrgent && styles.cardUrgent,
        ]}
      >
        <View style={styles.cardMainRow}>
          {/* Avatar with Status Ring */}
          <View
            style={[
              styles.avatarContainer,
              isUrgent
                ? styles.avatarUrgent
                : isCheckedIn
                ? styles.avatarCheckedIn
                : styles.avatarPending,
            ]}
          >
            <Text style={styles.avatarInitials}>
              {item.name.slice(0, 1)}
            </Text>
          </View>

          {/* Member Details */}
          <View style={styles.memberDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.memberName}>{item.name}</Text>
              {item.bloodGroup && (
                <View style={styles.bloodBadge}>
                  <Text style={styles.bloodBadgeText}>{item.bloodGroup}</Text>
                </View>
              )}
            </View>

            <Text style={styles.memberMeta}>
              {item.gender === 'M' ? 'Male' : 'Female'} · Age {item.age} · {item.mobileNumber}
            </Text>

            {/* Sub-status with distance or last seen */}
            <View style={styles.statusMetaRow}>
              <Ionicons
                name={isUrgent ? 'location' : 'time-outline'}
                size={13}
                color={isUrgent ? '#D32F2F' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.statusMetaText,
                  isUrgent && styles.statusMetaTextUrgent,
                ]}
              >
                {item.distanceAway || `Last seen ${item.lastSeen}`}
              </Text>
              {item.battery && (
                <Text style={styles.batteryMetaText}>
                  · 🔋 {item.battery}
                </Text>
              )}
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusPill,
              isUrgent
                ? styles.pillUrgent
                : isCheckedIn
                ? styles.pillCheckedIn
                : styles.pillPending,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                isUrgent
                  ? styles.pillTextUrgent
                  : isCheckedIn
                  ? styles.pillTextCheckedIn
                  : styles.pillTextPending,
              ]}
            >
              {isUrgent ? 'DRIFTED' : isCheckedIn ? 'CHECKED IN' : 'PENDING'}
            </Text>
          </View>
        </View>

        {/* Member Action Bar */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleCall(item)}
            style={styles.actionBtnCall}
          >
            <Ionicons name="call" size={14} color="#FFFFFF" />
            <Text style={styles.actionBtnCallText}>Call</Text>
          </TouchableOpacity>

          {isUrgent && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSoundPing(item)}
              style={styles.actionBtnPing}
            >
              <Ionicons name="volume-high" size={14} color={colors.maroon} />
              <Text style={styles.actionBtnPingText}>Sound Beep</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleToggleCheckIn(item.id, item.status, item.name)}
            style={styles.actionBtnToggle}
          >
            <Ionicons
              name={isCheckedIn ? 'close-circle-outline' : 'checkmark-circle'}
              size={15}
              color={isCheckedIn ? colors.textSecondary : '#2E7D32'}
            />
            <Text style={styles.actionBtnToggleText}>
              {isCheckedIn ? 'Mark Pending' : 'Check In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={colors.maroon} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Dindi 12 Roster</Text>
            <Text style={styles.headerSubtitle}>
              {checkedInCount}/{members.length} Pilgrims Checked In
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert('Add Pilgrim', 'Scan Pilgrim QR Code or enter mobile number to add to Dindi 12.')
            }
            style={styles.addMemberBtn}
          >
            <Ionicons name="person-add" size={18} color={colors.maroon} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons
            name="search-sharp"
            size={18}
            color={colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by pilgrim name or phone..."
            placeholderTextColor="#9E9E9E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveFilter('all')}
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
              All ({members.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveFilter('checked_in')}
            style={[styles.filterChip, activeFilter === 'checked_in' && styles.filterChipActiveGreen]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'checked_in' && styles.filterChipTextActive,
              ]}
            >
              Checked In ({checkedInCount})
            </Text>
          </TouchableOpacity>

          {urgentCount > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveFilter('urgent')}
              style={[styles.filterChip, activeFilter === 'urgent' && styles.filterChipActiveRed]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'urgent' && styles.filterChipTextActive,
                ]}
              >
                Drifted ({urgentCount})
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveFilter('pending')}
            style={[styles.filterChip, activeFilter === 'pending' && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'pending' && styles.filterChipTextActive,
              ]}
            >
              Pending ({pendingCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Pilgrims Found</Text>
              <Text style={styles.emptySub}>No member matches your search filter.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  addMemberBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs + 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.maroon,
    borderColor: colors.maroon,
  },
  filterChipActiveGreen: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  filterChipActiveRed: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: spacing.xl,
    gap: spacing.xs + 2,
  },
  memberCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardUrgent: {
    backgroundColor: '#FFF8F8',
    borderColor: '#FFCDD2',
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 2,
  },
  avatarCheckedIn: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  avatarUrgent: {
    backgroundColor: '#FFEBEE',
    borderColor: '#D32F2F',
  },
  avatarPending: {
    backgroundColor: '#FFF3E0',
    borderColor: '#F57C00',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.maroon,
  },
  memberDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  bloodBadge: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bloodBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#D32F2F',
  },
  memberMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  statusMetaText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  statusMetaTextUrgent: {
    color: '#D32F2F',
    fontWeight: typography.fontWeight.bold,
  },
  batteryMetaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pillCheckedIn: {
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
  },
  pillUrgent: {
    backgroundColor: 'rgba(211, 47, 47, 0.12)',
  },
  pillPending: {
    backgroundColor: 'rgba(245, 124, 0, 0.12)',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
  },
  pillTextCheckedIn: {
    color: '#2E7D32',
  },
  pillTextUrgent: {
    color: '#D32F2F',
  },
  pillTextPending: {
    color: '#F57C00',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  actionBtnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffronDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnCallText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  actionBtnPing: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnPingText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  actionBtnToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    marginLeft: 'auto',
  },
  actionBtnToggleText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default DindiMembersScreen;
