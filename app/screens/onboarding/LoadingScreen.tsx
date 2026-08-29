import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useVideoPlayer, VideoView } from 'expo-video';
import { OnboardingScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';

// Require background video asset
const VIDEO_SOURCE = require('../../../assets/videos/loading_video.webm');
const LOADING_DURATION_MS = 4000;
const START_TIME_SECONDS = 1.0;

export const LoadingScreen: React.FC<OnboardingScreenProps<'Loading'>> = ({
  route,
  navigation,
}) => {
  const { t } = useTranslation();
  const preloadedPlayer = route.params?.preloadedPlayer;

  // Fallback player if navigated to without a pre-buffered instance
  const fallbackPlayer = useVideoPlayer(VIDEO_SOURCE, (p) => {
    p.loop = true;
    p.muted = true;
    p.currentTime = START_TIME_SECONDS;
    p.play();
  });

  const activePlayer = preloadedPlayer || fallbackPlayer;

  useEffect(() => {
    if (activePlayer) {
      try {
        if (!activePlayer.isPlaying) {
          activePlayer.play();
        }
      } catch (e) {}
    }

    const timer = setTimeout(() => {
      navigation.replace('ProfileConfirm');
    }, LOADING_DURATION_MS);

    return () => clearTimeout(timer);
  }, [activePlayer, navigation]);

  return (
    <View style={styles.container}>
      {/* Full-screen background video playing instantly with 0ms gap */}
      <VideoView
        style={styles.videoView}
        player={activePlayer}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
      />

      {/* Center-aligned single text line floating directly over background video */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingTitle}>
            {t('loadingTitle', 'Verifying your registration details...')}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  videoView: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
});

export default LoadingScreen;
