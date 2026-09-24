import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, useTheme } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { pinService } from '../services/pinService';
import PinPad from './PinPad';

export default function PinLockOverlay({ onUnlock }: { onUnlock: () => void }) {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [bioLabel, setBioLabel] = useState('biometrics');

  const tryBiometric = async () => {
    if (!settings.biometricEnabled) return;

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) return;

    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Expense Tracker',
      fallbackLabel: 'Use PIN',
    });
    if (res.success) onUnlock();
  };

  // Resolve a friendly name for the biometric sensor (Face ID vs Fingerprint)
  useEffect(() => {
    (async () => {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const T = LocalAuthentication.AuthenticationType;
      if (types.includes(T.FACIAL_RECOGNITION)) setBioLabel('Face ID');
      else if (types.includes(T.FINGERPRINT)) setBioLabel('fingerprint');
      else if (types.includes(T.IRIS)) setBioLabel('iris');
    })();
  }, []);

  // Auto-trigger biometric prompt once on mount (if enabled)
  useEffect(() => {
    tryBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verify = async (entered: string) => {
    const ok = await pinService.verify(entered);
    if (ok) {
      onUnlock();
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setPin('');
    }
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <View style={[styles.logo, { backgroundColor: colors.backgroundSelected }]}>
        <Ionicons name="lock-closed" size={30} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>Enter PIN</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Unlock to continue
      </Text>

      <PinPad value={pin} onChange={setPin} onComplete={verify} />

      {settings.biometricEnabled && (
        <TouchableOpacity style={styles.bio} onPress={tryBiometric}>
          <Ionicons name="finger-print" size={20} color={colors.primary} />
          <Text style={[styles.bioText, { color: colors.primary }]}>
            Use {bioLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    // Fill the entire screen and sit above everything else
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999, // Android stacking
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: Spacing.three,
  },
  sub: {
    fontSize: 14,
    marginTop: 4,
  },
  bio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.five,
  },
  bioText: {
    fontWeight: '700',
  },
});