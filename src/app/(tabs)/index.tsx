import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';                    // 👈 NEW
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BalanceCard from '../../components/BalanceCard';
import BudgetEditModal from '../../components/BudgetEditModal';
import EmptyState from '../../components/EmptyState';
import TransactionItem from '../../components/TransactionItem';
import { Radius, Shadow, Spacing, useTheme } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import { useTransactionModal } from '../../context/TransactionModalContext';
import { transactionService, type Transaction } from '../../services/transactionService';

export default function Home() {
  const { colors } = useTheme();
  const router = useRouter();                                 // 👈 NEW
  const { openAdd, openEdit, version, notifyChanged } = useTransactionModal();
  const { settings, updateSettings, formatMoney } = useSettings();

  const [query, setQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetEditOpen, setBudgetEditOpen] = useState(false);

  const load = useCallback(async () => {
    setTransactions(await transactionService.loadAll());
  }, []);

  useEffect(() => {
    load();
  }, [load, version]);

  const { income, expense, balance } = useMemo(() => {
    let inc = 0, exp = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    });
    return { income: inc, expense: exp, balance: inc - exp };
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter(
      (t) =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q) ||
        String(t.amount).includes(q)
    );
  }, [query, transactions]);

  const budget = settings.monthlyBudget;
  const budgetPct = Math.min((expense / Math.max(budget, 1)) * 100, 100);
  const overBudget = expense > budget;
  const barColor = overBudget ? colors.danger : colors.primary;

  const userName = settings.userName;
  const initial = userName.charAt(0).toUpperCase();

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      'Delete transaction?',
      tx.title || 'This entry',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await transactionService.remove(tx.id);
            notifyChanged();
          },
        },
      ]
    );
  };

  const handleSaveBudget = async (value: number) => {
    await updateSettings({ monthlyBudget: value });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.hello, { color: colors.textSecondary }]}>Hello,</Text>
            <Text style={[styles.name, { color: colors.text }]}>{userName} 👋</Text>
          </View>

          {/* 👇 Make the avatar navigate to Profile */}
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: colors.backgroundSelected }]}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: Spacing.four }}>
          <BalanceCard balance={balance} income={income} expense={expense} />
        </View>

        <View style={[styles.budgetCard, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.budgetTop}>
            <Text style={[styles.budgetLabel, { color: colors.textSecondary }]}>
              Monthly Budget
            </Text>

            <View style={styles.budgetRight}>
              <Text style={[styles.budgetValue, { color: colors.text }]}>
                {formatMoney(expense)} / {formatMoney(budget)}
              </Text>
              <TouchableOpacity
                onPress={() => setBudgetEditOpen(true)}
                hitSlop={10}
                style={styles.budgetEditBtn}
              >
                <Ionicons name="pencil" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.barBg, { backgroundColor: colors.border }]}>
            <View
              style={[styles.barFill, { width: `${budgetPct}%`, backgroundColor: barColor }]}
            />
          </View>
          <Text
            style={[
              styles.budgetHint,
              { color: overBudget ? colors.danger : colors.textSecondary },
            ]}
          >
            {budgetPct.toFixed(1)}% used{overBudget ? ' · over budget' : ''}
          </Text>
        </View>

        <View
          style={[
            styles.searchWrap,
            { backgroundColor: colors.backgroundElement, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            {filtered.length} items
          </Text>
        </View>

        <View style={[styles.listCard, { backgroundColor: colors.backgroundElement }]}>
          {filtered.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              subtitle="Tap the + button to add your first transaction"
            />
          ) : (
            filtered.map((item, idx) => (
              <View key={item.id}>
                <TransactionItem
                  item={item}
                  onPress={() => openEdit(item)}
                  onLongPress={() => handleDelete(item)}
                />
                {idx < filtered.length - 1 && (
                  <View style={[styles.sep, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={openAdd}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <BudgetEditModal
        visible={budgetEditOpen}
        initialValue={budget}
        onClose={() => setBudgetEditOpen(false)}
        onSave={handleSaveBudget}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.four,
  },
  hello: { fontSize: 14 },
  name: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', fontSize: 18 },

  budgetCard: {
    marginHorizontal: Spacing.four, marginTop: Spacing.four,
    padding: Spacing.three, borderRadius: Radius.lg, ...Shadow.soft,
  },
  budgetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetLabel: { fontSize: 13, fontWeight: '600' },
  budgetRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  budgetValue: { fontSize: 13, fontWeight: '700' },
  budgetEditBtn: { padding: 2 },
  barBg: { height: 8, borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  budgetHint: { fontSize: 11, marginTop: 6 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    marginHorizontal: Spacing.four, marginTop: Spacing.four,
    paddingHorizontal: Spacing.three, height: 50, borderRadius: Radius.md,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.four, marginTop: Spacing.four, marginBottom: Spacing.two,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionSub: { fontSize: 12 },

  listCard: {
    marginHorizontal: Spacing.four, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
  },
  sep: { height: 1 },

  fab: {
    position: 'absolute', right: Spacing.four, bottom: Spacing.five,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
});