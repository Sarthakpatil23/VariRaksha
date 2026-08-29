import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../constants';

export interface LanguageCardProps {
  languageCode: 'en' | 'hi' | 'mr';
  languageName: string;
  nativeName: string;
  isSelected: boolean;
  onSelect: (code: 'en' | 'hi' | 'mr') => void;
  style?: ViewStyle;
}

export const LanguageCard: React.FC<LanguageCardProps> = ({
  languageCode,
  languageName,
  nativeName,
  isSelected,
  onSelect,
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={() => onSelect(languageCode)}
      style={[styles.card, isSelected && styles.selectedCard, style]}
    >
      <Text style={styles.nativeName}>{nativeName}</Text>
      <Text style={styles.languageName}>{languageName}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  selectedCard: {
    borderColor: colors.saffron,
    backgroundColor: colors.cream,
  },
  nativeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  languageName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default LanguageCard;
