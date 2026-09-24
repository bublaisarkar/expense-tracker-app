import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Shadow, Spacing, useTheme } from '../constants/theme';
import { transactionService, type Transaction } from '../services/transactionService';
import { useCategories } from '../context/CategoriesContext';
import CategoriesModal from './CategoriesModal';

const PAYMENT_METHODS = [
  { key: 'upi',    label: 'UPI',    icon: 'qr-code' as const },
  { key: 'cash',   label: 'Cash',   icon: 'cash' as const },
  { key: 'debit',  label: 'Debit',  icon: 'card' as const },
  { key: 'credit', label: 'Credit', icon: 'card-outline' as const },
  { key: 'bank',   label: 'Bank',   icon: 'business' as const },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editing?: Transaction | null;
};

export default function TransactionModal({ visible, onClose, onSaved, editing }: Props) {
  const { colors } = useTheme();
  const { categories, addCategory } = useCategories();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('food');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [addingCustom, setAddingCustom] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  // Load editing values / reset for a new transaction
  useEffect(() => {
    if (!visible) return;

    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setTitle(editing.title ?? '');
      setCategory(editing.category);
      setPaymentMethod(editing.paymentMethod ?? 'upi');
      setNote(editing.note ?? '');
    } else {
      setType('expense');
      setAmount('');
      setTitle('');
      setCategory('food');
      setPaymentMethod('upi');
      setNote('');
    }
    setAddingCustom(false);
    setNewCatName('');
  }, [visible, editing]);

  // Categories filtered by the current type, straight from context
  const allCategories = categories.filter((c) => c.type === type);

  // If the selected category doesn't exist for this type, snap to the first one
  useEffect(() => {
    if (!visible) return;
    const exists = allCategories.some((c) => c.key === category);
    if (!exists && allCategories.length > 0) {
      setCategory(allCategories[0].key);
    }
  }, [visible, type, allCategories, category]);

  const onSave = async () => {
    const num = Number(amount);
    if (!amount || isNaN(num) || num <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount greater than 0.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type,
        amount: num,
        title: title.trim(),
        category,
        paymentMethod: type === 'expense' ? paymentMethod : undefined,
        note: note.trim() || undefined,
        date: editing?.date ?? Date.now(),
      };
      if (editing) await transactionService.update(editing.id, payload);
      else await transactionService.add(payload);
      onSaved?.();
      onClose();
    } catch (e) {
      console.error('[modal] save failed', e);
      Alert.alert('Save failed', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmAddCustom = async () => {
    const name = newCatName.trim();
    if (!name) return;

    // Reuse an existing one if the name matches (case-insensitive)
    const exists = allCategories.find(
      (c) => c.label.toLowerCase() === name.toLowerCase(),
    );
    if (exists) {
      setCategory(exists.key);
      setAddingCustom(false);
      setNewCatName('');
      return;
    }

    try {
      const key = `custom_${Date.now()}`;
      await addCategory({
        key,
        label: name,
        type,
        icon: 'pricetag',
        color: '#A29BFE',
      });
      setCategory(key);
    } catch (e) {
      console.error('[modal] add category failed', e);
      Alert.alert('Could not add category', 'Please try again.');
    } finally {
      setNewCatName('');
      setAddingCustom(false);
    }
  };

  const cancelAddCustom = () => {
    setAddingCustom(false);
    setNewCatName('');
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.sheet, { backgroundColor: colors.backgroundElement }]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <View style={styles.headerRow}>
              <Text style={[styles.header, { color: colors.text }]}>
                {editing ? 'Edit Transaction' : 'New Transaction'}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Expense / Income toggle */}
            <View style={[styles.segment, { backgroundColor: colors.background }]}>
              {(['expense', 'income'] as const).map((t) => {
                const active = type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.segBtn, active && { backgroundColor: colors.backgroundElement }]}
                    onPress={() => {
                      setType(t);
                      setAddingCustom(false);
                      setNewCatName('');
                    }}
                  >
                    <Text
                      style={[
                        styles.segText,
                        { color: active ? colors.primary : colors.textSecondary },
                        active && styles.segTextActive,
                      ]}
                    >
                      {t === 'expense' ? 'Expense' : 'Income'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: Spacing.four }}
            >
              {/* Amount */}
              <Text style={[styles.label, { color: colors.text }]}>Amount</Text>
              <TextInput
                style={[styles.input, styles.amountInput, {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />

              {/* Title */}
              <Text style={[styles.label, { color: colors.text }]}>Title</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }]}
                placeholder="e.g. Coffee with team"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />

              {/* Category */}
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>Category</Text>
                <TouchableOpacity
                  onPress={() => setCategoriesOpen(true)}
                  hitSlop={8}
                  style={styles.manageBtn}
                >
                  <Ionicons name="settings-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.manageText, { color: colors.textSecondary }]}>
                    Manage
                  </Text>
                </TouchableOpacity>
              </View>

              {addingCustom && (
                <View style={[styles.addCatRow, {
                  backgroundColor: colors.background,
                  borderColor: colors.primary,
                }]}>
                  <TextInput
                    style={[styles.addCatInput, { color: colors.text }]}
                    placeholder="New category name"
                    placeholderTextColor={colors.textSecondary}
                    value={newCatName}
                    onChangeText={setNewCatName}
                    autoFocus
                    onSubmitEditing={confirmAddCustom}
                  />
                  <TouchableOpacity onPress={confirmAddCustom} hitSlop={8}>
                    <Ionicons name="checkmark" size={22} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={cancelAddCustom} hitSlop={8}>
                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.catGrid}>
                {allCategories.map((c) => {
                  const active = category === c.key;
                  return (
                    <TouchableOpacity
                      key={c.key}
                      style={[styles.catItem, {
                        borderColor: active ? c.color : colors.border,
                        backgroundColor: active ? c.color + '15' : colors.background,
                      }]}
                      onPress={() => setCategory(c.key)}
                    >
                      <Ionicons
                        name={c.icon as any}
                        size={20}
                        color={active ? c.color : colors.textSecondary}
                      />
                      <Text
                        style={[styles.catLabel, {
                          color: active ? c.color : colors.textSecondary,
                          fontWeight: active ? '700' : '500',
                        }]}
                        numberOfLines={1}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {!addingCustom && (
                  <TouchableOpacity
                    style={[styles.catItem, styles.addTile, {
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    }]}
                    onPress={() => setAddingCustom(true)}
                  >
                    <Ionicons name="add" size={20} color={colors.primary} />
                    <Text style={[styles.catLabel, { color: colors.primary, fontWeight: '700' }]}>
                      Add
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Payment method */}
              {type === 'expense' && (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Payment Method</Text>
                  <View style={styles.payRow}>
                    {PAYMENT_METHODS.map((p) => {
                      const active = paymentMethod === p.key;
                      return (
                        <TouchableOpacity
                          key={p.key}
                          style={[styles.payChip, {
                            backgroundColor: active ? colors.primary : colors.background,
                            borderColor: active ? colors.primary : colors.border,
                          }]}
                          onPress={() => setPaymentMethod(p.key)}
                        >
                          <Ionicons name={p.icon} size={14}
                            color={active ? '#FFFFFF' : colors.textSecondary} />
                          <Text style={[styles.payLabel,
                            { color: active ? '#FFFFFF' : colors.text }]}>
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Note */}
              <Text style={[styles.label, { color: colors.text }]}>Note (optional)</Text>
              <TextInput
                style={[styles.input, styles.noteInput, {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }]}
                placeholder="Add a note..."
                placeholderTextColor={colors.textSecondary}
                value={note}
                onChangeText={setNote}
                multiline
              />

              {/* Save */}
              <TouchableOpacity
                style={[styles.saveBtn, {
                  backgroundColor: colors.primary,
                  opacity: saving ? 0.6 : 1,
                }]}
                onPress={onSave}
                activeOpacity={0.85}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#FFFFFF" /> : (
                  <Text style={styles.saveText}>{editing ? 'Update' : 'Save'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Manage categories modal — sibling, not nested */}
      <CategoriesModal
        visible={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.four,
    paddingTop: 10,
    maxHeight: '92%',
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, marginBottom: 10 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.three,
  },
  header: { fontSize: 20, fontWeight: '800' },
  segment: {
    flexDirection: 'row', borderRadius: Radius.md, padding: 4,
    marginBottom: Spacing.three,
  },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.sm },
  segBtnActive: {},
  segText: { fontWeight: '600' },
  segTextActive: { fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: Spacing.two },
  labelRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.two },
  manageText: { fontSize: 12, fontWeight: '600' },
  input: {
    borderRadius: Radius.md, paddingHorizontal: Spacing.three,
    height: 52, fontSize: 15, borderWidth: 1,
  },
  amountInput: { fontSize: 22, fontWeight: '700' },
  noteInput: { height: 80, textAlignVertical: 'top', paddingTop: 14 },

  addCatRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, borderRadius: Radius.md,
    borderWidth: 1, height: 44, marginBottom: Spacing.two,
  },
  addCatInput: { flex: 1, fontSize: 14, height: '100%' },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  catItem: {
    width: '31.5%', alignItems: 'center', paddingVertical: 12,
    borderRadius: Radius.md, borderWidth: 1, gap: 4,
  },
  addTile: { borderStyle: 'dashed' },
  catLabel: { fontSize: 12 },

  payRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  payChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  payLabel: { fontSize: 13, fontWeight: '600' },
  saveBtn: {
    height: 56, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.four, ...Shadow.card,
  },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});