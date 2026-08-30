import React from 'react';
import { Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VarkariInteractiveMap, ActiveSOSMapData, ClaimedRouteMapData } from './VarkariInteractiveMap';
import { colors } from '../../constants';

interface VarkariMapModalProps {
  visible: boolean;
  onClose: () => void;
  initialPointId?: string | null;
  activeSOS?: ActiveSOSMapData | null;
  claimedRoute?: ClaimedRouteMapData | null;
  onCallVolunteer?: (phone: string) => void;
  onResolveSOS?: () => void;
  onVolunteerArrived?: () => void;
  onEscalateMedical?: () => void;
}

export const VarkariMapModal: React.FC<VarkariMapModalProps> = ({
  visible,
  onClose,
  initialPointId = null,
  activeSOS = null,
  claimedRoute = null,
  onCallVolunteer,
  onResolveSOS,
  onVolunteerArrived,
  onEscalateMedical,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <VarkariInteractiveMap
          isFullScreen={true}
          onClose={onClose}
          initialSelectedId={initialPointId}
          activeSOS={activeSOS}
          claimedRoute={claimedRoute}
          onCallVolunteer={onCallVolunteer}
          onResolveSOS={onResolveSOS}
          onVolunteerArrived={onVolunteerArrived}
          onEscalateMedical={onEscalateMedical}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default VarkariMapModal;
