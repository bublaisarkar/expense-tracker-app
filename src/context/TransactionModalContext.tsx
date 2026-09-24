import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { Transaction } from '@/services/transactionService';

type Ctx = {
  visible: boolean;
  editing: Transaction | null;
  version: number;              // bumps on every save/delete
  openAdd: () => void;
  openEdit: (tx: Transaction) => void;
  close: () => void;
  notifyChanged: () => void;
};

const TransactionModalContext = createContext<Ctx | null>(null);

export function TransactionModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [version, setVersion] = useState(0);

  const openAdd = useCallback(() => {
    setEditing(null);
    setVisible(true);
  }, []);

  const openEdit = useCallback((tx: Transaction) => {
    setEditing(tx);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setEditing(null);
  }, []);

  const notifyChanged = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const value = useMemo(
    () => ({ visible, editing, version, openAdd, openEdit, close, notifyChanged }),
    [visible, editing, version, openAdd, openEdit, close, notifyChanged]
  );

  return (
    <TransactionModalContext.Provider value={value}>
      {children}
    </TransactionModalContext.Provider>
  );
}

export function useTransactionModal() {
  const ctx = useContext(TransactionModalContext);
  if (!ctx) {
    throw new Error('useTransactionModal must be used inside TransactionModalProvider');
  }
  return ctx;
}