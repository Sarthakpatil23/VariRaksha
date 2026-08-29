import React from 'react';
import { StyleSheet, Alert, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants';
import { VariRakshaChatbot } from '../../components/chat/VariRakshaChatbot';
import { useUserRole } from '../../lib/userStore';

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const role = useUserRole();
  const persona = role === 'dindiLeader' ? 'dindiLeader' : 'varkari';

  const handleActionPress = (actionType: string) => {
    Vibration.vibrate(30);

    if (actionType === 'call_leader') {
      Alert.alert(
        '📞 Call Dindi Leader',
        'Calling ह.भ.प. सोपानराव महाराज (+91 98765 43210)...',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call Now', style: 'default' },
        ],
      );
    } else if (actionType === 'medical_sos') {
      Alert.alert(
        '🚑 Route Medical Camp',
        'Mobile Medical Unit #2 alerted to your GPS location.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View Medical ID',
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
