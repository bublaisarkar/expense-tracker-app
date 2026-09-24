import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Radius, Shadow, Spacing, useTheme } from '../../constants/theme';
import { transactionService } from '../../services/transactionService';
import { exportService } from '../../services/exportService';
import { pinService } from '../../services/pinService';
import { biometricService } from '../../services/biometricService';
import { useCategories } from '../../context/CategoriesContext';
import { useSettings } from '../../context/SettingsContext';
import CategoriesModal from '../../components/CategoriesModal';
import BudgetEditModal from '../../components/BudgetEditModal';

const APP_VERSION = '1.0.0';

export default function Profile() {
  const { colors } = useTheme();
  const categoriesCtx = useCategories() as any;
  const { getCategory } = categoriesCtx;
  const { settings, updateSettings, formatMoney } = useSettings();

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioLabel, setBioLabel] = useState('Biometrics');

  // On mount: check biometric availability + label
  useEffect(() => {
    (async () => {
      const ok = await biometricService.isAvailable();
      const label = await biometricService.getLabel();
      setBioAvailable(ok);
      setBioLabel(label);
    })();
  }, []);

  const categoriesList: Array<{ key: string; label: string }> =
    categoriesCtx.categories ||
    categoriesCtx.list ||
    categoriesCtx.all ||
    [];

  const resolveCategoryKey = (labelOrKey: string): string | null => {
    const needle = String(labelOrKey || '').trim();
    if (!needle) return null;
    const byKey = categoriesList.find((c) => c.key === needle);
    if (byKey) return byKey.key;
    const lower = needle.toLowerCase();
    const byLabel = categoriesList.find(
      (c) => String(c.label).toLowerCase() === lower,
    );
    return byLabel ? byLabel.key : null;
  };

  // --- Share CSV ---
  const handleShareCsv = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const list = await transactionService.loadAll();
      if (list.length === 0) {
        Alert.alert('Nothing to share', 'Add some transactions first.');
        return;
      }
      await exportService.shareCsv(list, getCategory);
    } catch (e) {
      console.error('[share csv]', e);
      Alert.alert('Share failed', 'Please try again.');
    } finally {
      setSharing(false);
    }
  };

  // --- Backup ---
  const handleBackup = async () => {
    if (backupBusy) return;
    setBackupBusy(true);
    try {
      const list = await transactionService.loadAll();
      if (list.length === 0) {
        Alert.alert('Nothing to backup', 'Add some transactions first.');
        return;
      }
      await exportService.backupToFile(list, getCategory);
    } catch (e) {
      console.error('[backup]', e);
      Alert.alert('Backup failed', 'Please try again.');
    } finally {
      setBackupBusy(false);
    }
  };

  // --- Restore ---
  const handleRestore = async () => {
    if (backupBusy) return;
    try {
      const parsed = await exportService.pickAndParseBackup(resolveCategoryKey);
      if (parsed.length === 0) {
        Alert.alert(
          'Nothing to restore',
          'The selected file has no valid transactions.',
        );
        return;
      }
      const current = await transactionService.loadAll();
      Alert.alert(
        'Restore backup',
        `This will replace your current ${current.length} transaction(s) with ${parsed.length} from the file. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              setBackupBusy(true);
              try {
                await transactionService.importTransactions(parsed);
                Alert.alert(
                  'Restored',
                  `${parsed.length} transaction(s) imported successfully.`,
                );
              } catch (err) {
                console.error('[restore]', err);
                Alert.alert('Restore failed', 'Please try again.');
              } finally {
                setBackupBusy(false);
              }
            },
          },
        ],
      );
    } catch (e) {
      console.error('[restore]', e);
      Alert.alert('Restore failed', 'Please try again.');
    }
  };

  const handleBackupRestoreMenu = () => {
    Alert.alert('Backup & Restore', 'Choose an option', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Backup to CSV', onPress: handleBackup },
      { text: 'Restore from CSV', onPress: handleRestore },
    ]);
  };

  // --- PIN lock ---
  const handleTogglePin = async (next: boolean) => {
    if (next) {
      setPinModalOpen(true);
    } else {
      Alert.alert(
        'Disable PIN lock',
        'You will no longer need a PIN to open the app. Biometric unlock will also be disabled. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                await pinService.clearPin();
                updateSettings({ pinEnabled: false, biometricEnabled: false });
              } catch (e) {
                console.error('[pin clear]', e);
                Alert.alert('Failed', 'Could not disable PIN lock.');
              }
            },
          },
        ],
      );
    }
  };

  const handleSavePin = async (pin: string) => {
  try {
    await pinService.setPin(pin);

    // Verify the PIN was actually persisted
    const check = await pinService.getPin();

    if (check !== pin) {
      throw new Error('PIN was not persisted');
    }

    updateSettings({ pinEnabled: true });
    setPinModalOpen(false);
    Alert.alert('PIN enabled', 'Your app is now locked with a PIN.');
  } catch (e) {
    console.error('[pin set]', e);
    // Roll back — do NOT enable the lock if the PIN didn't save
    await pinService.clearPin();
    updateSettings({ pinEnabled: false });
    Alert.alert(
      'Failed',
      'Could not save PIN. Please try again.'
    );
  }
};

  // --- Biometric lock ---
  const handleToggleBiometric = async (next: boolean) => {
    if (!next) {
      updateSettings({ biometricEnabled: false });
      return;
    }

    // Turning ON — require PIN first, then verify biometrics work.
    if (!settings.pinEnabled) {
      Alert.alert(
        'PIN required',
        'Enable PIN lock first. Biometric unlock uses your PIN as a fallback.',
      );
      return;
    }

    const available = await biometricService.isAvailable();
    if (!available) {
      Alert.alert(
        'Not available',
        `No enrolled ${bioLabel} found on this device. Set it up in your phone settings first.`,
      );
      return;
    }

    // Prompt once to make sure it works before we enable the toggle.
    const ok = await biometricService.authenticate(
      `Confirm ${bioLabel} to enable unlock`,
    );
    if (!ok) {
      Alert.alert('Cancelled', `${bioLabel} was not verified.`);
      return;
    }

    updateSettings({ biometricEnabled: true });
  };

  const userName = settings.userName;
  const currency = settings.currency;
  const budget = settings.monthlyBudget;
  const initial = userName.charAt(0).toUpperCase();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        </View>

        <View style={styles.avatarBlock}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{userName}</Text>
          <TouchableOpacity onPress={() => setNameOpen(true)} hitSlop={8}>
            <Text
              style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}
            >
              Edit name
            </Text>
          </TouchableOpacity>
        </View>

        {/* General */}
        <Section title="General" colors={colors}>
          <Row
            colors={colors}
            icon="person-outline"
            label="Name"
            value={userName}
            onPress={() => setNameOpen(true)}
          />
          <Row
            colors={colors}
            icon="cash-outline"
            label="Currency"
            value={currency}
            onPress={() => setCurrencyOpen(true)}
          />
          <Row
            colors={colors}
            icon="pricetags-outline"
            label="Categories"
            value="Manage"
            onPress={() => setCategoriesOpen(true)}
          />
          <Row
            colors={colors}
            icon="wallet-outline"
            label="Monthly budget"
            value={formatMoney(budget)}
            onPress={() => setBudgetOpen(true)}
            last
          />
        </Section>

        {/* Security */}
        <Section title="Security" colors={colors}>
          <SwitchRow
            colors={colors}
            icon="keypad-outline"
            label="PIN lock"
            value={!!settings.pinEnabled}
            onValueChange={handleTogglePin}
          />
          <SwitchRow
            colors={colors}
            icon="finger-print-outline"
            label={`Unlock with ${bioLabel}`}
            value={!!settings.biometricEnabled}
            onValueChange={handleToggleBiometric}
            last
          />
        </Section>

        {/* Data */}
        <Section title="Data" colors={colors}>
          <Row
            colors={colors}
            icon="share-outline"
            label="Share CSV"
            value={sharing ? 'Preparing…' : 'CSV'}
            onPress={handleShareCsv}
            disabled={sharing}
            trailing={
              sharing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : undefined
            }
          />
          <Row
            colors={colors}
            icon="cloud-upload-outline"
            label="Backup & Restore"
            value={backupBusy ? 'Processing…' : 'CSV'}
            onPress={handleBackupRestoreMenu}
            disabled={backupBusy}
            trailing={
              backupBusy ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : undefined
            }
            last
          />
        </Section>

        {/* About */}
        <Section title="About" colors={colors}>
          <Row
            colors={colors}
            icon="information-circle-outline"
            label="Version"
            value={APP_VERSION}
            disabled
            last
          />
        </Section>

        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          Made with ❤️
        </Text>
      </ScrollView>

      {/* Modals */}
      <CategoriesModal
        visible={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
      />

      <BudgetEditModal
        visible={budgetOpen}
        initialValue={budget}
        onClose={() => setBudgetOpen(false)}
        onSave={(v) => updateSettings({ monthlyBudget: v })}
      />

      <TextInputModal
        visible={nameOpen}
        title="Your name"
        initialValue={userName}
        onClose={() => setNameOpen(false)}
        onSave={(v) => updateSettings({ userName: v })}
        placeholder="Enter your name"
      />

      <TextInputModal
        visible={currencyOpen}
        title="Currency symbol"
        initialValue={currency}
        onClose={() => setCurrencyOpen(false)}
        onSave={(v) => updateSettings({ currency: v })}
        placeholder="₹"
        maxLength={3}
      />

      <PinSetupModal
        visible={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSave={handleSavePin}
      />
    </SafeAreaView>
  );
}

/* ---------- Reusable bits ---------- */

function Section({
  title,
  colors,
  children,
}: {
  title: string;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {title}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
        {children}
      </View>
    </View>
  );
}

function Row({
  colors,
  icon,
  label,
  value,
  onPress,
  disabled,
  last,
  trailing,
}: {
  colors: any;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  last?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
      style={[
        styles.row,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      {value ? (
        <Text
          style={[styles.rowValue, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}
      {trailing ? (
        trailing
      ) : onPress && !disabled ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      ) : null}
    </TouchableOpacity>
  );
}

function SwitchRow({
  colors,
  icon,
  label,
  value,
  onValueChange,
  last,
}: {
  colors: any;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor="#fff"
      />
    </View>
  );
}

function TextInputModal({
  visible,
  title,
  initialValue,
  onClose,
  onSave,
  placeholder,
  maxLength,
}: {
  visible: boolean;
  title: string;
  initialValue: string;
  onClose: () => void;
  onSave: (v: string) => void | Promise<void>;
  placeholder?: string;
  maxLength?: number;
}) {
  const { colors } = useTheme();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const submit = async () => {
    const v = value.trim();
    if (!v) {
      Alert.alert('Enter a value');
      return;
    }
    await onSave(v);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      >
        <View
          style={[styles.modalCard, { backgroundColor: colors.backgroundElement }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            autoFocus
            maxLength={maxLength}
            onSubmitEditing={submit}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.background }]}
              onPress={onClose}
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                Cancel
              </Text>
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

function PinSetupModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (pin: string) => void | Promise<void>;
}) {
  const { colors } = useTheme();
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [first, setFirst] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setStep('enter');
      setFirst('');
      setValue('');
      setError('');
    }
  }, [visible]);

  const submit = async () => {
    const v = value.trim();
    if (!/^\d{4,6}$/.test(v)) {
      setError('PIN must be 4–6 digits');
      return;
    }
    if (step === 'enter') {
      setFirst(v);
      setValue('');
      setStep('confirm');
      setError('');
      return;
    }
    if (v !== first) {
      setError('PINs do not match. Try again.');
      setStep('enter');
      setFirst('');
      setValue('');
      return;
    }
    await onSave(v);
  };

  const title = step === 'enter' ? 'Create PIN' : 'Confirm PIN';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      >
        <View
          style={[styles.modalCard, { backgroundColor: colors.backgroundElement }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
            {step === 'enter'
              ? 'Choose a 4–6 digit PIN to lock the app.'
              : 'Re-enter your PIN to confirm.'}
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.background,
                borderColor: error ? '#e5484d' : colors.border,
                letterSpacing: 8,
                textAlign: 'center',
                fontSize: 20,
              },
            ]}
            value={value}
            onChangeText={(t) => {
              setValue(t.replace(/\D/g, ''));
              if (error) setError('');
            }}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            autoFocus
            onSubmitEditing={submit}
            placeholder="••••"
            placeholderTextColor={colors.textSecondary}
          />

          {error ? (
            <Text style={{ color: '#e5484d', marginTop: 8, fontSize: 13 }}>
              {error}
            </Text>
          ) : null}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.background }]}
              onPress={onClose}
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={submit}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {step === 'enter' ? 'Next' : 'Save'}
              </Text>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  title: { fontSize: 26, fontWeight: '800' },

  avatarBlock: { alignItems: 'center', paddingVertical: Spacing.four },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
    ...Shadow.card,
  },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', marginBottom: 4 },

  section: { marginTop: Spacing.four, paddingHorizontal: Spacing.four },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
    marginLeft: 4,
  },
  card: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    ...Shadow.soft,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  rowValue: { fontSize: 13, maxWidth: 140 },

  footer: { textAlign: 'center', fontSize: 12, marginTop: Spacing.six },

  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  modalCard: { padding: Spacing.four, borderRadius: Radius.xl },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  input: {
    height: 52,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: Spacing.three },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});