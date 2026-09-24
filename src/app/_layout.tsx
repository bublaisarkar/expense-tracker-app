import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import {
  TransactionModalProvider,
  useTransactionModal,
} from '@/context/TransactionModalContext';
import { CategoriesProvider } from '@/context/CategoriesContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import TransactionModal from '@/components/TransactionModal';
import PinLockOverlay from '@/components/PinLockOverlay';
import { pinService } from '@/services/pinService';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <CategoriesProvider>
            <TransactionModalProvider>
              <StatusBar style="dark" />
              <AppShell />
              <ModalHost />
            </TransactionModalProvider>
          </CategoriesProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const { settings, updateSettings } = useSettings();
  const [unlocked, setUnlocked] = useState(!settings.pinEnabled);

  // On boot (and whenever pinEnabled changes), verify the lock state is sane.
  //
  // Safety check: if pinEnabled === true but no PIN exists in the store,
  // the app has locked itself with no key — auto-repair by disabling the lock.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!settings.pinEnabled) {
        if (!cancelled) setUnlocked(true);
        return;
      }

      // pinEnabled is on — confirm a PIN actually exists
      const stored = await pinService.getPin();

      if (cancelled) return;

      if (!stored) {
        // Use console.log (not .warn) so LogBox doesn't pop a yellow banner.
        console.log('[lock] auto-repaired: pinEnabled was true but no PIN existed');
        try {
          await pinService.clearPin();
        } catch {}
        updateSettings({ pinEnabled: false, biometricEnabled: false });
        setUnlocked(true);
      } else {
        setUnlocked(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [settings.pinEnabled, updateSettings]);

  // Locked → render only the overlay
  if (settings.pinEnabled && !unlocked) {
    return <PinLockOverlay onUnlock={() => setUnlocked(true)} />;
  }

  // Unlocked → render the app
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

function ModalHost() {
  const { visible, editing, close, notifyChanged } = useTransactionModal();
  return (
    <TransactionModal
      visible={visible}
      editing={editing}
      onClose={close}
      onSaved={notifyChanged}
    />
  );
}