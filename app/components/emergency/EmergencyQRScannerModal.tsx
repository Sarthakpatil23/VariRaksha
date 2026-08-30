/**
 * VariRaksha — Native Emergency QR Scanner & Triage Modal
 *
 * Uses Expo Camera (CameraView) for direct native hardware camera access and
 * zero-latency 60FPS QR scanning with auto-permission requesting.
 *
 * Allows any user (Varkari, Volunteer, Dindi Leader, Medical Staff) to scan
 * any pilgrim's Emergency QR Pass or enter their Card ID to:
 * 1. View full personal & critical medical history (Blood group, BP, Allergies, Contacts).
 * 2. Directly trigger an Emergency SOS on the pilgrim's behalf.
 * 3. 1-Tap call the pilgrim's family or emergency contact.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Vibration,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  resolveEmergencyId,
  triggerProxySOSForScannedPilgrim,
  EmergencyIdPayload,
} from '../../services/emergencyIdService';
import { EmergencyAlert } from '../../services/alertService';
import { colors, spacing, typography } from '../../constants';

interface EmergencyQRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  reporterRole?: string;
  onSOSDispatched?: (alert: EmergencyAlert) => void;
}

export const EmergencyQRScannerModal: React.FC<EmergencyQRScannerModalProps> = ({
  visible,
  onClose,
  reporterRole = 'Volunteer',
  onSOSDispatched,
}) => {
  const [manualInput, setManualInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scannedPilgrim, setScannedPilgrim] = useState<EmergencyIdPayload | null>(null);
  const [isDispatchingSOS, setIsDispatchingSOS] = useState<boolean>(false);
  const [isScanningActive, setIsScanningActive] = useState<boolean>(true);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [selectedEmergencyReason, setSelectedEmergencyReason] = useState<string>(
    'Severe Heat Exhaustion / Medical Emergency',
  );

  // Native Expo Camera Permissions hook
  const [permission, requestPermission] = useCameraPermissions();

  // Auto-request camera permissions when modal opens
  useEffect(() => {
    if (visible && (!permission || !permission.granted)) {
      requestPermission();
    }
    if (visible) {
      setIsScanningActive(true);
      setScannedPilgrim(null);
    }
  }, [visible]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!isScanningActive || scannedPilgrim || isLoading) return;
    setIsScanningActive(false);
    Vibration.vibrate(60);
    processScan(data);
  };

  const processScan = async (codeOrId: string) => {
    if (!codeOrId || !codeOrId.trim()) return;
    setIsLoading(true);
    const { success, pilgrim, error } = await resolveEmergencyId(codeOrId);
    setIsLoading(false);

    if (error || !pilgrim) {
      Alert.alert('Scan Result', error || 'Could not find pilgrim record for this code.', [
        { text: 'Try Again', onPress: () => setIsScanningActive(true) },
      ]);
      return;
    }

    setScannedPilgrim(pilgrim);
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      Alert.alert('Input Required', 'Please enter a valid Emergency Card ID or Mobile Number.');
      return;
    }
    processScan(manualInput);
  };

  const handleTriggerSOS = async () => {
    if (!scannedPilgrim) return;
    Vibration.vibrate(80);

    Alert.alert(
      '🚨 Confirm Emergency SOS',
      `Dispatch emergency response for ${scannedPilgrim.name} (${scannedPilgrim.id})?\n\nReason: ${selectedEmergencyReason}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch SOS Now',
          style: 'destructive',
          onPress: async () => {
            setIsDispatchingSOS(true);
            const { success, alert: createdAlert, error } = await triggerProxySOSForScannedPilgrim(
              scannedPilgrim,
              selectedEmergencyReason,
              reporterRole,
            );
            setIsDispatchingSOS(false);

            if (error || !createdAlert) {
              Alert.alert('Error', error || 'Failed to dispatch SOS alert.');
              return;
            }

            Alert.alert(
              '🚨 Emergency Dispatched',
              `Emergency alert for ${scannedPilgrim.name} has been broadcasted to all corridor volunteers, Dindi leaders, and medical staff.`,
              [
                {
                  text: 'View Status',
                  onPress: () => {
                    if (onSOSDispatched) onSOSDispatched(createdAlert);
                    onClose();
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleCall = (phone?: string) => {
    if (!phone) return;
    Vibration.vibrate(30);
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Call Contact', `Calling ${phone}...`);
    });
  };

  const handleReset = () => {
    setScannedPilgrim(null);
    setManualInput('');
    setIsScanningActive(true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.scannerModalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerIconBox}>
              <Ionicons name="qr-code" size={20} color="#5D001E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Scan Emergency ID Pass</Text>
              <Text style={styles.headerSubtitle}>
                {scannedPilgrim ? 'Pilgrim Details & Emergency Triage' : 'Point camera at Pilgrim QR code'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#78716C" />
            </TouchableOpacity>
          </View>

          {!scannedPilgrim ? (
            /* SCANNER & INPUT VIEW */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scannerBody}>
              {/* Native Camera Viewport */}
              <View style={styles.cameraBox}>
                {permission?.granted ? (
                  <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    enableTorch={isTorchOn}
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr', 'code128', 'ean13'],
                    }}
                    onBarcodeScanned={isScanningActive ? handleBarcodeScanned : undefined}
                  >
                    {/* Viewfinder Reticle Overlay */}
                    <View style={styles.scannerOverlay}>
                      <View style={styles.statusBadge}>
                        <View style={styles.greenLiveDot} />
                        <Text style={styles.statusBadgeText}>Live Scanner Active</Text>
                      </View>

                      <View style={styles.reticle}>
                        <View style={styles.laser} />
                      </View>

                      {/* Torch Button */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setIsTorchOn(!isTorchOn)}
                        style={[styles.torchBtn, isTorchOn && styles.torchBtnActive]}
                      >
                        <Ionicons
                          name={isTorchOn ? 'flash' : 'flash-off'}
                          size={18}
                          color={isTorchOn ? '#FDE047' : '#FFFFFF'}
                        />
                        <Text style={styles.torchBtnText}>
                          {isTorchOn ? 'Flash ON' : 'Flash'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </CameraView>
                ) : (
                  /* Permission Request Fallback State */
                  <View style={styles.permissionFallbackBox}>
                    <Ionicons name="camera-outline" size={42} color="#DC2626" />
                    <Text style={styles.permissionTitle}>Camera Permission Needed</Text>
                    <Text style={styles.permissionSubtitle}>
                      VariRaksha needs camera access to scan Pilgrim Emergency ID passes and retrieve instant medical records.
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={requestPermission}
                      style={styles.grantPermissionBtn}
                    >
                      <Ionicons name="camera" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.grantPermissionBtnText}>Grant Camera Access</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Divider with Text */}
              <View style={styles.orDividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.orDividerText}>OR ENTER CARD ID / MOBILE</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Manual Input Box */}
              <View style={styles.manualInputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. VK-DEHU01 or 9970832199"
                  placeholderTextColor="#A8A29E"
                  value={manualInput}
                  onChangeText={setManualInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleManualSubmit}
                  style={styles.lookupBtn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.lookupBtnText}>Lookup</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Quick Sample Chips */}
              <View style={styles.quickChipsContainer}>
                <Text style={styles.quickChipsTitle}>Quick Demo Cards:</Text>
                <View style={styles.quickChipsRow}>
                  <TouchableOpacity
                    style={styles.quickIdChip}
                    onPress={() => processScan('VK-DEHU01')}
                  >
                    <Text style={styles.quickIdChipText}>🪪 Sarthak Patil (VK-DEHU01)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickIdChip}
                    onPress={() => processScan('VK-ALANDI12')}
                  >
                    <Text style={styles.quickIdChipText}>🪪 Tukaram More (VK-ALANDI12)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          ) : (
            /* SCANNED PILGRIM EMERGENCY TRIAGE VIEW */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.triageBody}>
              {/* Pilgrim Card */}
              <View style={styles.scannedIdentityCard}>
                <View style={styles.idCardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scannedName}>{scannedPilgrim.name}</Text>
                    <Text style={styles.scannedDindi}>
                      🚩 {scannedPilgrim.dindiName} {scannedPilgrim.dindiNumber ? `(#${scannedPilgrim.dindiNumber})` : ''}
                    </Text>
                    <Text style={styles.scannedMeta}>
                      {scannedPilgrim.gender || 'Male'} · Age {scannedPilgrim.age || 62} · 📞 {scannedPilgrim.phone}
                    </Text>
                  </View>
                  <View style={styles.scannedBloodBox}>
                    <Text style={styles.scannedBloodLabel}>BLOOD</Text>
                    <Text style={styles.scannedBloodValue}>{scannedPilgrim.bloodGroup}</Text>
                  </View>
                </View>
                <View style={styles.cardIdBadgeRow}>
                  <Ionicons name="id-card" size={14} color="#5D001E" />
                  <Text style={styles.scannedCardIdText}>{scannedPilgrim.id}</Text>
                </View>
              </View>

              {/* 🩸 Critical Medical Details */}
              <View style={styles.triageMedicalBox}>
                <Text style={styles.triageBoxTitle}>🩸 CRITICAL MEDICAL DATA</Text>

                <View style={styles.triageInfoRow}>
                  <Ionicons name="heart-circle" size={18} color="#DC2626" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.triageInfoLabel}>Medical Conditions:</Text>
                    <Text style={styles.triageInfoVal}>
                      {scannedPilgrim.medicalConditions?.length
                        ? scannedPilgrim.medicalConditions.join(', ')
                        : 'None listed'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.triageInfoRow, { marginTop: 10 }]}>
                  <Ionicons name="warning" size={18} color="#D97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.triageInfoLabel}>Known Allergies:</Text>
                    <Text style={styles.triageInfoVal}>
                      {scannedPilgrim.allergies?.length
                        ? scannedPilgrim.allergies.join(', ')
                        : 'None reported'}
                    </Text>
                  </View>
                </View>

                {scannedPilgrim.criticalNotes ? (
                  <View style={[styles.triageInfoRow, { marginTop: 10 }]}>
                    <Ionicons name="document-text" size={18} color="#0284C7" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.triageInfoLabel}>Safety Notes:</Text>
                      <Text style={styles.triageInfoVal}>{scannedPilgrim.criticalNotes}</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Emergency Contact & Call Action */}
              <View style={styles.emergencyContactCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactCardLabel}>Family / Emergency Contact</Text>
                  <Text style={styles.contactCardName}>
                    {scannedPilgrim.emergencyContactName || 'Dindi Coordinator'}
                  </Text>
                  <Text style={styles.contactCardPhone}>
                    {scannedPilgrim.emergencyContactPhone || '+91 94230 11221'}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleCall(scannedPilgrim.emergencyContactPhone)}
                  style={styles.callContactBtn}
                >
                  <Ionicons name="call" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.callContactBtnText}>Call</Text>
                </TouchableOpacity>
              </View>

              {/* Emergency Reason Selector for Dispatch */}
              <View style={styles.reasonSelectorBox}>
                <Text style={styles.reasonSelectorTitle}>Select Emergency Reason to Dispatch:</Text>
                {[
                  'Severe Heat Stroke / Dehydration',
                  'Acute Chest Pain / Cardiac Issue',
                  'Unconscious / Fainted on Route',
                  'Fracture / Severe Foot Injury',
                  'Lost Pilgrim / Medical Assistance',
                ].map((reason, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.75}
                    onPress={() => setSelectedEmergencyReason(reason)}
                    style={[
                      styles.reasonOptionBtn,
                      selectedEmergencyReason === reason && styles.reasonOptionBtnActive,
                    ]}
                  >
                    <Ionicons
                      name={selectedEmergencyReason === reason ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color={selectedEmergencyReason === reason ? '#DC2626' : '#78716C'}
                    />
                    <Text
                      style={[
                        styles.reasonOptionText,
                        selectedEmergencyReason === reason && styles.reasonOptionTextActive,
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 🚨 TRIGGER EMERGENCY SOS BUTTON */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleTriggerSOS}
                style={styles.triggerSosBigBtn}
                disabled={isDispatchingSOS}
              >
                {isDispatchingSOS ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <FontAwesome5 name="ambulance" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.triggerSosBigBtnText}>
                      🚨 TRIGGER EMERGENCY SOS FOR PILGRIM
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Scan Another Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleReset}
                style={styles.scanAnotherBtn}
              >
                <Ionicons name="qr-code-outline" size={16} color="#78350F" style={{ marginRight: 6 }} />
                <Text style={styles.scanAnotherBtnText}>Scan Another ID</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scannerModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DF',
    backgroundColor: '#FAF5EE',
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5ECE1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scannerBody: {
    padding: 20,
  },
  cameraBox: {
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#090D16',
    marginBottom: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  greenLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  reticle: {
    width: 190,
    height: 190,
    borderWidth: 2.5,
    borderColor: '#22C55E',
    borderRadius: 18,
    overflow: 'hidden',
  },
  laser: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  torchBtn: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  torchBtnActive: {
    backgroundColor: '#854D0E',
    borderColor: '#FDE047',
  },
  torchBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  permissionFallbackBox: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 10,
  },
  permissionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  grantPermissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5D001E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 14,
  },
  grantPermissionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E7E5E4',
  },
  orDividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A8A29E',
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FAF5EE',
    borderWidth: 1.5,
    borderColor: '#E8DED2',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  lookupBtn: {
    backgroundColor: '#5D001E',
    borderRadius: 14,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookupBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  quickChipsContainer: {
    marginTop: 6,
  },
  quickChipsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78716C',
    marginBottom: 8,
  },
  quickChipsRow: {
    gap: 8,
  },
  quickIdChip: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  quickIdChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A3412',
  },

  // Scanned Triage View
  triageBody: {
    padding: 18,
  },
  scannedIdentityCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#F3E8DF',
    marginBottom: 14,
  },
  idCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  scannedName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
  },
  scannedDindi: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350F',
    marginTop: 2,
  },
  scannedMeta: {
    fontSize: 11,
    color: '#57534E',
    marginTop: 2,
  },
  scannedBloodBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  scannedBloodLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#991B1B',
  },
  scannedBloodValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#DC2626',
  },
  cardIdBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5ECE1',
  },
  scannedCardIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5D001E',
    letterSpacing: 1,
  },
  triageMedicalBox: {
    backgroundColor: '#FAF5EE',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8DED2',
    marginBottom: 14,
  },
  triageBoxTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#991B1B',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  triageInfoRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  triageInfoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1C1917',
  },
  triageInfoVal: {
    fontSize: 12,
    color: '#44403C',
    fontWeight: '600',
    marginTop: 1,
  },
  emergencyContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  contactCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  contactCardName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14532D',
    marginTop: 1,
  },
  contactCardPhone: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700',
  },
  callContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803D',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  callContactBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  reasonSelectorBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  reasonSelectorTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#44403C',
    marginBottom: 4,
  },
  reasonOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  reasonOptionBtnActive: {
    backgroundColor: '#FEF2F2',
  },
  reasonOptionText: {
    fontSize: 12,
    color: '#57534E',
    fontWeight: '600',
  },
  reasonOptionTextActive: {
    color: '#991B1B',
    fontWeight: '800',
  },
  triggerSosBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
    marginBottom: 10,
  },
  triggerSosBigBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scanAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  scanAnotherBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
  },
});

export default EmergencyQRScannerModal;
