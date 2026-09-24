import { Ionicons } from '@expo/vector-icons';

export type CategoryType = 'expense' | 'income';

export type Category = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  type: CategoryType;
  isDefault?: boolean;
};

/** Seed data — written to SQLite once, on first launch. */
export const DEFAULT_CATEGORIES: Category[] = [
  { key: 'food',          label: 'Food',      icon: 'fast-food',           color: '#FF7675', type: 'expense' },
  { key: 'transport',     label: 'Transport', icon: 'car',                 color: '#74B9FF', type: 'expense' },
  { key: 'shopping',      label: 'Shopping',  icon: 'bag-handle',          color: '#FDCB6E', type: 'expense' },
  { key: 'bills',         label: 'Bills',     icon: 'receipt',             color: '#A29BFE', type: 'expense' },
  { key: 'entertainment', label: 'Fun',       icon: 'game-controller',     color: '#FD79A8', type: 'expense' },
  { key: 'health',        label: 'Health',    icon: 'medkit',              color: '#55EFC4', type: 'expense' },
  { key: 'education',     label: 'Education', icon: 'book',                color: '#00CEC9', type: 'expense' },
  { key: 'rent',          label: 'Rent',      icon: 'home',                color: '#E17055', type: 'expense' },
  { key: 'other',         label: 'Other',     icon: 'ellipsis-horizontal', color: '#B2BEC3', type: 'expense' },

  { key: 'salary',        label: 'Salary',    icon: 'wallet',              color: '#00B894', type: 'income' },
  { key: 'freelance',     label: 'Freelance', icon: 'laptop',              color: '#00B894', type: 'income' },
  { key: 'business',      label: 'Business',  icon: 'briefcase',           color: '#00B894', type: 'income' },
  { key: 'interest',      label: 'Interest',  icon: 'trending-up',         color: '#00B894', type: 'income' },
  { key: 'cashback',      label: 'Cashback',  icon: 'gift',                color: '#00B894', type: 'income' },
  { key: 'gifts',         label: 'Gifts',     icon: 'gift-outline',        color: '#00B894', type: 'income' },
];

/** Turn "custom_my_pets" → "My Pets". */
export const humanizeKey = (key: string): string =>
  key
    .replace(/^custom[_-]/i, '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown';

/** Pure fallback — used only when neither DB nor defaults know the key. */
export const fallbackCategory = (key: string): Category => ({
  key,
  label: humanizeKey(key),
  icon: 'pricetag',
  color: '#A29BFE',
  type: 'expense',
});