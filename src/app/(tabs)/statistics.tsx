import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';                     // 👈 NEW

import { Radius, Shadow, Spacing, useTheme } from '../../constants/theme';
import DonutChart, { type Segment } from '../../components/DonutChart';
import EmptyState from '../../components/EmptyState';
import { transactionService, type Transaction } from '../../services/transactionService';
import { useCategories } from '../../context/CategoriesContext';
import { useSettings } from '../../context/SettingsContext';
import { useTransactionModal } from '../../context/TransactionModalContext';

type Range = 'week' | 'month' | 'year';

export default function Statistics() {
  const { colors } = useTheme();
  const router = useRouter();                                 // 👈 NEW
  const { version } = useTransactionModal();
  const { getCategory } = useCategories();
  const { formatMoney } = useSettings();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('month');
  const [tab, setTab] = useState<'expense' | 'income'>('expense');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTransactions(await transactionService.loadAll());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, version]);

  const rangeStart = useMemo(() => {
    const now = new Date();
    if (range === 'week') {
      const d = new Date(now);
      d.setDate(now.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    if (range === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    }
    return new Date(now.getFullYear(), 0, 1).getTime();
  }, [range]);

  const inRange = useMemo(
    () => transactions.filter((t) => t.date >= rangeStart && t.type === tab),
    [transactions, rangeStart, tab],
  );

  const segments: Segment[] = useMemo(() => {
    const map = new Map<string, number>();
    inRange.forEach((t) => {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([key, value]) => {
        const cat = getCategory(key);
        return { key, value, color: cat.color, label: cat.label };
      })
      .sort((a, b) => b.value - a.value);
  }, [inRange, getCategory]);

  const total = segments.reduce((s, x) => s + x.value, 0);
  const rangeLabel =
    range === 'week' ? 'This week' : range === 'month' ? 'This month' : 'This year';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              {rangeLabel}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.gear, { backgroundColor: colors.backgroundElement }]}
            hitSlop={8}
            onPress={() => router.push('/(tabs)/profile')}   // 👈 NEW
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Range selector */}
        <View style={[styles.segment, { backgroundColor: colors.backgroundElement }]}>
          {(['week', 'month', 'year'] as const).map((r) => {
            const active = range === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.segBtn, active && { backgroundColor: colors.background }]}
                onPress={() => setRange(r)}
              >
                <Text
                  style={[
                    styles.segText,
                    {
                      color: active ? colors.primary : colors.textSecondary,
                      fontWeight: active ? '700' : '600',
                    },
                  ]}
                >
                  {r === 'week' ? 'Week' : r === 'month' ? 'Month' : 'Year'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Expense / Income toggle */}
        <View
          style={[
            styles.segment,
            { backgroundColor: colors.backgroundElement, marginTop: Spacing.two },
          ]}
        >
          {(['expense', 'income'] as const).map((t) => {
            const active = tab === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.segBtn, active && { backgroundColor: colors.background }]}
                onPress={() => setTab(t)}
              >
                <Text
                  style={[
                    styles.segText,
                    {
                      color: active ? colors.primary : colors.textSecondary,
                      fontWeight: active ? '700' : '600',
                    },
                  ]}
                >
                  {t === 'expense' ? 'Expense' : 'Income'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={{ paddingVertical: Spacing.six, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : segments.length === 0 ? (
          <EmptyState
            icon="stats-chart-outline"
            title="No data yet"
            subtitle={`Add some ${tab} transactions to see the breakdown`}
          />
        ) : (
          <>
            {/* Chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.backgroundElement }]}>
              <DonutChart
                segments={segments}
                total={total}
                centerValue={formatMoney(total)}
                centerLabel={tab === 'expense' ? 'Spent' : 'Earned'}
                emptyLabel="No data"
              />
            </View>

            {/* Legend list */}
            <View style={[styles.listCard, { backgroundColor: colors.backgroundElement }]}>
              {segments.map((s, idx) => {
                const pct = total > 0 ? (s.value / total) * 100 : 0;
                return (
                  <View key={s.key}>
                    <View style={styles.row}>
                      <View style={[styles.dot, { backgroundColor: s.color }]} />
                      <Text
                        style={[styles.rowLabel, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {s.label}
                      </Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.rowValue, { color: colors.text }]}>
                          {formatMoney(s.value)}
                        </Text>
                        <Text style={[styles.rowPct, { color: colors.textSecondary }]}>
                          {pct.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                    {idx < segments.length - 1 && (
                      <View style={[styles.sep, { backgroundColor: colors.border }]} />
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  title: { fontSize: 26, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 4 },
  gear: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  segment: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    borderRadius: Radius.md,
    padding: 4,
  },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.sm },
  segText: { fontSize: 13 },

  chartCard: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    ...Shadow.soft,
  },

  listCard: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    ...Shadow.soft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  rowValue: { fontSize: 14, fontWeight: '700' },
  rowPct: { fontSize: 11, marginTop: 2 },
  sep: { height: 1 },
});