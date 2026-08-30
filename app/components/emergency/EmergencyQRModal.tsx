/**
 * VariRaksha — Dynamic Emergency ID Card & QR Display Modal
 *
 * Displays the Pilgrim's official digital Wari Emergency Pass with a dynamic QR code
 * containing all personal, contact, Dindi, and critical medical info.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { UserProfile } from '../../lib/userStore';
import { generateEmergencyIdQRString } from '../../services/emergencyIdService';
import { colors, spacing, typography } from '../../constants';

interface EmergencyQRModalProps {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export const EmergencyQRModal: React.FC<EmergencyQRModalProps> = ({
  visible,
  onClose,
  profile,
}) => {
  const qrPayloadString = generateEmergencyIdQRString(profile);
  const cardId = profile.emergencyCardId || 'VK-DEHU01';
  const encodedData = encodeURIComponent(qrPayloadString);

  // High-reliability QR Code HTML template (renders in 0ms via WebView)
  const qrHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            background: #FFFFFF;
            height: 100vh;
            overflow: hidden;
          }
          .qr-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          img {
            width: 200px;
            height: 200px;
            image-rendering: pixelated;
          }
        </style>
      </head>
      <body>
        <div class="qr-box">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodedData}&color=1E1B4B" alt="QR Code" />
        </div>
      </body>
    </html>
  `;

  const handleShare = async () => {
    Vibration.vibrate(30);
    try {
      await Share.share({
        title: `VariRaksha Emergency ID - ${profile.fullName}`,
        message: `🚩 VariRaksha Digital Pilgrim Pass\n👤 Name: ${profile.fullName}\n🪪 ID: ${cardId}\n🚩 Dindi: ${profile.dindiName || 'Sant Tukaram Dindi #01'}\n🩸 Blood: ${profile.bloodGroup || 'B+'}\n📞 Emergency Contact: ${profile.emergencyContacts?.[0]?.phoneNumber || '+91 94230 11221'}\n\nScan this pass using the VariRaksha app during emergencies.`,
      });
    } catch {
      // Ignore
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.cardContainer}>
          {/* Top Pass Header Banner */}
          <View style={styles.passHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerOrgText}>वारी रक्षा • VARIRAKSHA</Text>
              <Text style={styles.headerPassTitle}>OFFICIAL PILGRIM EMERGENCY PASS</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Pilgrim Identity Row */}
            <View style={styles.identitySection}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pilgrimName}>{profile.fullName}</Text>
                <Text style={styles.dindiBadge}>
                  🚩 {profile.dindiName || 'Sant Tukaram Maharaj Dindi #01'}
                </Text>
                <Text style={styles.phoneText}>📞 {profile.mobileNumber}</Text>
              </View>
              <View style={styles.bloodBadgeBox}>
                <Text style={styles.bloodBadgeLabel}>BLOOD</Text>
                <Text style={styles.bloodBadgeValue}>{profile.bloodGroup || 'B+'}</Text>
              </View>
            </View>

            {/* QR Code Container */}
            <View style={styles.qrWrapper}>
              <View style={styles.qrFrame}>
                <WebView
                  originWhitelist={['*']}
                  source={{ html: qrHtml }}
                  style={styles.qrWebView}
                  scrollEnabled={false}
                />
              </View>
              <Text style={styles.cardIdText}>{cardId}</Text>
              <Text style={styles.scanInstruction}>
                Scan with any VariRaksha app to view medical history & trigger 1-tap SOS
              </Text>
            </View>

            {/* Medical Info Pills */}
            <View style={styles.medicalInfoBox}>
              <View style={styles.medicalRow}>
                <Ionicons name="heart" size={16} color="#DC2626" />
                <Text style={styles.medicalLabel}>Medical Conditions:</Text>
              </View>
              <Text style={styles.medicalValue}>
                {profile.medicalConditions?.length
                  ? profile.medicalConditions.join(', ')
                  : 'No chronic conditions listed'}
              </Text>

              <View style={[styles.medicalRow, { marginTop: 10 }]}>
                <Ionicons name="warning" size={16} color="#D97706" />
                <Text style={styles.medicalLabel}>Critical Allergies:</Text>
              </View>
              <Text style={styles.medicalValue}>
                {profile.allergies?.length
                  ? profile.allergies.join(', ')
                  : 'No known drug or food allergies'}
              </Text>

              <View style={[styles.medicalRow, { marginTop: 10 }]}>
                <Ionicons name="call" size={16} color="#0284C7" />
                <Text style={styles.medicalLabel}>Emergency Contact:</Text>
              </View>
              <Text style={styles.medicalValue}>
                {profile.emergencyContacts?.[0]?.name || 'Family / Leader'}:{' '}
                {profile.emergencyContacts?.[0]?.phoneNumber || '+91 94230 11221'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleShare}
                style={styles.shareBtn}
              >
                <Ionicons name="share-social" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.shareBtnText}>Share Digital ID</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                style={styles.doneBtn}
              >
                <Text style={styles.doneBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  passHeader: {
    backgroundColor: '#5D001E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: {
    flex: 1,
  },
  headerOrgText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerPassTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    padding: 20,
  },
  identitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DF',
  },
  pilgrimName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
  },
  dindiBadge: {
    fontSize: 12,
    color: '#78350F',
    fontWeight: '700',
    marginTop: 3,
  },
  phoneText: {
    fontSize: 12,
    color: '#57534E',
    marginTop: 2,
  },
  bloodBadgeBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  bloodBadgeLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#991B1B',
  },
  bloodBadgeValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#DC2626',
    marginTop: 1,
  },
  qrWrapper: {
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F5EBE1',
    marginBottom: 16,
  },
  qrFrame: {
    width: 210,
    height: 210,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  qrWebView: {
    width: 210,
    height: 210,
    backgroundColor: '#FFFFFF',
  },
  cardIdText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#5D001E',
    letterSpacing: 2,
    marginTop: 10,
  },
  scanInstruction: {
    fontSize: 11,
    color: '#78716C',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },
  medicalInfoBox: {
    backgroundColor: '#FAF5EE',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8DED2',
    marginBottom: 18,
  },
  medicalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  medicalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C1917',
  },
  medicalValue: {
    fontSize: 12,
    color: '#44403C',
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shareBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5D001E',
    borderRadius: 14,
    paddingVertical: 12,
    shadowColor: '#5D001E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  doneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5ECE1',
    borderRadius: 14,
    paddingVertical: 12,
  },
  doneBtnText: {
    color: '#78350F',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default EmergencyQRModal;
