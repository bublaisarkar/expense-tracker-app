import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, useTheme } from '@/constants/theme';

type Props = {
  visible: boolean;
  initialValue: number;
  onClose: () => void;
  onSave: (value: number) => void | Promise<void>;
};

export default function BudgetEditModal({ visible, initialValue, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) setValue(initialValue ? String(initialValue) : '');
  }, [visible, initialValue]);

  const handleSave = async () => {
    const num = Number(value);
    if (!value || isNaN(num) || num < 0) {
      Alert.alert('Invalid amount', 'Enter a valid budget amount.');
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
        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text }]}>Monthly Budget</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Set how much you want to spend each month.
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
            placeholder="20000"
            placeholderTextColor={colors.textSecondary}
            autoFocus
            onSubmitEditing={handleSave}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.background }]}
              onPress={onClose}
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
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
  backdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four },
  card: { padding: Spacing.four, borderRadius: Radius.xl },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  title: { fontSize: 18, fontWeight: '800' },
  hint: { fontSize: 13, marginBottom: Spacing.three },
  input: {
    height: 52,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  actions: { flexDirection: 'row', gap: 8, marginTop: Spacing.three },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});