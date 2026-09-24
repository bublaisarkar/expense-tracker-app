import * as SQLite from 'expo-sqlite';
import {
  DEFAULT_CATEGORIES,
  type Category,
  type CategoryType,
} from '../constants/categories';

const DB_NAME = 'app.db'; // ← match your existing DB name

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
const getDb = () => (dbPromise ??= SQLite.openDatabaseAsync(DB_NAME));

type Row = {
  key: string;
  label: string;
  icon: string;
  color: string;
  type: CategoryType;
  is_default: number;
  sort_order: number;
};

const rowToCategory = (r: Row): Category => ({
  key: r.key,
  label: r.label,
  icon: r.icon as Category['icon'],
  color: r.color,
  type: r.type,
  isDefault: r.is_default === 1,
});

/** Create table + seed defaults the very first time. */
export async function ensureCategoryTable(): Promise<void> {
  const db = await getDb();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      key        TEXT PRIMARY KEY NOT NULL,
      label      TEXT NOT NULL,
      icon       TEXT NOT NULL,
      color      TEXT NOT NULL,
      type       TEXT NOT NULL CHECK (type IN ('expense','income')),
      is_default INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  const { count } = (await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  )) ?? { count: 0 };

  if (count === 0) {
    await db.withTransactionAsync(async () => {
      for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
        const c = DEFAULT_CATEGORIES[i];
        await db.runAsync(
          `INSERT INTO categories (key, label, icon, color, type, is_default, sort_order)
           VALUES (?, ?, ?, ?, ?, 1, ?)`,
          c.key, c.label, c.icon, c.color, c.type, i,
        );
      }
    });
  }
}

export async function loadCategories(): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    `SELECT key, label, icon, color, type, is_default, sort_order
     FROM categories
     ORDER BY sort_order ASC, label ASC`
  );
  return rows.map(rowToCategory);
}

export async function addCategory(
  c: Omit<Category, 'isDefault'>,
): Promise<void> {
  const db = await getDb();
  const { m } = (await db.getFirstAsync<{ m: number | null }>(
    'SELECT MAX(sort_order) as m FROM categories'
  )) ?? { m: 0 };
  await db.runAsync(
    `INSERT INTO categories (key, label, icon, color, type, is_default, sort_order)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    c.key, c.label, c.icon, c.color, c.type, (m ?? 0) + 1,
  );
}

export async function updateCategory(
  key: string,
  patch: Partial<Omit<Category, 'key' | 'isDefault'>>,
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (patch.label !== undefined) { fields.push('label = ?'); values.push(patch.label); }
  if (patch.icon  !== undefined) { fields.push('icon = ?');  values.push(patch.icon);  }
  if (patch.color !== undefined) { fields.push('color = ?'); values.push(patch.color); }
  if (patch.type  !== undefined) { fields.push('type = ?');  values.push(patch.type);  }

  if (fields.length === 0) return;
  values.push(key);

  await db.runAsync(
    `UPDATE categories SET ${fields.join(', ')} WHERE key = ?`,
    ...values,
  );
}

export async function deleteCategory(key: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM categories WHERE key = ?', key);
}