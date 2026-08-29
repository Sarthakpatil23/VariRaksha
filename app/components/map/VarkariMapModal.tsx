import React from 'react';
import { Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VarkariInteractiveMap } from './VarkariInteractiveMap';
import { colors } from '../../constants';

interface VarkariMapModalProps {
  visible: boolean;
  onClose: () => void;
  initialPointId?: string | null;
}

export const VarkariMapModal: React.FC<VarkariMapModalProps> = ({
  visible,
  onClose,
  initialPointId = null,
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
