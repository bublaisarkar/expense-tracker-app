import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';                     // 👈 NEW

import { Radius, Shadow, Spacing, useTheme } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import { transactionService, type Transaction } from '../../services/transactionService';
import { walletService, type Wallet as WalletType } from '../../services/walletService';
import { useTransactionModal } from '../../context/TransactionModalContext';

export default function Wallet() {
  const { colors } = useTheme();
  const router = useRouter();                                 // 👈 NEW
  const { version } = useTransactionModal();
  const { formatMoney } = useSettings();

  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, txs] = await Promise.all([
        walletService.load(),
        transactionService.loadAll(),
      ]);
      setWallet(w);
      setTransactions(txs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, version]);

  const { income, expense } = useMemo(() => {
    let inc = 0, exp = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    });
    return { income: inc, expense: exp };
  }, [transactions]);

  const initial = wallet?.initialBalance ?? 0;
  const currentBalance = initial + income - expense;

  const handleSave = async (value: number) => {
    const next: WalletType = { initialBalance: value };
    await walletService.save(next);
    setWallet(next);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>My Wallet</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Manage your starting balance
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

        {/* Current balance hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary, ...Shadow.card }]}>
          <Text style={styles.heroLabel}>Current Balance</Text>
          <Text style={styles.heroValue}>{formatMoney(currentBalance)}</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Ionicons name="arrow-down" size={14} color="#55EFC4" />
              <Text style={styles.heroStatText}>In {formatMoney(income)}</Text>
            </View>
            <View style={styles.heroStat}>
              <Ionicons name="arrow-up" size={14} color="#FFB8B8" />
              <Text style={styles.heroStatText}>Out {formatMoney(expense)}</Text>
            </View>
          </View>
        </View>

        {/* Initial balance card */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                Initial Balance
              </Text>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {formatMoney(initial)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: colors.background }]}
              onPress={() => setEditOpen(true)}
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Your current balance = initial balance + income − expense.
          </Text>
        </View>

        {/* Breakdown */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          <Text style={[styles.section, { color: colors.text }]}>How it adds up</Text>

          <Row
            colors={colors}
            label="Initial balance"
            value={formatMoney(initial)}
          />
          <Row
            colors={colors}
            label="Total income"
            value={`+ ${formatMoney(income)}`}
            positive
          />
          <Row
            colors={colors}
            label="Total expense"
            value={`− ${formatMoney(expense)}`}
            negative
            last
          />
        </View>
      </ScrollView>

      <WalletEditModal
        visible={editOpen}
        initialValue={initial}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

function Row({
  colors, label, value, positive, negative, last,
}: {
  colors: any;
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
  last?: boolean;
}) {
  const color = positive ? colors.income : negative ? colors.expense : colors.text;
  return (
    <View style={[styles.brRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={{ color: colors.text, fontSize: 14 }}>{label}</Text>
      <Text style={{ color, fontWeight: '700', fontSize: 14 }}>{value}</Text>
    </View>
  );
}

function WalletEditModal({
  visible, initialValue, onClose, onSave,
}: {
  visible: boolean;
  initialValue: number;
  onClose: () => void;
  onSave: (v: number) => void | Promise<void>;
}) {
  const { colors } = useTheme();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) setValue(initialValue ? String(initialValue) : '');
  }, [visible, initialValue]);

  const submit = async () => {
    const num = Number(value);
    if (!value || isNaN(num)) {
      Alert.alert('Invalid amount', 'Enter a valid number.');
      return;
    }
    await onSave(num);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Initial Balance
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: Spacing.three }}>
            The amount you had before you started using this app.
          </Text>

          <TextInput
            style={[styles.input, {
              color: colors.text,
              backgroundColor: colors.background,
              borderColor: colors.border,
            }]}
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            autoFocus
            onSubmitEditing={submit}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.background }]}
              onPress={onClose}
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={submit}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.four,
  },
  title: { fontSize: 26, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 4 },
  gear: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  hero: { marginHorizontal: Spacing.four, padding: Spacing.four, borderRadius: Radius.xl },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  heroValue: { color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 6 },
  heroRow: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.three },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroStatText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },

  card: {
    marginHorizontal: Spacing.four, marginTop: Spacing.four,
    borderRadius: Radius.lg, padding: Spacing.four, ...Shadow.soft,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardLabel: { fontSize: 13, fontWeight: '600' },
  cardValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md,
  },
  hint: { fontSize: 12, marginTop: Spacing.three, lineHeight: 18 },

  section: { fontSize: 15, fontWeight: '800', marginBottom: Spacing.two },
  brRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: Spacing.three,
  },

  backdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four },
  modalCard: { padding: Spacing.four, borderRadius: Radius.xl },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.two,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  input: {
    height: 52, paddingHorizontal: Spacing.three,
    borderRadius: Radius.md, borderWidth: 1, fontSize: 18, fontWeight: '700',
  },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: Spacing.three },
  modalBtn: {
    flex: 1, height: 48, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
});