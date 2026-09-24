import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, useTheme } from '../constants/theme';
import { formatDate } from '../utils/format';
import { useCategory } from '../context/CategoriesContext';
import { useSettings } from '../context/SettingsContext';

type Props = {
  item: any;
  onPress?: () => void;
  onLongPress?: () => void;
};

export default function TransactionItem({ item, onPress, onLongPress }: Props) {
  const { colors } = useTheme();
  const cat = useCategory(item.category);
  const { formatMoney } = useSettings();
  const isIncome = item.type === 'income';

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: cat.color + '22' }]}>
        <Ionicons name={cat.icon} size={20} color={cat.color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.title || cat.label}
        </Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          {cat.label} · {formatDate(item.date)}
        </Text>
      </View>

      <Text style={[styles.amount, { color: isIncome ? colors.income : colors.expense }]}>
        {isIncome ? '+' : '-'}{formatMoney(item.amount)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, marginTop: 3 },
  amount: { fontSize: 15, fontWeight: '700' },
});