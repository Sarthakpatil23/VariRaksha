import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../constants';

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC<OnboardingScreenProps<'Splash'>> = ({ navigation }) => {
  useEffect(() => {
    // Hold splash screen with logo & name for 2 seconds, then auto-redirect to LanguageSelect
    const timer = setTimeout(() => {
      navigation.replace('LanguageSelect');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Container with circular badge & shadow */}
        <View style={styles.logoCard}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Product Branding */}
        <View style={styles.brandContainer}>
          <Text style={styles.appName}>Vari Raksha</Text>
          <Text style={styles.marathiTitle}>वारी रक्षा</Text>
          <View style={styles.divider} />
          <Text style={styles.tagline}>Offline-First Emergency Safety for Pilgrims</Text>
        </View>
      </View>

      {/* Traditional Footer Accent */}
      <View style={styles.footerAccent}>
        <Text style={styles.footerText}>जय हरी विठ्ठल</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoCard: {
    width: width * 0.48,
    height: width * 0.48,
    borderRadius: (width * 0.48) / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    shadowColor: colors.maroon,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(230, 81, 0, 0.2)',
    marginBottom: spacing.xl,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.maroon,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  marathiTitle: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.saffronDark,
    marginTop: spacing.xs,
    letterSpacing: 1,
  },
  divider: {
    width: 64,
    height: 3,
    backgroundColor: colors.saffron,
    borderRadius: 2,
    marginVertical: spacing.md,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  footerAccent: {
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.saffronDark,
    opacity: 0.85,
    letterSpacing: 1.5,
  },
});

export default SplashScreen;
