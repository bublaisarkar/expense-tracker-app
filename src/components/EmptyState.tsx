import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, useTheme } from '../constants/theme';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  subtitle?: string;
};

export default function EmptyState({
  icon = 'receipt-outline',
  title = 'No records',
  subtitle = '',
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconBox, { backgroundColor: colors.backgroundSelected }]}>
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {!!subtitle && (
        <Text style={[styles.sub, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: Spacing.five },
  iconBox: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: Spacing.four },
});