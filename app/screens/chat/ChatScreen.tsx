import React from 'react';
import { StyleSheet, Alert, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants';
import { VariRakshaChatbot } from '../../components/chat/VariRakshaChatbot';
import { useUserRole, useUserProfile } from '../../lib/userStore';

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const role = useUserRole();
  const profile = useUserProfile();
  const persona = role === 'dindiLeader' ? 'dindiLeader' : 'varkari';

  const handleActionPress = (actionType: string) => {
    Vibration.vibrate(30);

    const leaderName = profile?.dindiLeaderName || 'ह.भ.प. सोपानराव महाराज';
    const leaderPhone = '+91 98765 43210';

    if (actionType === 'call_leader') {
      Alert.alert(
        '📞 Call Dindi Leader',
        `Calling ${leaderName} (${leaderPhone})...`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call Now', style: 'default' },
        ],
      );
    } else if (actionType === 'medical_sos') {
      Alert.alert(
        '🚑 Route Medical Emergency',
        'Mobile Medical Camp #2 alerted with your GPS location and emergency medical card.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View Emergency Card',
            onPress: () => {
              try {
                navigation.navigate('Medical');
              } catch (e) {
                // Ignore if not in pilgrim navigator
              }
            },
          },
        ],
      );
    } else if (actionType === 'broadcast') {
      try {
        navigation.navigate('Broadcast');
      } catch (e) {
        // Ignore if not in leader navigator
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <VariRakshaChatbot
        mode={persona}
        onActionPress={handleActionPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default ChatScreen;
