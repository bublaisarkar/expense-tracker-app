/**
 * Currency + date formatting helpers.
 * Indian locale, ₹ symbol by default.
 */

export const formatCurrency = (value: number, symbol = '₹'): string => {
  const v = Number(value || 0);
  const formatted = v.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return `${symbol}${formatted}`;
};

export const formatCurrencyShort = (value: number, symbol = '₹'): string => {
  const v = Number(value || 0);
  const abs = Math.abs(v);
  let out: string;
  if (abs >= 1_00_00_000) out = (v / 1_00_00_000).toFixed(2) + 'Cr';
  else if (abs >= 1_00_000) out = (v / 1_00_000).toFixed(2) + 'L';
  else if (abs >= 1_000) out = (v / 1_000).toFixed(1) + 'K';
  else out = String(v);
  return `${symbol}${out}`;
};

export const formatDate = (ts: number | Date): string => {
  const d = ts instanceof Date ? ts : new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export const formatDateFull = (ts: number | Date): string => {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (ts: number | Date): string => {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatMonthYear = (ts: number | Date): string => {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

export const toMonthKey = (ts: number | Date): string => {
  const d = ts instanceof Date ? ts : new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const isSameMonth = (a: number | Date, b: number | Date): boolean =>
  toMonthKey(a) === toMonthKey(b);

export const isSameDay = (a: number | Date, b: number | Date): boolean => {
  const da = a instanceof Date ? a : new Date(a);
  const db = b instanceof Date ? b : new Date(b);
  return da.toDateString() === db.toDateString();
};