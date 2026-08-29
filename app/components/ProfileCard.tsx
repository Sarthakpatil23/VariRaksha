import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../constants';
import { Pilgrim } from '../types';

export interface ProfileCardProps {
  pilgrim?: Partial<Pilgrim>;
  style?: ViewStyle;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ pilgrim, style }) => {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.name}>{pilgrim?.fullName || 'Pilgrim Profile Placeholder'}</Text>
      <Text style={styles.details}>
        {pilgrim?.mobileNumber ? `Phone: ${pilgrim.mobileNumber}` : 'Mobile: +91 XXXXX XXXXX'}
      </Text>
      <Text style={styles.details}>
        {pilgrim?.emergencyId ? `Emergency ID: ${pilgrim.emergencyId}` : 'Emergency ID: Not assigned'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  details: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default ProfileCard;
