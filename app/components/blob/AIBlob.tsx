import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';
import { colors } from '../../constants';

export interface AIBlobProps {
  size?: number;
  state?: 'idle' | 'listening' | 'processing' | 'speaking';
  style?: ViewStyle;
}

/**
 * Simplified, Calm & Minimalist Voice Orb.
 * Lightweight, polished, and subtle animation designed to communicate
 * listening/speaking states without visual distraction or heavy effects.
 */
export const AIBlob: React.FC<AIBlobProps> = ({
  size = 200,
  state = 'listening',
  style,
}) => {
  const breathAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Gentle, subtle breathing cycle
    const duration = state === 'processing' ? 1200 : 2600;
    const maxScale = state === 'speaking' ? 1.05 : 1.03;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: maxScale,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 0.98,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [state, breathAnim]);

  return (
    <View style={[styles.wrapper, { width: size, height: size }, style]}>
      {/* Soft, Subtle Outer Glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.12,
            height: size * 1.12,
            borderRadius: (size * 1.12) / 2,
            transform: [{ scale: breathAnim }],
          },
        ]}
      />

      {/* Main Calm Sphere */}
      <Animated.View
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: breathAnim }],
          },
        ]}
      >
        {/* Soft Saffron Atmosphere Dome */}
        <View
          style={[
            styles.saffronDome,
            {
              width: size * 0.96,
              height: size * 0.54,
              borderTopLeftRadius: size / 2,
              borderTopRightRadius: size / 2,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    backgroundColor: '#FFB866',
    opacity: 0.25,
    shadowColor: colors.saffron,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 4,
  },
  orb: {
    backgroundColor: '#FFF4DC',
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(230, 81, 0, 0.15)',
  },
  saffronDome: {
    backgroundColor: colors.saffronDark,
    opacity: 0.88,
  },
});

export default AIBlob;
