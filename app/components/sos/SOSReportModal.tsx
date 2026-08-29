import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../constants';

export interface SOSReportData {
  reasonType: string;
  description: string;
}

interface SOSReportModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: SOSReportData) => void;
}

interface ReasonOption {
  id: string;
  titleEn: string;
  titleMr: string;
  titleHi: string;
  iconName: any;
  iconFamily: 'ion' | 'material' | 'fa5';
  isCritical?: boolean;
}

const REASON_OPTIONS: ReasonOption[] = [
  {
    id: 'medical_emergency',
    titleEn: 'Medical emergency',
    titleMr: 'वैद्यकीय आणीबाणी',
    titleHi: 'आपातकालीन चिकित्सा',
    iconName: 'medical-services',
    iconFamily: 'material',
    isCritical: true,
  },
  {
    id: 'injury',
    titleEn: 'Injury / Wound',
    titleMr: 'दुखापत / जखम',
    titleHi: 'चोट / घाव',
    iconName: 'bandage-outline',
    iconFamily: 'ion',
    isCritical: true,
  },
  {
    id: 'feeling_unwell',
    titleEn: 'Feeling unwell / Dizziness',
    titleMr: 'अस्वस्थ / चक्कर येत आहे',
    titleHi: 'अस्वस्थ / चक्कर आना',
    iconName: 'heart-half-outline',
    iconFamily: 'ion',
  },
  {
    id: 'lost_separated',
    titleEn: 'Lost / separated from Dindi',
    titleMr: 'हरवले / दिंडीपासून वेगळे',
    titleHi: 'खो गए / दिंडी से अलग',
    iconName: 'people-outline',
    iconFamily: 'ion',
  },
  {
    id: 'need_assistance',
    titleEn: 'Need physical assistance',
    titleMr: 'शारीरिक मदतीची गरज',
    titleHi: 'सहायता की आवश्यकता',
    iconName: 'hand-left-outline',
    iconFamily: 'ion',
  },
  {
    id: 'other',
    titleEn: 'Other emergency',
    titleMr: 'इतर आणीबाणी',
    titleHi: 'अन्य आपातकाल',
    iconName: 'alert-circle-outline',
    iconFamily: 'ion',
  },
];

export const SOSReportModal: React.FC<SOSReportModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'mr') as 'mr' | 'hi' | 'en';

  const [selectedReasonId, setSelectedReasonId] = useState<string>('medical_emergency');
  const [description, setDescription] = useState<string>('');

  const getLocalizedTitle = (opt: ReasonOption) => {
    if (lang === 'mr') return opt.titleMr;
    if (lang === 'hi') return opt.titleHi;
    return opt.titleEn;
  };

  const handleConfirm = () => {
    Vibration.vibrate([0, 100, 50, 100]);
    const selectedOption = REASON_OPTIONS.find((r) => r.id === selectedReasonId);
    const reasonType = selectedOption ? getLocalizedTitle(selectedOption) : 'Medical emergency';

    onConfirm({
      reasonType,
      description: description.trim(),
    });
  };

  const renderIcon = (opt: ReasonOption, isSelected: boolean) => {
    const iconColor = isSelected ? '#FFFFFF' : opt.isCritical ? '#DC2626' : colors.maroon;
    if (opt.iconFamily === 'material') {
      return <MaterialIcons name={opt.iconName} size={22} color={iconColor} />;
    }
    return <Ionicons name={opt.iconName} size={22} color={iconColor} />;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerBar}>
            <View style={styles.headerTitleRow}>
              <View style={styles.emergencyBadge}>
                <Ionicons name="warning" size={16} color="#FFFFFF" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.headerTitle}>
                  {lang === 'mr' ? 'आणीबाणी प्रकार निवडा' : lang === 'hi' ? 'आपातकाल का प्रकार चुनें' : 'Select Emergency Type'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {lang === 'mr' ? 'जवळच्या स्वयंसेवक व वैद्यकीय पथकाला अलर्ट जाईल' : lang === 'hi' ? 'निकटतम स्वयंसेवकों को तुरंत अलर्ट भेजा जाएगा' : 'Alerts nearby volunteers & medical teams'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#78716C" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Reason Options */}
            <Text style={styles.sectionHeading}>
              {lang === 'mr' ? 'तुम्हाला काय मदत हवी आहे?' : lang === 'hi' ? 'आपको क्या सहायता चाहिए?' : 'What assistance do you need?'}
            </Text>

            <View style={styles.optionsGrid}>
              {REASON_OPTIONS.map((opt) => {
                const isSelected = selectedReasonId === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedReasonId(opt.id)}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.optionIconContainer,
                        isSelected && styles.optionIconContainerSelected,
                      ]}
                    >
                      {renderIcon(opt, isSelected)}
                    </View>

                    <Text
                      style={[
                        styles.optionTitle,
                        isSelected && styles.optionTitleSelected,
                      ]}
                    >
                      {getLocalizedTitle(opt)}
                    </Text>

                    {isSelected && (
                      <View style={styles.selectedCheck}>
                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional Description / Landmark Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {lang === 'mr' ? 'अतिरिक्त माहिती किंवा ठिकाण (ऐच्छिक)' : lang === 'hi' ? 'अतिरिक्त विवरण या स्थल (वैकल्पिक)' : 'Additional details or landmark (Optional)'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder={
                  lang === 'mr'
                    ? 'उदा. पोल क्र. १४ जवळ, खूप थकवा...'
                    : lang === 'hi'
                    ? 'उदा. खंभा सं. १४ के पास...'
                    : 'e.g. Near Water Tanker #3, feeling dizzy...'
                }
                placeholderTextColor="#A8A29E"
                multiline
                numberOfLines={2}
              />
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>
                {lang === 'mr' ? 'रद्द करा' : lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirm}
              style={styles.confirmButton}
            >
              <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.confirmButtonText}>
                {lang === 'mr' ? 'SOS पाठवा (Confirm)' : lang === 'hi' ? 'SOS भेजें (Confirm)' : 'Send SOS Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FAF5EE',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 20,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DED2',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emergencyBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#6B5E52',
    marginBottom: 12,
  },
  optionsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E8DFD3',
    shadowColor: '#2B1A09',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  optionCardSelected: {
    backgroundColor: '#8B1E1E',
    borderColor: '#8B1E1E',
    shadowColor: '#8B1E1E',
    shadowOpacity: 0.2,
    elevation: 3,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FBF2EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
    flex: 1,
  },
  optionTitleSelected: {
    color: '#FFFFFF',
  },
  selectedCheck: {
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#57534E',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFD5C7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1C1917',
    height: 60,
    textAlignVertical: 'top',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8DED2',
    backgroundColor: '#FAF5EE',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1C4B2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#57534E',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#DC2626',
    paddingVertical: 13,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default SOSReportModal;
