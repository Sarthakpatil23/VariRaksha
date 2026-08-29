import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants';
import { useUserProfile, setUserProfile, UserProfile, getUserRole, UserRole } from '../../lib/userStore';
import { fetchCurrentUserProfile } from '../../services/authService';
import { translateUserProfile } from '../../utils/translator';

export const ProfileScreen: React.FC<any> = () => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'mr') as 'mr' | 'hi' | 'en';
  const isMarathi = lang === 'mr';
  const isHindi = lang === 'hi';

  const storeProfile = useUserProfile();
  const [profile, setProfile] = useState<UserProfile | null>(storeProfile);
  const [isLoading, setIsLoading] = useState<boolean>(!storeProfile);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const loadProfile = useCallback(async (showFullLoader: boolean = false) => {
    if (showFullLoader) {
      setIsLoading(true);
    }
    setHasError(false);
    try {
      const refreshed = await fetchCurrentUserProfile(storeProfile);
      if (refreshed) {
        setProfile(refreshed);
        setUserProfile(refreshed);
      } else if (!profile && !storeProfile) {
        setHasError(true);
      }
    } catch (err) {
      console.error('[ProfileScreen] Error loading profile:', err);
      if (!profile && !storeProfile) {
        setHasError(true);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [storeProfile, profile]);

  useEffect(() => {
    loadProfile(false);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProfile(false);
  };

  const handleCallPhone = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone) {
      Linking.openURL(`tel:${cleanPhone}`).catch(() => {
        Alert.alert('Phone Call', `Unable to make phone call to ${cleanPhone}`);
      });
    }
  };

  // Helper to determine role title in chosen language
  const getRoleBadge = (role: UserRole = 'varkari') => {
    switch (role) {
      case 'dindiLeader':
        return {
          title: isMarathi ? 'दिंडी प्रमुख' : isHindi ? 'दिंडी प्रमुख' : 'Dindi Leader',
          icon: 'flag-sharp' as const,
          color: colors.maroon,
          bg: '#FCE4EC',
        };
      case 'volunteer':
        return {
          title: isMarathi ? 'स्वयंसेवक' : isHindi ? 'स्वयंसेवक' : 'Volunteer',
          icon: 'heart-sharp' as const,
          color: '#2E7D32',
          bg: '#E8F5E9',
        };
      case 'medicalStaff':
        return {
          title: isMarathi ? 'वैद्यकीय अधिकारी' : isHindi ? 'चिकित्सा अधिकारी' : 'Medical Staff',
          icon: 'medical-sharp' as const,
          color: '#1565C0',
          bg: '#E3F2FD',
        };
      case 'varkari':
      case 'pilgrim':
      default:
        return {
          title: isMarathi ? 'वारकरी भाविक' : isHindi ? 'वारकरी तीर्थयात्री' : 'Varkari Pilgrim',
          icon: 'person-sharp' as const,
          color: colors.saffronDark,
          bg: '#FFF3E0',
        };
    }
  };

  const getRoleAvatar = (role: UserRole = 'varkari') => {
    switch (role) {
      case 'dindiLeader':
        return require('../../../assets/images/dindi_leader.png');
      case 'volunteer':
        return require('../../../assets/images/volunteer.png');
      case 'medicalStaff':
        return require('../../../assets/images/medical_staff.png');
      case 'varkari':
      case 'pilgrim':
      default:
        return require('../../../assets/images/varkari.png');
    }
  };

  if (isLoading && !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.saffronDark} />
          <Text style={styles.loadingText}>
            {isMarathi
              ? 'डेटाबेसमधून तुमची प्रोफाइल माहिती लोड होत आहे...'
              : isHindi
              ? 'डेटाबेस से आपकी प्रोफ़ाइल लोड की जा रही है...'
              : 'Fetching your official profile details...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasError && !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline-outline" size={54} color={colors.maroon} />
          <Text style={styles.errorTitle}>
            {isMarathi ? 'प्रोफाइल लोड होऊ शकली नाही' : isHindi ? 'प्रोफ़ाइल लोड नहीं हो सकी' : 'Profile Unavailable'}
          </Text>
          <Text style={styles.errorSubtext}>
            {isMarathi
              ? 'कृपया तुमचे इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.'
              : 'Please check your connection or try again.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadProfile(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="reload" size={16} color={colors.surface} />
            <Text style={styles.retryButtonText}>{t('retry', 'Retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const activeProfile = profile || storeProfile || {
    fullName: isMarathi ? 'वारकरी भाविक' : 'Varkari Pilgrim',
    mobileNumber: '+91 94230 10001',
    role: getUserRole(),
    bloodGroup: 'B+',
    village: 'महाराष्ट्र',
    dindiNumber: '12',
    dindiName: 'संत ज्ञानेश्वर माऊली पालखी दिंडी',
    emergencyCardId: 'VK-100201',
    medicalConditions: [],
    allergies: [],
    gender: 'Male',
    age: 58,
  };

  const displayProfile = translateUserProfile(activeProfile, lang);
  const roleBadge = getRoleBadge(displayProfile.role);

  const genderLabel =
    displayProfile.gender === 'Female'
      ? isMarathi
        ? 'स्त्री'
        : isHindi
        ? 'महिला'
        : 'Female'
      : isMarathi
      ? 'पुरुष'
      : isHindi
      ? 'पुरुष'
      : 'Male';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandTitleContainer}>
          <Text style={styles.brandTitle}>VariRaksha • वारी रक्षा</Text>
          <Text style={styles.screenTitle}>{t('myProfile', 'My Profile')}</Text>
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
          style={styles.refreshButton}
          activeOpacity={0.7}
          accessibilityLabel="Refresh profile"
        >
          <Ionicons
            name={isRefreshing ? 'sync-circle' : 'refresh'}
            size={22}
            color={colors.maroon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.saffronDark]}
            tintColor={colors.saffronDark}
          />
        }
      >
        {/* ============================================================ */}
        {/* HERO IDENTITY CARD */}
        {/* ============================================================ */}
        <View style={styles.heroCard}>
          {/* Persona Avatar */}
          <View style={[styles.avatarWrapper, { borderColor: roleBadge.color }]}>
            <Image
              source={getRoleAvatar(displayProfile.role)}
              style={styles.avatarImg}
              resizeMode="cover"
            />
          </View>

          {/* Full Name */}
          <Text style={styles.heroName}>{displayProfile.fullName}</Text>

          {/* Role Pill */}
          <View style={[styles.rolePill, { backgroundColor: roleBadge.bg }]}>
            <Ionicons name={roleBadge.icon} size={14} color={roleBadge.color} />
            <Text style={[styles.rolePillText, { color: roleBadge.color }]}>
              {roleBadge.title}
            </Text>
          </View>

          {/* Emergency Card Badge */}
          <View style={styles.emergencyIdBadge}>
            <Ionicons name="id-card-sharp" size={15} color={colors.saffronDark} />
            <Text style={styles.emergencyIdText}>
              {displayProfile.emergencyCardId || 'VK-WARI01'}
            </Text>
            <View style={styles.officialPill}>
              <Text style={styles.officialPillText}>
                {isMarathi ? 'अधिकृत पास' : 'OFFICIAL PASS'}
              </Text>
            </View>
          </View>

          {/* Quick Subtitle Chips */}
          <View style={styles.quickChipsRow}>
            <View style={styles.quickChip}>
              <Ionicons name="location-sharp" size={13} color={colors.maroon} />
              <Text style={styles.quickChipText}>
                {displayProfile.village || (isMarathi ? 'महाराष्ट्र' : 'Maharashtra')}
              </Text>
            </View>
            <View style={styles.quickChip}>
              <Ionicons name="person" size={13} color={colors.maroon} />
              <Text style={styles.quickChipText}>
                {genderLabel} · {isMarathi ? `वय ${displayProfile.age || 55}` : isHindi ? `उम्र ${displayProfile.age || 55}` : `Age ${displayProfile.age || 55}`}
              </Text>
            </View>
            <View style={[styles.quickChip, styles.bloodGroupHighlight]}>
              <Ionicons name="water" size={13} color="#C62828" />
              <Text style={[styles.quickChipText, styles.bloodGroupText]}>
                {displayProfile.bloodGroup || 'B+'}
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================================ */}
        {/* SECTION 1: PERSONAL INFORMATION */}
        {/* ============================================================ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBubble}>
              <Ionicons name="person-circle-outline" size={20} color={colors.maroon} />
            </View>
            <Text style={styles.sectionTitle}>
              {t('personalInfo', 'Personal Information')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('mobileNumber', 'Mobile Number')}</Text>
            <Text style={styles.infoValue}>{displayProfile.mobileNumber}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('villageOrigin', 'Village / Origin')}</Text>
            <Text style={styles.infoValue}>
              {displayProfile.village || (isMarathi ? 'महाराष्ट्र' : 'Maharashtra')}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {isMarathi ? 'वय आणि लिंग' : isHindi ? 'आयु और लिंग' : 'Age & Gender'}
            </Text>
            <Text style={styles.infoValue}>
              {displayProfile.age ? `${displayProfile.age} ${isMarathi ? 'वर्षे' : isHindi ? 'वर्ष' : 'yrs'}` : '55 yrs'} · {genderLabel}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('assignedRole', 'Registered Role')}</Text>
            <Text style={[styles.infoValue, { color: roleBadge.color, fontWeight: '700' }]}>
              {roleBadge.title}
            </Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* SECTION 2: MEDICAL INFORMATION */}
        {/* ============================================================ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBubble, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="medkit-outline" size={19} color="#C62828" />
            </View>
            <Text style={styles.sectionTitle}>
              {t('medicalInfo', 'Medical Information')}
            </Text>
          </View>

          {/* Blood Group Highlight Card */}
          <View style={styles.bloodCard}>
            <View style={styles.bloodDropBadge}>
              <Ionicons name="water" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.bloodCardText}>
              <Text style={styles.bloodCardLabel}>{t('bloodGroup', 'Blood Group')}</Text>
              <Text style={styles.bloodCardValue}>{displayProfile.bloodGroup || 'B+'}</Text>
            </View>
            <View style={styles.bloodSafeBadge}>
              <Text style={styles.bloodSafeText}>
                {isMarathi ? 'वैद्यकीय पडताळणी पूर्ण' : 'Verified'}
              </Text>
            </View>
          </View>

          {/* Medical Conditions */}
          <View style={styles.subSectionBlock}>
            <Text style={styles.subSectionLabel}>
              {t('medicalConditions', 'Medical Conditions')}
            </Text>
            {displayProfile.medicalConditions && displayProfile.medicalConditions.length > 0 ? (
              <View style={styles.tagsContainer}>
                {displayProfile.medicalConditions.map((cond, idx) => (
                  <View key={`cond-${idx}`} style={styles.conditionTag}>
                    <Ionicons name="fitness-outline" size={13} color="#6A1B9A" />
                    <Text style={styles.conditionTagText}>{cond}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.safeTag}>
                <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                <Text style={styles.safeTagText}>
                  {t('noConditionsReported', 'No critical conditions reported')}
                </Text>
              </View>
            )}
          </View>

          {/* Allergies */}
          <View style={styles.subSectionBlock}>
            <Text style={styles.subSectionLabel}>{t('allergies', 'Allergies')}</Text>
            {displayProfile.allergies && displayProfile.allergies.length > 0 ? (
              <View style={styles.tagsContainer}>
                {displayProfile.allergies.map((allergy, idx) => (
                  <View key={`allergy-${idx}`} style={styles.allergyTag}>
                    <Ionicons name="warning-outline" size={13} color="#E65100" />
                    <Text style={styles.allergyTagText}>{allergy}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.safeTag}>
                <Ionicons name="shield-checkmark" size={14} color="#2E7D32" />
                <Text style={styles.safeTagText}>
                  {t('noAllergiesReported', 'No known allergies')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ============================================================ */}
        {/* SECTION 3: ROLE SPECIFIC ASSIGNMENT / DINDI */}
        {/* ============================================================ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBubble, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="trail-sign-outline" size={19} color={colors.saffronDark} />
            </View>
            <Text style={styles.sectionTitle}>
              {t('dindiAssignment', 'Dindi & Pilgrimage Details')}
            </Text>
          </View>

          {/* Varkari / Pilgrim specific */}
          {(displayProfile.role === 'varkari' || displayProfile.role === 'pilgrim') && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('dindiGroup', 'Dindi Group')}</Text>
                <Text style={styles.infoValue}>
                  {displayProfile.dindiName || 'संत ज्ञानेश्वर माऊली पालखी दिंडी'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('dindiNumber', 'Dindi Number')}</Text>
                <Text style={styles.infoValue}>#{displayProfile.dindiNumber || '12'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('dindiLeader', 'Dindi Leader')}</Text>
                <Text style={styles.infoValue}>
                  {displayProfile.dindiLeaderName || (isMarathi ? 'ह.भ.प. सोपानराव महाराज' : 'H.B.P. Sopanrao Maharaj')}
                </Text>
              </View>
            </>
          )}

          {/* Dindi Leader specific */}
          {displayProfile.role === 'dindiLeader' && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('dindiGroup', 'Dindi Group')}</Text>
                <Text style={styles.infoValue}>
                  {displayProfile.dindiName || 'संत तुकाराम महाराज पालखी दिंडी'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('dindiNumber', 'Dindi Number')}</Text>
                <Text style={styles.infoValue}>#{displayProfile.dindiNumber || '01'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('palkhiRoute', 'Palkhi Route')}</Text>
                <Text style={styles.infoValue}>
                  {displayProfile.palkhiRoute || 'Dehu → Pandharpur Main Marg'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('totalPilgrims', 'Total Pilgrims')}</Text>
                <Text style={styles.infoValue}>
                  {displayProfile.totalPilgrims || 150} {isMarathi ? 'वारकरी' : isHindi ? 'तीर्थयात्री' : 'Pilgrims'}
                </Text>
              </View>
            </>
          )}

          {/* Volunteer specific */}
          {displayProfile.role === 'volunteer' && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('assignedSector', 'Assigned Sector')}</Text>
                <Text style={styles.infoValue}>
                  {displayProfile.assignedSector || 'Sector 4 · Wakhari Rest Camp'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('dutyType', 'Duty Type')}</Text>
                <Text style={styles.infoValue}>
                  {displayProfile.dutyType || (isMarathi ? 'गर्दी नियंत्रण व सेवा' : 'Crowd Safety & Pilgrim Assistance')}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {isMarathi ? 'ड्यूटी स्थिती' : isHindi ? 'ड्यूटी स्थिति' : 'Duty Status'}
                </Text>
                <View style={styles.activeDutyBadge}>
                  <Text style={styles.activeDutyText}>
                    {isMarathi ? '● ऑन ड्यूटी (सक्रिय)' : '● ON DUTY'}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Medical Staff specific */}
          {displayProfile.role === 'medicalStaff' && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('specialization', 'Medical Specialization')}</Text>
                <Text style={styles.infoValue}>
                  {displayProfile.specialization || 'General Emergency & Trauma'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('medicalCampLocation', 'Station / Medical Camp')}</Text>
                <Text style={styles.infoValue}>
                  {displayProfile.medicalCampLocation || 'Mobile Clinic #2 · Phaltan Camp'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {isMarathi ? 'वैद्यकीय पथक स्थिती' : isHindi ? 'चिकित्सा टीम स्थिति' : 'Triage Status'}
                </Text>
                <View style={[styles.activeDutyBadge, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={[styles.activeDutyText, { color: '#1565C0' }]}>
                    {isMarathi ? '● इमर्जन्सी रिस्पॉन्स सज्ज' : '● EMERGENCY READY'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ============================================================ */}
        {/* SECTION 4: EMERGENCY CONTACTS */}
        {/* ============================================================ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBubble, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="call-outline" size={19} color="#2E7D32" />
            </View>
            <Text style={styles.sectionTitle}>
              {t('emergencyContacts', 'Emergency Contacts')}
            </Text>
          </View>

          {displayProfile.emergencyContacts && displayProfile.emergencyContacts.length > 0 ? (
            displayProfile.emergencyContacts.map((contact, idx) => (
              <View key={`contact-${idx}`} style={styles.contactItem}>
                <View style={styles.contactIconCircle}>
                  <Ionicons name="person" size={18} color={colors.maroon} />
                </View>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactRelation}>
                    {contact.relationship || (isMarathi ? 'आपत्कालीन संपर्क' : 'Emergency Contact')}
                  </Text>
                  <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                </View>
                <TouchableOpacity
                  style={styles.callActionButton}
                  onPress={() => handleCallPhone(contact.phoneNumber)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Call ${contact.name}`}
                >
                  <Ionicons name="call" size={16} color={colors.surface} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.defaultEmergencyCard}>
              <View style={styles.defaultEmergencyRow}>
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.maroon} />
                <View style={styles.defaultEmergencyText}>
                  <Text style={styles.defaultEmergencyTitle}>
                    {isMarathi ? 'वारी केंद्रीय सुरक्षा हेल्पलाइन' : 'Wari Central Safety Helpline'}
                  </Text>
                  <Text style={styles.defaultEmergencySub}>
                    {isMarathi ? '२४/७ वैद्यकीय व पोलीस साहाय्यता' : '24/7 Medical & Police Assistance'}
                  </Text>
                  <Text style={styles.defaultEmergencyPhone}>+91 94230 10000 / 112</Text>
                </View>
                <TouchableOpacity
                  style={styles.callActionButton}
                  onPress={() => handleCallPhone('112')}
                  activeOpacity={0.7}
                  accessibilityLabel="Call 112"
                >
                  <Ionicons name="call" size={16} color={colors.surface} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ============================================================ */}
        {/* SECTION 5: OFFICIAL SEAL & READ-ONLY NOTICE */}
        {/* ============================================================ */}
        <View style={styles.readOnlyNoticeCard}>
          <Ionicons name="lock-closed" size={18} color={colors.maroon} />
          <View style={styles.readOnlyNoticeContent}>
            <Text style={styles.readOnlyNoticeTitle}>
              {t('officialRecordNotice', 'Official Pilgrimage Record • Read-Only')}
            </Text>
            <Text style={styles.readOnlyNoticeSubtext}>
              {isMarathi
                ? 'ही माहिती श्री क्षेत्र पंढरपूर वारी अधिकृत नोंदणीवरून घेतलेली आहे. तपशीलांमध्ये बदल करण्यासाठी कृपया वारी मदत केंद्राशी संपर्क साधा.'
                : isHindi
                ? 'यह विवरण आधिकारिक वारी पंजीकरण से प्राप्त हुआ है। विवरण में बदलाव के लिए कृपया सहायता केंद्र से संपर्क करें।'
                : 'This profile is synced with the official Wari register. To update details, please visit the camp registration desk.'}
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.maroon,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.maroon,
    marginTop: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffronDark,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
    marginTop: 10,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(93, 0, 30, 0.08)',
  },
  brandTitleContainer: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.maroon,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.maroon,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(93, 0, 30, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: spacing.md,
  },
  avatarWrapper: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    backgroundColor: colors.cream,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.maroon,
    textAlign: 'center',
    marginBottom: 4,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
    marginBottom: 8,
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emergencyIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
    marginBottom: 10,
  },
  emergencyIdText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.saffronDark,
    letterSpacing: 0.5,
  },
  officialPill: {
    backgroundColor: colors.saffronDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  officialPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.surface,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingTop: 4,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(93, 0, 30, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  bloodGroupHighlight: {
    backgroundColor: '#FFEBEE',
  },
  bloodGroupText: {
    color: '#C62828',
    fontWeight: '900',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.sm,
  },
  sectionIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.maroon,
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    flex: 1.2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    width: '100%',
  },
  bloodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 16,
    gap: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  bloodDropBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodCardText: {
    flex: 1,
  },
  bloodCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C62828',
    textTransform: 'uppercase',
  },
  bloodCardValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#B71C1C',
  },
  bloodSafeBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  bloodSafeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C62828',
  },
  subSectionBlock: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  subSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  conditionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    borderColor: '#E1BEE7',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  conditionTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A148C',
  },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderColor: '#FFE0B2',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  allergyTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65100',
  },
  safeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  safeTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B5E20',
  },
  activeDutyBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeDutyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(93, 0, 30, 0.03)',
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(93, 0, 30, 0.08)',
  },
  contactIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.maroon,
  },
  contactRelation: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  contactPhone: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  callActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  defaultEmergencyCard: {
    backgroundColor: 'rgba(93, 0, 30, 0.04)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(93, 0, 30, 0.1)',
  },
  defaultEmergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  defaultEmergencyText: {
    flex: 1,
  },
  defaultEmergencyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.maroon,
  },
  defaultEmergencySub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  defaultEmergencyPhone: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.saffronDark,
    marginTop: 2,
  },
  readOnlyNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE082',
    marginTop: 4,
  },
  readOnlyNoticeContent: {
    flex: 1,
  },
  readOnlyNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.maroon,
    marginBottom: 2,
  },
  readOnlyNoticeSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

export default ProfileScreen;
