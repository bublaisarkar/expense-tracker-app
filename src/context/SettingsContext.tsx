import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { settingsService, type Settings } from '../services/settingsService';
import { formatCurrency } from '../utils/format';

type Ctx = {
  settings: Settings;
  loading: boolean;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  /** Format an amount using the user's chosen currency. */
  formatMoney: (amount: number) => string;
};

const SettingsContext = createContext<Ctx>(null as any);
export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await settingsService.load();
        if (alive) setSettings(s);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      if (!settings) return;
      const next: Settings = { ...settings, ...patch };
      await settingsService.save(next);
      setSettings(next);
    },
    [settings],
  );

  const formatMoney = useCallback(
    (amount: number) => formatCurrency(amount, settings?.currency ?? '₹'),
    [settings?.currency],
  );

  const value = useMemo<Ctx>(
    () => ({
      settings: settings as Settings,
      loading,
      updateSettings,
      formatMoney,
    }),
    [settings, loading, updateSettings, formatMoney],
  );

  // Keep your existing gate — nothing renders until settings load.
  if (!settings) return null;

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}