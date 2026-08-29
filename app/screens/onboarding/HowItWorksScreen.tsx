import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { OnboardingScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';
import { getUserRole } from '../../lib/userStore';

const TUTORIAL_VIDEO_SOURCE = require('../../../assets/videos/how_it_works.mp4');

export const HowItWorksScreen: React.FC<OnboardingScreenProps<'HowItWorks'>> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isEnded, setIsEnded] = useState<boolean>(false);

  // Initialize 9:16 full-screen video player paused at 0th second
  const player = useVideoPlayer(TUTORIAL_VIDEO_SOURCE, (p) => {
    p.loop = false;
    p.muted = false;
    p.currentTime = 0;
    p.pause();
  });

  // Listen for video completion event
  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('playToEnd', () => {
      setIsPlaying(false);
      setIsEnded(true);
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  const handleWatchTutorial = () => {
    setIsPlaying(true);
    setIsEnded(false);
    try {
      player.currentTime = 0;
      player.play();
    } catch (e) {
      console.log('Error playing tutorial video:', e);
    }
  };

  const handleSkip = () => {
    try {
      player.pause();
    } catch (e) {}
    const parentNav = navigation.getParent();

    if (parentNav) {
      (parentNav as any).navigate('MainApp');
    } else {
      (navigation as any).navigate('MainApp');
    }
  };

  return (
    <View style={styles.container}>
      {/* Full-Screen Video Background without native controls */}
      <VideoView
        style={styles.fullScreenVideoPlayer}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
      />

      {/* Floating UI Overlay */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlayContent}>
          {/* Top Header Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={22} color={colors.maroon} />
            </TouchableOpacity>
            <View style={styles.brandBadge}>
              <Text style={styles.brandTitle}>Vari Raksha • वारी रक्षा</Text>
            </View>
            <View style={styles.topBarSpacer} />
          </View>

          {/* Center Play / Replay Badge (Hidden while video is playing) */}
          {!isPlaying ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleWatchTutorial}
              style={styles.centerPlayButton}
            >
              <View style={styles.playBadge}>
                <Ionicons
                  name={isEnded ? 'refresh' : 'play'}
                  size={38}
                  color={colors.surface}
                  style={isEnded ? null : styles.playIcon}
                />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.centerSpacer} />
          )}

          {/* Bottom Action Area */}
          <View style={styles.bottomArea}>
            {/* Watch / Replay Tutorial Button (Disappears when playing, reappears as Replay when ended) */}
            {!isPlaying && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleWatchTutorial}
                style={styles.watchButton}
                accessibilityRole="button"
              >
                <Ionicons
                  name={isEnded ? 'refresh-circle' : 'play-circle'}
                  size={24}
                  color={colors.surface}
                  style={styles.buttonIcon}
                />
                <Text style={styles.watchButtonText}>
                  {isEnded
                    ? t('replayTutorial', 'Replay Video')
                    : t('watchTutorialButton', 'Watch Tutorial')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Skip Button (Always visible so user can proceed anytime) */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSkip}
              style={styles.skipButtonContainer}
              accessibilityRole="button"
            >
              <Text style={styles.skipButtonText}>
                {t('skipButton', 'Skip')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenVideoPlayer: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  brandBadge: {
    backgroundColor: 'rgba(93, 0, 30, 0.75)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.cream,
    letterSpacing: 0.8,
  },
  topBarSpacer: {
    width: 40,
  },
  centerPlayButton: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSpacer: {
    flex: 1,
  },
  playBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.saffronDark,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  playIcon: {
    marginLeft: 4,
  },
  bottomArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  watchButton: {
    width: '100%',
    minHeight: 56,
    backgroundColor: colors.saffronDark,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  watchButtonText: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  skipButtonContainer: {
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
});

export default HowItWorksScreen;
