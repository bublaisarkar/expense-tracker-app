import { storage, STORAGE_KEYS } from './storage';

export type Wallet = {
  initialBalance: number;
};

const DEFAULT: Wallet = { initialBalance: 0 };

export const walletService = {
  load: () => storage.get<Wallet>(STORAGE_KEYS.wallet, DEFAULT),
  save: (w: Wallet) => storage.set(STORAGE_KEYS.wallet, w),
};