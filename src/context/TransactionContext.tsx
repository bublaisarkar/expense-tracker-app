import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  transactionService,
  Transaction,
} from '../services/transactionService';
import { walletService, Wallet } from '../services/walletService';

type Ctx = {
  transactions: Transaction[];
  wallet: Wallet;
  balance: number;
  loading: boolean;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveWallet: (w: Wallet) => Promise<void>;
  resetAll: () => Promise<void>;
  reload: () => Promise<void>;
};

const TransactionContext = createContext<Ctx>(null as any);
export const useTransactions = () => useContext(TransactionContext);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallet, setWallet] = useState<Wallet>({ initialBalance: 0, currency: '₹' });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [list, w] = await Promise.all([
      transactionService.loadAll(),
      walletService.load(),
    ]);
    setTransactions(list);
    setWallet(w);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const list = await transactionService.add(data);
    setTransactions(list);
  };

  const updateTransaction = async (id: string, patch: Partial<Transaction>) => {
    const list = await transactionService.update(id, patch);
    setTransactions(list);
  };

  const deleteTransaction = async (id: string) => {
    const list = await transactionService.remove(id);
    setTransactions(list);
  };

  const saveWallet = async (w: Wallet) => {
    await walletService.save(w);
    setWallet(w);
  };

  const resetAll = async () => {
    const list = await transactionService.removeAll();
    setTransactions(list);
  };

  const balance =
    wallet.initialBalance +
    transactions.reduce(
      (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
      0
    );

  return (
    <TransactionContext.Provider
      value={{
        transactions, wallet, balance, loading,
        addTransaction, updateTransaction, deleteTransaction,
        saveWallet, resetAll, reload,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}