import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Transaction } from './transactionService';
import { formatDateFull } from '../utils/format';

/** Minimal shape we need from a category — works with Category or fallback. */
type CategoryLookup = (key: string) => { label: string };

const escape = (s: string) => `"${String(s).replace(/"/g, '""')}"`;

/**
 * Robust CSV parser — supports quoted fields with embedded commas,
 * escaped quotes (""), and newlines inside quotes.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cur += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ',') {
      row.push(cur);
      cur = '';
      i += 1;
      continue;
    }
    if (c === '\r') {
      i += 1;
      continue;
    }
    if (c === '\n') {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
      i += 1;
      continue;
    }
    cur += c;
    i += 1;
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

export type RestoredTransaction = Omit<Transaction, 'id' | 'createdAt'>;

export const exportService = {
  /**
   * Serialize transactions to CSV. Adds a hidden `Timestamp` column so that
   * backups can be restored losslessly (raw ms), while keeping the
   * human-readable Date column for spreadsheets.
   */
  transactionsToCsv(
    list: Transaction[],
    getCategory: CategoryLookup,
  ): string {
    const header = [
      'Date',
      'Type',
      'Title',
      'Category',
      'Amount',
      'Payment',
      'Note',
      'Timestamp',
    ];
    const rows = list.map((t) => [
      escape(formatDateFull(t.date)),
      escape(t.type),
      escape(t.title),
      escape(getCategory(t.category).label),
      String(t.amount),
      escape(t.paymentMethod || ''),
      escape(t.note || ''),
      String(t.date), // raw ms — used on restore
    ]);
    return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  async shareCsv(list: Transaction[], getCategory: CategoryLookup) {
    const csv = this.transactionsToCsv(list, getCategory);
    const filename = `expense-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
    const path = FileSystem.cacheDirectory + filename;
    await FileSystem.writeAsStringAsync(path, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: 'text/csv',
        dialogTitle: 'Export transactions',
      });
    }
    return path;
  },

  /** Write a backup file and open the native share sheet so the user can save it. */
  async backupToFile(list: Transaction[], getCategory: CategoryLookup) {
    const csv = this.transactionsToCsv(list, getCategory);
    const filename = `expense-tracker-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    const path = FileSystem.cacheDirectory + filename;
    await FileSystem.writeAsStringAsync(path, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: 'text/csv',
        dialogTitle: 'Save backup file',
      });
    }
    return path;
  },

  /**
   * Let the user pick a CSV file and parse it into transactions.
   * `resolveCategoryKey` maps a label OR key from the CSV to a valid category key.
   */
  async pickAndParseBackup(
    resolveCategoryKey: (labelOrKey: string) => string | null,
  ): Promise<RestoredTransaction[]> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return [];
    const fileUri = result.assets[0].uri;
    const csv = await FileSystem.readAsStringAsync(fileUri);
    return this.parseCsvToTransactions(csv, resolveCategoryKey);
  },

  parseCsvToTransactions(
    csv: string,
    resolveCategoryKey: (labelOrKey: string) => string | null,
  ): RestoredTransaction[] {
    const rows = parseCsv(csv);
    if (rows.length < 2) return [];

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const idx = {
      date: header.indexOf('date'),
      type: header.indexOf('type'),
      title: header.indexOf('title'),
      category: header.indexOf('category'),
      amount: header.indexOf('amount'),
      payment: header.indexOf('payment'),
      note: header.indexOf('note'),
      timestamp: header.indexOf('timestamp'),
    };

    if (idx.amount < 0 || idx.type < 0) return [];

    const out: RestoredTransaction[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row.length || row.every((c) => !c)) continue;

      const amount = parseFloat(row[idx.amount]);
      if (!isFinite(amount)) continue;

      const type =
        String(row[idx.type] || '').toLowerCase() === 'income'
          ? 'income'
          : 'expense';

      // Prefer raw timestamp for a lossless round-trip
      let date = NaN;
      if (idx.timestamp >= 0) {
        const raw = row[idx.timestamp];
        if (raw) date = parseInt(raw, 10);
      }
      if (!isFinite(date)) {
        const parsed = Date.parse(row[idx.date] || '');
        date = isFinite(parsed) ? parsed : Date.now();
      }

      const catLabel = (row[idx.category] || '').trim();
      const category = resolveCategoryKey(catLabel) || catLabel || 'other';

      out.push({
        type,
        amount,
        title: row[idx.title] || '',
        category,
        paymentMethod:
          idx.payment >= 0 ? row[idx.payment] || undefined : undefined,
        note: idx.note >= 0 ? row[idx.note] || undefined : undefined,
        date,
      });
    }
    return out;
  },
};