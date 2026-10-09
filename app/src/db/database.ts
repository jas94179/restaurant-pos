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

export type Cart = Record<string, number>; // item id -> quantity

export type NewBill = {
  orderType: 'takeaway' | 'dine_in';
  tableNo?: number;
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
  table_no: number | null;
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
  CREATE TABLE IF NOT EXISTS open_tables (
    table_no INTEGER PRIMARY KEY NOT NULL,
    cart TEXT NOT NULL,
    opened_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// Upgrade older databases on the phone: add columns that newer versions need.
const billColumns = db.getAllSync<{ name: string }>('PRAGMA table_info(bills)').map((c) => c.name);
if (!billColumns.includes('table_no')) {
  db.execSync('ALTER TABLE bills ADD COLUMN table_no INTEGER');
}

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
      `INSERT INTO bills (id, token, created_at, day, order_type, table_no, payment_mode, subtotal, gst, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, token, now.toISOString(), day, bill.orderType, bill.tableNo ?? null, bill.paymentMode, bill.subtotal, bill.gst, bill.total],
    );
    for (const l of bill.lines) {
      db.runSync(
        'INSERT INTO bill_items (bill_id, item_id, name, price, qty, amount) VALUES (?, ?, ?, ?, ?, ?)',
        [id, l.itemId, l.name, l.price, l.qty, l.amount],
      );
    }
    // A settled table becomes free again.
    if (bill.tableNo != null) {
      db.runSync('DELETE FROM open_tables WHERE table_no = ?', [bill.tableNo]);
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

// ---------- Dine-in tables ----------
// A table's running order is saved after every change, so it survives the app closing.

export type OpenTable = { tableNo: number; cart: Cart; openedAt: string };

function parseCart(json: string): Cart {
  try {
    const value = JSON.parse(json);
    return value && typeof value === 'object' ? (value as Cart) : {};
  } catch {
    return {};
  }
}

export function getOpenTables(): Record<number, OpenTable> {
  const rows = db.getAllSync<{ table_no: number; cart: string; opened_at: string }>(
    'SELECT table_no, cart, opened_at FROM open_tables',
  );
  const result: Record<number, OpenTable> = {};
  for (const r of rows) {
    result[r.table_no] = { tableNo: r.table_no, cart: parseCart(r.cart), openedAt: r.opened_at };
  }
  return result;
}

export function getTableCart(tableNo: number): Cart {
  const row = db.getFirstSync<{ cart: string }>('SELECT cart FROM open_tables WHERE table_no = ?', [tableNo]);
  return row ? parseCart(row.cart) : {};
}

export function saveTableCart(tableNo: number, cart: Cart): void {
  const now = new Date().toISOString();
  if (Object.keys(cart).length === 0) {
    db.runSync('DELETE FROM open_tables WHERE table_no = ?', [tableNo]);
    return;
  }
  db.runSync(
    `INSERT INTO open_tables (table_no, cart, opened_at, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(table_no) DO UPDATE SET cart = excluded.cart, updated_at = excluded.updated_at`,
    [tableNo, JSON.stringify(cart), now, now],
  );
}

// ---------- Menu ----------
// Categories and items live in the database so each restaurant can set its own menu.
// Deleted items are only hidden (archived), so old bills and open tables still make sense.

export type Category = { id: string; name: string; sort: number };
export type DbMenuItem = {
  id: string;
  name: string;
  categoryId: string;
  price: number; // paise
  veg: boolean;
  available: boolean;
  archived: boolean;
};

db.execSync(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id),
    price INTEGER NOT NULL,
    veg INTEGER NOT NULL DEFAULT 1,
    available INTEGER NOT NULL DEFAULT 1,
    archived INTEGER NOT NULL DEFAULT 0,
    sort INTEGER NOT NULL DEFAULT 0
  );
`);

type ItemRow = {
  id: string;
  name: string;
  category_id: string;
  price: number;
  veg: number;
  available: number;
  archived: number;
};

function toItem(r: ItemRow): DbMenuItem {
  return {
    id: r.id,
    name: r.name,
    categoryId: r.category_id,
    price: r.price,
    veg: r.veg === 1,
    available: r.available === 1,
    archived: r.archived === 1,
  };
}

// First run only: copy the sample menu in, so the app is usable straight away.
// Sample item ids are kept, so carts already saved on the phone still match.
export function seedMenuIfEmpty(
  sample: { id: string; name: string; category: string; price: number; veg: boolean }[],
  categoryNames: string[],
): void {
  const row = db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM categories');
  if ((row?.n ?? 0) > 0) return;
  db.withTransactionSync(() => {
    const ids: Record<string, string> = {};
    categoryNames.forEach((name, i) => {
      const id = newId();
      ids[name] = id;
      db.runSync('INSERT INTO categories (id, name, sort) VALUES (?, ?, ?)', [id, name, i]);
    });
    sample.forEach((it, i) => {
      db.runSync(
        'INSERT INTO menu_items (id, name, category_id, price, veg, sort) VALUES (?, ?, ?, ?, ?, ?)',
        [it.id, it.name, ids[it.category], it.price, it.veg ? 1 : 0, i],
      );
    });
  });
}

export function getCategories(): Category[] {
  return db.getAllSync<Category>('SELECT id, name, sort FROM categories ORDER BY sort, name');
}

// All items, including archived ones (needed to show old orders correctly).
export function getAllMenuItems(): DbMenuItem[] {
  return db
    .getAllSync<ItemRow>(
      'SELECT id, name, category_id, price, veg, available, archived FROM menu_items ORDER BY sort, name',
    )
    .map(toItem);
}

export function addCategory(name: string): string {
  const id = newId();
  const row = db.getFirstSync<{ m: number | null }>('SELECT MAX(sort) AS m FROM categories');
  db.runSync('INSERT INTO categories (id, name, sort) VALUES (?, ?, ?)', [id, name.trim(), (row?.m ?? -1) + 1]);
  return id;
}

export function renameCategory(id: string, name: string): void {
  db.runSync('UPDATE categories SET name = ? WHERE id = ?', [name.trim(), id]);
}

// Only allowed when no visible items remain in the category.
export function deleteCategory(id: string): boolean {
  const row = db.getFirstSync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM menu_items WHERE category_id = ? AND archived = 0',
    [id],
  );
  if ((row?.n ?? 0) > 0) return false;
  db.runSync('DELETE FROM categories WHERE id = ?', [id]);
  return true;
}

export type ItemInput = { name: string; categoryId: string; price: number; veg: boolean };

export function addMenuItem(input: ItemInput): string {
  const id = newId();
  const row = db.getFirstSync<{ m: number | null }>('SELECT MAX(sort) AS m FROM menu_items');
  db.runSync(
    'INSERT INTO menu_items (id, name, category_id, price, veg, sort) VALUES (?, ?, ?, ?, ?, ?)',
    [id, input.name.trim(), input.categoryId, input.price, input.veg ? 1 : 0, (row?.m ?? -1) + 1],
  );
  return id;
}

export function updateMenuItem(id: string, input: ItemInput): void {
  db.runSync('UPDATE menu_items SET name = ?, category_id = ?, price = ?, veg = ? WHERE id = ?', [
    input.name.trim(),
    input.categoryId,
    input.price,
    input.veg ? 1 : 0,
    id,
  ]);
}

export function setItemAvailable(id: string, available: boolean): void {
  db.runSync('UPDATE menu_items SET available = ? WHERE id = ?', [available ? 1 : 0, id]);
}

export function archiveMenuItem(id: string): void {
  db.runSync('UPDATE menu_items SET archived = 1 WHERE id = ?', [id]);
}

// ---------- Settings ----------
// Simple key/value settings for this restaurant (name, outlet type, PIN, plan...).

db.execSync(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`);

export function getAllSettings(): Record<string, string> {
  const rows = db.getAllSync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const result: Record<string, string> = {};
  for (const r of rows) result[r.key] = r.value;
  return result;
}

export function setSettings(values: Record<string, string>): void {
  db.withTransactionSync(() => {
    for (const [key, value] of Object.entries(values)) {
      db.runSync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        [key, value],
      );
    }
  });
}

export function menuIsEmpty(): boolean {
  const row = db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM categories');
  return (row?.n ?? 0) === 0;
}

// ---------- Insights ----------
// Raw numbers for the owner dashboard. Days are 'YYYY-MM-DD' strings, so text comparison works.

export type BillRow = {
  id: string;
  token: number;
  created_at: string;
  day: string;
  order_type: string;
  table_no: number | null;
  payment_mode: PaymentMode;
  gst: number;
  total: number;
};

export function getBillsInRange(fromDay: string, toDay: string): BillRow[] {
  return db.getAllSync<BillRow>(
    `SELECT id, token, created_at, day, order_type, table_no, payment_mode, gst, total
     FROM bills WHERE day BETWEEN ? AND ? AND status = 'paid' ORDER BY created_at DESC`,
    [fromDay, toDay],
  );
}

export type ItemTotal = { name: string; qty: number; amount: number };

export function getTopItems(fromDay: string, toDay: string, limit = 5): ItemTotal[] {
  return db.getAllSync<ItemTotal>(
    `SELECT i.name AS name, SUM(i.qty) AS qty, SUM(i.amount) AS amount
     FROM bill_items i JOIN bills b ON b.id = i.bill_id
     WHERE b.day BETWEEN ? AND ? AND b.status = 'paid'
     GROUP BY i.item_id
     ORDER BY qty DESC, amount DESC
     LIMIT ?`,
    [fromDay, toDay, limit],
  );
}

// ---------- Transactions ----------

export type BillListRow = BillRow & { item_count: number };

export function getBillList(fromDay: string, toDay: string): BillListRow[] {
  return db.getAllSync<BillListRow>(
    `SELECT b.id, b.token, b.created_at, b.day, b.order_type, b.table_no, b.payment_mode, b.gst, b.total,
            COALESCE(SUM(i.qty), 0) AS item_count
     FROM bills b LEFT JOIN bill_items i ON i.bill_id = b.id
     WHERE b.day BETWEEN ? AND ? AND b.status = 'paid'
     GROUP BY b.id
     ORDER BY b.created_at DESC`,
    [fromDay, toDay],
  );
}

export type BillDetail = BillRow & {
  subtotal: number;
  items: { name: string; price: number; qty: number; amount: number }[];
};

export function getBillDetail(id: string): BillDetail | null {
  const bill = db.getFirstSync<BillRow & { subtotal: number }>(
    `SELECT id, token, created_at, day, order_type, table_no, payment_mode, subtotal, gst, total
     FROM bills WHERE id = ?`,
    [id],
  );
  if (!bill) return null;
  const items = db.getAllSync<{ name: string; price: number; qty: number; amount: number }>(
    'SELECT name, price, qty, amount FROM bill_items WHERE bill_id = ? ORDER BY id',
    [id],
  );
  return { ...bill, items };
}
