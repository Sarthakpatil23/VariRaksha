import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThinkingOrb, OrbState, OrbSize, OrbTheme } from './ThinkingOrb';

export interface AIBlobProps {
  size?: OrbSize;
  state?: OrbState | string;
  color?: string;
  theme?: OrbTheme;
  style?: ViewStyle;
}

/**
 * AIBlob / ThinkingOrb Voice indicator component.
 * Renders the real-time animated dotted thought-orb waveform animation.
 */
export const AIBlob: React.FC<AIBlobProps> = ({
  size = 240,
  state = 'listening',
  color = '#FF7700',
  theme = 'light',
  style,
}) => {
  return (
    <View style={[styles.wrapper, style]}>
      <ThinkingOrb state={state} size={size} color={color} theme={theme} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});

export { ThinkingOrb };
export default AIBlob;
