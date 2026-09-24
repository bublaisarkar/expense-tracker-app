import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, useTheme } from '../constants/theme';
import { useCategories } from '../context/CategoriesContext';
import type { Category, CategoryType } from '../constants/categories';

export default function CategoriesModal({
  visible, onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();

  const [label, setLabel] = useState('');
  const [type, setType] = useState<CategoryType>('expense');

  // Edit state
  const [editing, setEditing] = useState<Category | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const add = async () => {
    const trimmed = label.trim();
    if (!trimmed) return Alert.alert('Enter a name');

    const base = trimmed.toLowerCase().replace(/\s+/g, '-');
    const key = `custom_${base}`;
    // Check across BOTH types — same name + same type is the real collision
    const clash = categories.find(
      (c) => c.key === key && c.type === type,
    );
    if (clash) return Alert.alert('Category already exists');

    try {
      await addCategory({
        key, label: trimmed, icon: 'pricetag', color: '#6C5CE7', type,
      });
      setLabel('');
    } catch (e) {
      Alert.alert('Failed to add category');
    }
  };

  const startEdit = (cat: Category) => {
    setEditing(cat);
    setEditLabel(cat.label);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditLabel('');
  };

  const saveEdit = async () => {
    if (!editing) return;
    const trimmed = editLabel.trim();
    if (!trimmed) return Alert.alert('Enter a name');

    try {
      await updateCategory(editing.key, { label: trimmed });
      cancelEdit();
    } catch {
      Alert.alert('Failed to update category');
    }
  };

  const confirmDelete = (cat: Category) => {
    // Guard: don't allow deleting the last category of its type
    const sameType = categories.filter((c) => c.type === cat.type);
    if (sameType.length <= 1) {
      Alert.alert(
        "Can't delete",
        `You need at least one ${cat.type} category.`,
      );
      return;
    }

    Alert.alert(
      'Delete category',
      `Delete "${cat.label}"? Transactions using it will show a generic label until reassigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(cat.key);
            } catch {
              Alert.alert('Failed to delete category');
            }
          },
        },
      ],
    );
  };

  const expenses = categories.filter((c) => c.type === 'expense');
  const incomes  = categories.filter((c) => c.type === 'income');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.row}>
            <Text style={[styles.title, { color: colors.text }]}>Categories</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ marginTop: Spacing.three }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.label, { color: colors.text }]}>Add new</Text>
            <View style={styles.segment}>
              {(['expense', 'income'] as const).map((t) => {
                const active = type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.seg,
                      { backgroundColor: colors.background },
                      active && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setType(t)}
                  >
                    <Text
                      style={{
                        color: active ? '#fff' : colors.text,
                        fontWeight: '700',
                      }}
                    >
                      {t === 'expense' ? 'Expense' : 'Income'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }]}
                placeholder="Category name"
                placeholderTextColor={colors.textSecondary}
                value={label}
                onChangeText={setLabel}
                onSubmitEditing={add}
              />
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={add}
              >
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <Section title="Expense" items={expenses} colors={colors}
              onEdit={startEdit} onDelete={confirmDelete} />

            <Section title="Income" items={incomes} colors={colors}
              onEdit={startEdit} onDelete={confirmDelete} />

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>

        {/* Edit dialog — plain overlay, NOT a nested Modal */}
        {!!editing && (
          <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.editCard, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.title, { color: colors.text, marginBottom: Spacing.three }]}>
                Edit category
              </Text>
              <TextInput
                style={[styles.input, {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }]}
                value={editLabel}
                onChangeText={setEditLabel}
                placeholder="Category name"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                onSubmitEditing={saveEdit}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editBtn, { backgroundColor: colors.background }]}
                  onPress={cancelEdit}
                >
                  <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editBtn, { backgroundColor: colors.primary }]}
                  onPress={saveEdit}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

function Section({
  title, items, colors, onEdit, onDelete,
}: {
  title: string;
  items: Category[];
  colors: any;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  if (items.length === 0) return null;
  return (
    <>
      <Text style={[styles.label, { color: colors.text, marginTop: Spacing.four }]}>
        {title}
      </Text>
      {items.map((c) => (
        <View key={c.key} style={[styles.item, { borderBottomColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: c.color + '22' }]}>
            <Ionicons name={c.icon} size={18} color={c.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{c.label}</Text>
            {c.isDefault && (
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Default</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => onEdit(c)} style={styles.actionBtn}>
            <Ionicons name="pencil-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(c)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.four, maxHeight: '85%',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  segment: { flexDirection: 'row', gap: 8, marginBottom: Spacing.two },
  seg: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: Radius.md,
  },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, height: 52, paddingHorizontal: Spacing.three,
    borderRadius: Radius.md, borderWidth: 1,
  },
  addBtn: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  icon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  actionBtn: { padding: 6 },
  overlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
},
  editCard: {
    marginHorizontal: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.xl,
    alignSelf: 'stretch',
  },
  editActions: {
    flexDirection: 'row', gap: 8, marginTop: Spacing.three,
  },
  editBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
});