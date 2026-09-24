import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ---------- Types ----------
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  title: string;
  category: string;
  paymentMethod?: string;
  note?: string;
  date: number;       // ms timestamp
  createdAt: number;  // ms timestamp
}

// ---------- Keys (only non-DB data) ----------
export const STORAGE_KEYS = {
  wallet: '@et:wallet',
  settings: '@et:settings',
  customCategories: '@et:customCategories',
} as const;

// ---------- DB singleton ----------
const DB_NAME = 'expenses.db';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = initDb();
  return dbPromise;
}

async function initDb(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  if (Platform.OS !== 'web') {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  }

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS kv (
      key   TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id             TEXT PRIMARY KEY NOT NULL,
      type           TEXT NOT NULL CHECK (type IN ('income','expense')),
      amount         REAL NOT NULL,
      title          TEXT NOT NULL,
      category       TEXT NOT NULL,
      payment_method TEXT,
      note           TEXT,
      date           INTEGER NOT NULL,
      created_at     INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tx_date     ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_tx_type     ON transactions(type);
  `);

  await migrateFromAsyncStorage(db);
  return db;
}

// ---------- One-time migration from AsyncStorage ----------
async function migrateFromAsyncStorage(db: SQLite.SQLiteDatabase): Promise<void> {
  const flag = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM kv WHERE key = '@et:migrated:v1'`
  );
  if (flag?.value === 'true') return;

  try {
    const rawTx = await AsyncStorage.getItem('@et:transactions');
    if (rawTx) {
      const list = JSON.parse(rawTx) as Transaction[];
      if (Array.isArray(list) && list.length > 0) {
        await db.withTransactionAsync(async () => {
          for (const t of list) {
            await db.runAsync(
              `INSERT OR IGNORE INTO transactions
                 (id, type, amount, title, category,
                  payment_method, note, date, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                t.id,
                t.type,
                t.amount,
                t.title,
                t.category,
                t.paymentMethod ?? null,
                t.note ?? null,
                t.date,
                t.createdAt,
              ]
            );
          }
        });
      }
      await AsyncStorage.removeItem('@et:transactions');
    }

    for (const oldKey of [
      '@et:wallet',
      '@et:settings',
      '@et:customCategories',
    ]) {
      const raw = await AsyncStorage.getItem(oldKey);
      if (raw !== null) {
        await db.runAsync(
          `INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)`,
          [oldKey, raw]
        );
        await AsyncStorage.removeItem(oldKey);
      }
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO kv (key, value) VALUES ('@et:migrated:v1', 'true')`
    );
  } catch (e) {
    console.warn('[storage] migration failed', e);
  }
}

// ---------- KV API ----------
export const storage = {
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      const db = await getDb();
      const row = await db.getFirstAsync<{ value: string }>(
        `SELECT value FROM kv WHERE key = ?`,
        [key]
      );
      return row ? (JSON.parse(row.value) as T) : fallback;
    } catch (e) {
      console.warn('[storage] get failed', key, e);
      return fallback;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const db = await getDb();
      await db.runAsync(
        `INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)`,
        [key, JSON.stringify(value)]
      );
    } catch (e) {
      console.warn('[storage] set failed', key, e);
    }
  },

  async remove(key: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM kv WHERE key = ?`, [key]);
  },

  async clearAll(): Promise<void> {
    const db = await getDb();
    await db.execAsync(`DELETE FROM kv; DELETE FROM transactions;`);
  },
};

// ---------- Row mapping ----------
type TxRow = {
  id: string;
  type: TransactionType;
  amount: number;
  title: string;
  category: string;
  payment_method: string | null;
  note: string | null;
  date: number;
  created_at: number;
};

const rowToTx = (r: TxRow): Transaction => ({
  id: r.id,
  type: r.type,
  amount: r.amount,
  title: r.title,
  category: r.category,
  paymentMethod: r.payment_method ?? undefined,
  note: r.note ?? undefined,
  date: r.date,
  createdAt: r.created_at,
});

// ---------- Transactions API ----------
export const transactions = {
  async list(): Promise<Transaction[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<TxRow>(
      `SELECT * FROM transactions ORDER BY date DESC, created_at DESC`
    );
    return rows.map(rowToTx);
  },

  async byId(id: string): Promise<Transaction | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<TxRow>(
      `SELECT * FROM transactions WHERE id = ?`,
      [id]
    );
    return row ? rowToTx(row) : null;
  },

  async insert(tx: Transaction): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO transactions
         (id, type, amount, title, category,
          payment_method, note, date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tx.id,
        tx.type,
        tx.amount,
        tx.title,
        tx.category,
        tx.paymentMethod ?? null,
        tx.note ?? null,
        tx.date,
        tx.createdAt,
      ]
    );
  },

  async update(
    id: string,
    patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>
  ): Promise<void> {
    const db = await getDb();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (patch.type !== undefined)          { fields.push('type = ?');           values.push(patch.type); }
    if (patch.amount !== undefined)        { fields.push('amount = ?');         values.push(patch.amount); }
    if (patch.title !== undefined)         { fields.push('title = ?');          values.push(patch.title); }
    if (patch.category !== undefined)      { fields.push('category = ?');       values.push(patch.category); }
    if (patch.paymentMethod !== undefined) { fields.push('payment_method = ?'); values.push(patch.paymentMethod ?? null); }
    if (patch.note !== undefined)          { fields.push('note = ?');           values.push(patch.note ?? null); }
    if (patch.date !== undefined)          { fields.push('date = ?');           values.push(patch.date); }

    if (fields.length === 0) return;
    values.push(id);

    await db.runAsync(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [id]);
  },

  async removeAll(): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM transactions`);
  },

  async totals(): Promise<{ income: number; expense: number; balance: number }> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ income: number; expense: number }>(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount END), 0) AS income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount END), 0) AS expense
       FROM transactions`
    );
    const income = row?.income ?? 0;
    const expense = row?.expense ?? 0;
    return { income, expense, balance: income - expense };
  },

  async byCategory(
    type: TransactionType = 'expense'
  ): Promise<{ category: string; total: number }[]> {
    const db = await getDb();
    return db.getAllAsync<{ category: string; total: number }>(
      `SELECT category, SUM(amount) AS total
       FROM transactions
       WHERE type = ?
       GROUP BY category
       ORDER BY total DESC`,
      [type]
    );
  },
};