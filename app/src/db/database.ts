// Local database on the phone. Every bill is saved here first, so billing works
// with no internet. Later this file will also handle encrypted storage and cloud backup.
import * as SQLite from 'expo-sqlite';

export type PaymentMode = 'cash' | 'upi' | 'card';
export const PAYMENT_MODES: { key: PaymentMode; label: string }[] = [
  { key: 'cash', label: 'Cash' },
  { key: 'upi', label: 'UPI' },
  { key: 'card', label: 'Card' },
];

export type BillLine = {
  itemId: string;
  name: string;
  price: number; // paise
  qty: number;
  amount: number; // paise
};

export type NewBill = {
  orderType: 'takeaway' | 'dine_in';
  paymentMode: PaymentMode;
  subtotal: number;
  gst: number;
  total: number;
  lines: BillLine[];
};

export type SavedBill = {
  id: string;
  token: number;
  created_at: string;
  day: string;
  order_type: string;
  payment_mode: PaymentMode;
  subtotal: number;
  gst: number;
  total: number;
  item_count: number;
};

export type DaySummary = {
  day: string;
  billCount: number;
  totalSales: number;
  gstCollected: number;
  byMode: Record<PaymentMode, { count: number; amount: number }>;
  bills: SavedBill[];
};

const db = SQLite.openDatabaseSync('pos.db');

db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY NOT NULL,
    token INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    day TEXT NOT NULL,
    order_type TEXT NOT NULL,
    payment_mode TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    gst INTEGER NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid'
  );
  CREATE INDEX IF NOT EXISTS idx_bills_day ON bills(day);
  CREATE TABLE IF NOT EXISTS bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id TEXT NOT NULL REFERENCES bills(id),
    item_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    qty INTEGER NOT NULL,
    amount INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id);
`);

// "2026-10-09" in the phone's local time (not UTC), so the day changes at local midnight.
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Unique id made on the phone, so the same bill is never saved twice when we add cloud sync.
function newId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

// Token numbers start again from 1 every day.
export function getNextToken(day: string = dayKey()): number {
  const row = db.getFirstSync<{ maxToken: number | null }>(
    'SELECT MAX(token) AS maxToken FROM bills WHERE day = ?',
    [day],
  );
  return (row?.maxToken ?? 0) + 1;
}

export function saveBill(bill: NewBill): { id: string; token: number } {
  const now = new Date();
  const day = dayKey(now);
  const id = newId();
  let token = 0;

  db.withTransactionSync(() => {
    token = getNextToken(day);
    db.runSync(
      `INSERT INTO bills (id, token, created_at, day, order_type, payment_mode, subtotal, gst, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, token, now.toISOString(), day, bill.orderType, bill.paymentMode, bill.subtotal, bill.gst, bill.total],
    );
    for (const l of bill.lines) {
      db.runSync(
        'INSERT INTO bill_items (bill_id, item_id, name, price, qty, amount) VALUES (?, ?, ?, ?, ?, ?)',
        [id, l.itemId, l.name, l.price, l.qty, l.amount],
      );
    }
  });

  return { id, token };
}

export function getDaySummary(day: string = dayKey()): DaySummary {
  const bills = db.getAllSync<SavedBill>(
    `SELECT b.*, COALESCE(SUM(i.qty), 0) AS item_count
     FROM bills b LEFT JOIN bill_items i ON i.bill_id = b.id
     WHERE b.day = ? AND b.status = 'paid'
     GROUP BY b.id
     ORDER BY b.token DESC`,
    [day],
  );

  const byMode: DaySummary['byMode'] = {
    cash: { count: 0, amount: 0 },
    upi: { count: 0, amount: 0 },
    card: { count: 0, amount: 0 },
  };
  let totalSales = 0;
  let gstCollected = 0;
  for (const b of bills) {
    totalSales += b.total;
    gstCollected += b.gst;
    const m = byMode[b.payment_mode];
    if (m) {
      m.count += 1;
      m.amount += b.total;
    }
  }

  return { day, billCount: bills.length, totalSales, gstCollected, byMode, bills };
}
