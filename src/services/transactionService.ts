import { transactions } from './storage';

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  title: string;
  category: string;
  paymentMethod?: string;
  note?: string;
  date: number;       // ms timestamp
  createdAt: number;  // ms timestamp
};

export const newId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const transactionService = {
  loadAll: (): Promise<Transaction[]> => transactions.list(),

  async add(data: Omit<Transaction, 'id' | 'createdAt'>) {
    const tx: Transaction = { ...data, id: newId(), createdAt: Date.now() };
    await transactions.insert(tx);
    return transactions.list();
  },

  async update(id: string, patch: Partial<Transaction>) {
    await transactions.update(id, patch);
    return transactions.list();
  },

  async remove(id: string) {
    await transactions.remove(id);
    return transactions.list();
  },

  async removeAll() {
    await transactions.removeAll();
    return [];
  },

  /**
   * Replace all stored transactions with the given list.
   * IDs and createdAt are regenerated so nothing collides.
   */
  async importTransactions(list: Omit<Transaction, 'id' | 'createdAt'>[]) {
    await transactions.removeAll();
    const now = Date.now();
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      const tx: Transaction = {
        ...t,
        id: newId(),
        createdAt: now + i,
      };
      await transactions.insert(tx);
    }
    return transactions.list();
  },

  // New: fast aggregates for BalanceCard / Statistics
  totals: () => transactions.totals(),

  byCategory: (type: 'income' | 'expense' = 'expense') =>
    transactions.byCategory(type),
};