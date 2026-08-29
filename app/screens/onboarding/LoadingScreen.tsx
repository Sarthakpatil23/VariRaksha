import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useVideoPlayer, VideoView } from 'expo-video';
import { OnboardingScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';
import { fetchRegisteredActorByPhone } from '../../services/authService';
import { getUserRole, setUserProfile } from '../../lib/userStore';

const VIDEO_SOURCE = require('../../../assets/videos/loading_video.webm');
const MIN_LOADING_TIME_MS = 2500;
const START_TIME_SECONDS = 1.0;

export const LoadingScreen: React.FC<OnboardingScreenProps<'Loading'>> = ({
  route,
  navigation,
}) => {
  const { t, i18n } = useTranslation();
  const isMarathi = i18n.language === 'mr';

  const rawMobile = route.params?.mobileNumber || '9423010001';
  const role = (route.params?.selectedRole as any) || getUserRole();
  const preloadedPlayer = route.params?.preloadedPlayer;

  // Fallback player if navigated without pre-buffered player
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

    let isMounted = true;
    const startTime = Date.now();

    const doLookup = async () => {
      try {
        console.log('[LoadingScreen] Fetching profile from database for:', rawMobile, role);
        const profile = await fetchRegisteredActorByPhone(rawMobile, role);

        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME_MS - elapsedTime);

        setTimeout(() => {
          if (!isMounted) return;

          if (profile) {
            console.log('[LoadingScreen] Found registered profile:', profile.fullName);
            setUserProfile(profile);
            navigation.replace('ProfileConfirm', { profile });
          } else {
            console.log('[LoadingScreen] No matching profile found in database.');
            navigation.replace('ProfileNotFound', {
              mobileNumber: rawMobile,
              selectedRole: role,
            });
          }
        }, remainingTime);
      } catch (err) {
        console.error('[LoadingScreen] Error during profile lookup:', err);
        setTimeout(() => {
          if (isMounted) {
            navigation.replace('ProfileNotFound', {
              mobileNumber: rawMobile,
              selectedRole: role,
            });
          }
        }, MIN_LOADING_TIME_MS);
      }
    };

    doLookup();

    return () => {
      isMounted = false;
    };
  }, [activePlayer, navigation, rawMobile, role]);

  return (
    <View style={styles.container}>
      {/* Full-screen background video playing with 0ms gap */}
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
            {isMarathi
              ? 'तुमची नोंदणी व दिंडी माहिती शोधत आहोत...'
              : 'Verifying your registration details with database...'}
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
    lineHeight: 30,
  },
});

export default LoadingScreen;
