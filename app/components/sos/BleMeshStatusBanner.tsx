/**
 * BLE Mesh Status Banner
 *
 * Animated banner component showing Bluetooth mesh SOS status:
 * - Pilgrim side: "Broadcasting SOS via Bluetooth..." with pulsing animation
 * - Volunteer side: "BLE Mesh Active — Scanning for emergencies"
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants';

type BannerMode = 'broadcasting' | 'scanning' | 'received' | 'relayed' | 'idle';

interface BleMeshStatusBannerProps {
  mode: BannerMode;
  pilgrimName?: string;
  distance?: string;
  onPress?: () => void;
}

export const BleMeshStatusBanner: React.FC<BleMeshStatusBannerProps> = ({
  mode,
  pilgrimName,
  distance,
  onPress,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mode === 'broadcasting' || mode === 'received') {
      // Pulsing scale animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );

      // Glow opacity animation
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: false,
          }),
        ]),
      );

      pulse.start();
      glow.start();

      return () => {
        pulse.stop();
        glow.stop();
      };
    } else if (mode === 'scanning') {
      // Slow pulse for scanning
      const slowPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      );
      slowPulse.start();
      return () => slowPulse.stop();
    }
  }, [mode]);

  const getBannerConfig = () => {
    switch (mode) {
      case 'broadcasting':
        return {
          icon: 'bluetooth' as const,
          title: '📡 Broadcasting SOS via Bluetooth',
          subtitle: 'Searching for nearby volunteers...',
          bgColor: '#1A237E',
          borderColor: '#3F51B5',
          iconColor: '#64B5F6',
        };
      case 'scanning':
        return {
          icon: 'radio-outline' as const,
          title: '📡 BLE Mesh Active',
          subtitle: 'Scanning for nearby SOS beacons...',
          bgColor: '#1B5E20',
          borderColor: '#4CAF50',
          iconColor: '#81C784',
        };
      case 'received':
        return {
          icon: 'alert-circle' as const,
          title: `🚨 OFFLINE SOS RECEIVED!`,
          subtitle: pilgrimName
            ? `${pilgrimName} needs help${distance ? ` • ${distance}` : ''}`
            : 'Emergency alert via BLE Mesh',
          bgColor: '#B71C1C',
          borderColor: '#F44336',
          iconColor: '#FF8A80',
        };
      case 'relayed':
        return {
          icon: 'checkmark-circle' as const,
          title: '✅ SOS Relayed to Cloud',
          subtitle: 'Alert uploaded to dashboard',
          bgColor: '#004D40',
          borderColor: '#009688',
          iconColor: '#80CBC4',
        };
      default:
        return {
          icon: 'bluetooth-outline' as const,
          title: 'BLE Mesh Ready',
          subtitle: 'Bluetooth mesh relay standby',
          bgColor: '#37474F',
          borderColor: '#607D8B',
          iconColor: '#90A4AE',
        };
    }
  };

  const config = getBannerConfig();

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0)', `${config.borderColor}55`],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={!onPress}
    >
      <Animated.View
        style={[
          styles.banner,
          {
            backgroundColor: config.bgColor,
            borderColor: config.borderColor,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        {/* Glow overlay */}
        <Animated.View
          style={[
            styles.glowOverlay,
            { backgroundColor: glowColor },
          ]}
        />

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={config.icon}
              size={22}
              color={config.iconColor}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>
          </View>

          {mode === 'broadcasting' && (
            <View style={styles.signalDots}>
              <Animated.View style={[styles.dot, styles.dot1, { opacity: glowAnim }]} />
              <Animated.View style={[styles.dot, styles.dot2, { opacity: glowAnim }]} />
              <Animated.View style={[styles.dot, styles.dot3, { opacity: glowAnim }]} />
            </View>
          )}

          {mode === 'scanning' && (
            <Ionicons
              name="radio"
              size={18}
              color={config.iconColor}
              style={styles.scanIcon}
            />
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: typography.fontWeight.bold as any,
    letterSpacing: 0.3,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 2,
  },
  signalDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: spacing.xs,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#64B5F6',
  },
  dot1: { width: 4, height: 4 },
  dot2: { width: 5, height: 5 },
  dot3: { width: 6, height: 6 },
  scanIcon: {
    marginLeft: spacing.xs,
  },
});

export default BleMeshStatusBanner;
