import { storage, STORAGE_KEYS } from './storage';

export type Settings = {
  currency: string;
  pinEnabled: boolean;
  biometricEnabled: boolean;
  monthlyBudget: number;
  userName: string;
};

const DEFAULT: Settings = {
  currency: '₹',
  pinEnabled: false,
  biometricEnabled: false,
  monthlyBudget: 20000,
  userName: 'User',
};

export const settingsService = {
  load: () => storage.get<Settings>(STORAGE_KEYS.settings, DEFAULT),
  save: (s: Settings) => storage.set(STORAGE_KEYS.settings, s),
};