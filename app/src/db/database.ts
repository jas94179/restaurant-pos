// Local database on the phone. Every bill is saved here first, so billing works
// with no internet. Later this file will also handle encrypted storage and cloud backup.
import * as SQLite from 'expo-sqlite';

export type PaymentMode = 'cash' | 'upi' | 'card' | 'zomato' | 'swiggy';
// What the cashier can choose at the counter.
export const PAYMENT_MODES: { key: PaymentMode; label: string }[] = [
  { key: 'cash', label: 'Cash' },
  { key: 'upi', label: 'UPI' },
  { key: 'card', label: 'Card' },
];
// Delivery apps: the customer has already paid the app.
export type Platform = 'zomato' | 'swiggy';
export const PLATFORMS: { key: Platform; label: string }[] = [
  { key: 'zomato', label: 'Zomato' },
  { key: 'swiggy', label: 'Swiggy' },
];
export const ALL_MODES = [...PAYMENT_MODES, ...PLATFORMS];
export function modeLabel(m: string): string {
  return ALL_MODES.find((p) => p.key === m)?.label ?? m;
}

export type BillLine = {
  itemId: string;
  name: string;
  price: number; // paise
  qty: number;
  amount: number; // paise
};

export type Cart = Record<string, number>; // item id -> quantity

export type NewBill = {
  orderType: 'takeaway' | 'dine_in' | 'delivery';
  platformOrderId?: string;
  tableNo?: number;
  staffId?: string;
  staffName?: string;
  gstRate: number;
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

// ---------- Restaurants on this phone ----------
// Each restaurant has its own database file, so one phone can hold several
// restaurants (one owner can run more than one). A small accounts file lists them.
// In the real app, signing in with the owner's mobile number picks the restaurant.

export type RestaurantEntry = { file: string; name: string; lastUsedAt: string };

const accounts = SQLite.openDatabaseSync('galla-accounts.db');
accounts.execSync(`
  CREATE TABLE IF NOT EXISTS restaurants (
    file TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_used_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`);

function getMeta(key: string): string | null {
  return accounts.getFirstSync<{ value: string }>('SELECT value FROM meta WHERE key = ?', [key])?.value ?? null;
}

function setMeta(key: string, value: string): void {
  accounts.runSync(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

// The first version kept one restaurant in pos.db; it stays the default file.
let activeFile = getMeta('activeFile') ?? 'pos.db';
let db = SQLite.openDatabaseSync(activeFile);
prepareSchema();

// Create tables, and upgrade older databases with columns newer versions need.
function prepareSchema(): void {
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

  db.execSync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      pin_salt TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS day_closings (
      id TEXT PRIMARY KEY NOT NULL,
      day TEXT NOT NULL,
      closed_at TEXT NOT NULL,
      closed_by TEXT NOT NULL,
      opening_cash INTEGER NOT NULL,
      cash_sales INTEGER NOT NULL,
      expected_cash INTEGER NOT NULL,
      counted_cash INTEGER NOT NULL,
      difference INTEGER NOT NULL,
      bill_count INTEGER NOT NULL,
      total_sales INTEGER NOT NULL,
      upi_sales INTEGER NOT NULL,
      card_sales INTEGER NOT NULL,
      delivery_sales INTEGER NOT NULL,
      note TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_day_closings_day ON day_closings(day);
  `);

  // Upgrade older databases on the phone: add columns that newer versions need.
  const billColumns = db.getAllSync<{ name: string }>('PRAGMA table_info(bills)').map((c) => c.name);
  if (!billColumns.includes('table_no')) {
    db.execSync('ALTER TABLE bills ADD COLUMN table_no INTEGER');
  }
  if (!billColumns.includes('invoice_no')) {
    db.execSync('ALTER TABLE bills ADD COLUMN invoice_no TEXT');
    db.execSync('ALTER TABLE bills ADD COLUMN invoice_fy TEXT');
    db.execSync('ALTER TABLE bills ADD COLUMN invoice_serial INTEGER');
    backfillInvoiceNumbers();
  }
  if (!billColumns.includes('cancelled_at')) {
    db.execSync('ALTER TABLE bills ADD COLUMN cancelled_at TEXT');
    db.execSync('ALTER TABLE bills ADD COLUMN cancelled_by TEXT');
    db.execSync('ALTER TABLE bills ADD COLUMN cancel_reason TEXT');
  }
  if (!billColumns.includes('platform_order_id')) {
    db.execSync('ALTER TABLE bills ADD COLUMN platform_order_id TEXT');
  }
  if (!billColumns.includes('gst_rate')) {
    // Earlier bills were all 5%.
    db.execSync('ALTER TABLE bills ADD COLUMN gst_rate REAL NOT NULL DEFAULT 5');
  }
  if (!billColumns.includes('staff_id')) {
    db.execSync('ALTER TABLE bills ADD COLUMN staff_id TEXT');
    db.execSync('ALTER TABLE bills ADD COLUMN staff_name TEXT');
  }
}

// Phones set up before multi-restaurant support: list the existing restaurant once.
if (getMeta('registryReady') !== '1') {
  const row = db.getFirstSync<{ value: string }>("SELECT value FROM settings WHERE key = 'setupDone'");
  if (row?.value === '1') registerRestaurant();
  setMeta('registryReady', '1');
}

export function currentRestaurantFile(): string {
  return activeFile;
}

// Restaurants that finished setup, most recently used first.
export function listRestaurants(): RestaurantEntry[] {
  return accounts
    .getAllSync<{ file: string; name: string; last_used_at: string }>(
      'SELECT file, name, last_used_at FROM restaurants ORDER BY last_used_at DESC',
    )
    .map((r) => ({ file: r.file, name: r.name, lastUsedAt: r.last_used_at }));
}

export function isRegistered(file: string): boolean {
  return !!accounts.getFirstSync('SELECT file FROM restaurants WHERE file = ?', [file]);
}

// Switch every query in the app to another restaurant's file.
export function openRestaurantFile(file: string): void {
  if (file !== activeFile) {
    try {
      db.closeSync();
    } catch {
      // already closed
    }
    db = SQLite.openDatabaseSync(file);
    activeFile = file;
    prepareSchema();
  }
  setMeta('activeFile', file);
  accounts.runSync('UPDATE restaurants SET last_used_at = ? WHERE file = ?', [new Date().toISOString(), file]);
}

// A fresh, empty file for a new restaurant (sign up, or restoring a backup).
export function newRestaurantFile(): string {
  return `restaurant-${newId()}.db`;
}

// Add or update the open restaurant in the list (after setup, restore or a rename).
export function registerRestaurant(): void {
  const name =
    db.getFirstSync<{ value: string }>("SELECT value FROM settings WHERE key = 'restaurantName'")?.value ?? 'Restaurant';
  const now = new Date().toISOString();
  accounts.runSync(
    `INSERT INTO restaurants (file, name, created_at, last_used_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(file) DO UPDATE SET name = excluded.name, last_used_at = excluded.last_used_at`,
    [activeFile, name, now, now],
  );
}


// "2026-10-09" in the phone's local time (not UTC), so the day changes at local midnight.
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---------- GST invoice numbers ----------
// GST needs every tax invoice to have its own serial number within the financial year
// (April to March). Daily tokens are only for calling out orders.
// Format: INV-2627-00001 (FY 2026-27, serial 1). Delivery-app orders get none: the app issues that invoice.

export function financialYear(date: Date = new Date()): string {
  const y = date.getFullYear();
  const start = date.getMonth() >= 3 ? y : y - 1; // April is month 3
  return `${String(start).slice(2)}${String(start + 1).slice(2)}`;
}

export function formatInvoiceNo(fy: string, serial: number): string {
  return `INV-${fy}-${String(serial).padStart(5, '0')}`;
}

function nextInvoiceSerial(fy: string): number {
  const row = db.getFirstSync<{ m: number | null }>('SELECT MAX(invoice_serial) AS m FROM bills WHERE invoice_fy = ?', [fy]);
  return (row?.m ?? 0) + 1;
}

// One time: number the bills saved before invoice numbers existed, oldest first.
function backfillInvoiceNumbers() {
  const rows = db.getAllSync<{ id: string; created_at: string; order_type: string }>(
    'SELECT id, created_at, order_type FROM bills ORDER BY created_at',
  );
  const serials: Record<string, number> = {};
  db.withTransactionSync(() => {
    for (const r of rows) {
      if (r.order_type === 'delivery') continue;
      const fy = financialYear(new Date(r.created_at));
      serials[fy] = (serials[fy] ?? 0) + 1;
      db.runSync('UPDATE bills SET invoice_no = ?, invoice_fy = ?, invoice_serial = ? WHERE id = ?', [
        formatInvoiceNo(fy, serials[fy]),
        fy,
        serials[fy],
        r.id,
      ]);
    }
  });
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

export function saveBill(bill: NewBill): { id: string; token: number; invoiceNo: string | null } {
  const now = new Date();
  const day = dayKey(now);
  const id = newId();
  let token = 0;
  let invoiceNo: string | null = null;

  db.withTransactionSync(() => {
    token = getNextToken(day);
    // Number and save in one transaction, so two bills can never get the same invoice number.
    let fy: string | null = null;
    let serial: number | null = null;
    if (bill.orderType !== 'delivery') {
      fy = financialYear(now);
      serial = nextInvoiceSerial(fy);
      invoiceNo = formatInvoiceNo(fy, serial);
    }
    db.runSync(
      `INSERT INTO bills (id, token, created_at, day, order_type, table_no, payment_mode, subtotal, gst, total, staff_id, staff_name, gst_rate, platform_order_id, invoice_no, invoice_fy, invoice_serial)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, token, now.toISOString(), day, bill.orderType, bill.tableNo ?? null, bill.paymentMode, bill.subtotal, bill.gst, bill.total, bill.staffId ?? null, bill.staffName ?? null, bill.gstRate, bill.platformOrderId ?? null, invoiceNo, fy, serial],
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

  return { id, token, invoiceNo };
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
    zomato: { count: 0, amount: 0 },
    swiggy: { count: 0, amount: 0 },
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
  platform_order_id: string | null;
  invoice_no: string | null;
  payment_mode: PaymentMode;
  gst: number;
  total: number;
};

export function getBillsInRange(fromDay: string, toDay: string): BillRow[] {
  return db.getAllSync<BillRow>(
    `SELECT id, token, created_at, day, order_type, table_no, platform_order_id, invoice_no, payment_mode, gst, total
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

export type BillListRow = BillRow & { item_count: number; status: 'paid' | 'cancelled' };

export function getBillList(fromDay: string, toDay: string): BillListRow[] {
  return db.getAllSync<BillListRow>(
    `SELECT b.id, b.token, b.created_at, b.day, b.order_type, b.table_no, b.platform_order_id, b.invoice_no, b.payment_mode, b.gst, b.total,
            b.status, COALESCE(SUM(i.qty), 0) AS item_count
     FROM bills b LEFT JOIN bill_items i ON i.bill_id = b.id
     WHERE b.day BETWEEN ? AND ? AND b.status IN ('paid', 'cancelled')
     GROUP BY b.id
     ORDER BY b.created_at DESC`,
    [fromDay, toDay],
  );
}

export type BillDetail = BillRow & {
  subtotal: number;
  staff_name: string | null;
  gst_rate: number;
  status: 'paid' | 'cancelled';
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  items: { name: string; price: number; qty: number; amount: number }[];
};

export function getBillDetail(id: string): BillDetail | null {
  const bill = db.getFirstSync<Omit<BillDetail, 'items'>>(
    `SELECT id, token, created_at, day, order_type, table_no, platform_order_id, invoice_no, payment_mode, subtotal, gst, total,
            staff_name, gst_rate, status, cancelled_at, cancelled_by, cancel_reason
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

// ---------- Staff ----------
// Everyone who uses the app has a name, a role and their own PIN.
// PINs are stored only as salted hashes.

export type Role = 'owner' | 'manager' | 'cashier';
export type Staff = { id: string; name: string; role: Role; pinHash: string; pinSalt: string; active: boolean };


type StaffRow = { id: string; name: string; role: Role; pin_hash: string; pin_salt: string; active: number };

export function getStaff(includeInactive = false): Staff[] {
  return db
    .getAllSync<StaffRow>(
      `SELECT id, name, role, pin_hash, pin_salt, active FROM staff
       ${includeInactive ? '' : 'WHERE active = 1'}
       ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'manager' THEN 1 ELSE 2 END, name`,
    )
    .map((r) => ({ id: r.id, name: r.name, role: r.role, pinHash: r.pin_hash, pinSalt: r.pin_salt, active: r.active === 1 }));
}

export function addStaff(input: { name: string; role: Role; pinHash: string; pinSalt: string }): string {
  const id = newId();
  db.runSync(
    'INSERT INTO staff (id, name, role, pin_hash, pin_salt, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
    [id, input.name.trim(), input.role, input.pinHash, input.pinSalt, new Date().toISOString()],
  );
  return id;
}

export function updateStaff(id: string, values: { name: string; role: Role }): void {
  db.runSync('UPDATE staff SET name = ?, role = ? WHERE id = ?', [values.name.trim(), values.role, id]);
}

export function setStaffPin(id: string, pinHash: string, pinSalt: string): void {
  db.runSync('UPDATE staff SET pin_hash = ?, pin_salt = ? WHERE id = ?', [pinHash, pinSalt, id]);
}

// Staff are deactivated, not deleted, so old bills still show who made them.
export function deactivateStaff(id: string): void {
  db.runSync('UPDATE staff SET active = 0 WHERE id = ?', [id]);
}

// Avoids entering the same delivery order twice.
export function platformOrderExists(platform: Platform, orderId: string): boolean {
  const row = db.getFirstSync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM bills WHERE payment_mode = ? AND platform_order_id = ? AND status = 'paid'",
    [platform, orderId.trim()],
  );
  return (row?.n ?? 0) > 0;
}

// Cancelled bills are never deleted: they stay in Bills, marked, and drop out of all totals.
export function cancelBill(id: string, approvedBy: string, reason: string): void {
  db.runSync(
    "UPDATE bills SET status = 'cancelled', cancelled_at = ?, cancelled_by = ?, cancel_reason = ? WHERE id = ? AND status = 'paid'",
    [new Date().toISOString(), approvedBy, reason, id],
  );
}

// ---------- Backup and restore ----------
// The whole database as one JSON file. Restore replaces everything on this phone.

const BACKUP_TABLES = ['settings', 'staff', 'categories', 'menu_items', 'bills', 'bill_items', 'open_tables', 'day_closings'] as const;
export const BACKUP_FORMAT = 'galla-backup';
export const BACKUP_VERSION = 1;

export type BackupFile = {
  format: string;
  version: number;
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
};

export function exportBackup(): BackupFile {
  const tables: BackupFile['tables'] = {};
  for (const t of BACKUP_TABLES) {
    tables[t] = db.getAllSync<Record<string, unknown>>(`SELECT * FROM ${t}`);
  }
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), tables };
}

export function describeBackup(b: BackupFile) {
  const settings = Object.fromEntries((b.tables.settings ?? []).map((r) => [r.key, r.value]));
  return {
    restaurantName: String(settings.restaurantName ?? 'Unknown restaurant'),
    bills: (b.tables.bills ?? []).length,
    items: (b.tables.menu_items ?? []).length,
    staff: (b.tables.staff ?? []).length,
    exportedAt: b.exportedAt,
  };
}

export function isBackupFile(value: unknown): value is BackupFile {
  const v = value as BackupFile;
  return !!v && v.format === BACKUP_FORMAT && typeof v.version === 'number' && !!v.tables && typeof v.tables === 'object';
}

export function restoreBackup(b: BackupFile): void {
  if (b.version > BACKUP_VERSION) throw new Error('This backup is from a newer version of the app. Update the app first.');
  db.withTransactionSync(() => {
    for (const t of BACKUP_TABLES) {
      // Only copy columns this version of the app knows; missing ones get their defaults.
      const columns = db.getAllSync<{ name: string }>(`PRAGMA table_info(${t})`).map((c) => c.name);
      db.runSync(`DELETE FROM ${t}`);
      for (const row of b.tables[t] ?? []) {
        const keys = Object.keys(row).filter((k) => columns.includes(k));
        if (keys.length === 0) continue;
        const placeholders = keys.map(() => '?').join(', ');
        db.runSync(
          `INSERT INTO ${t} (${keys.join(', ')}) VALUES (${placeholders})`,
          keys.map((k) => row[k] as string | number | null),
        );
      }
    }
  });
}

// ---------- Day-end closing ----------
// At night the cash in the drawer is counted and compared with cash bills.
// Every closing is kept (closing again the same day adds a new record).

export type DayClosing = {
  id: string;
  day: string;
  closedAt: string;
  closedBy: string;
  openingCash: number;
  cashSales: number;
  expectedCash: number;
  countedCash: number;
  difference: number; // counted - expected; negative means cash is short
  billCount: number;
  totalSales: number;
  upiSales: number;
  cardSales: number;
  deliverySales: number;
  note: string;
};

type DayClosingRow = {
  id: string; day: string; closed_at: string; closed_by: string; opening_cash: number; cash_sales: number;
  expected_cash: number; counted_cash: number; difference: number; bill_count: number; total_sales: number;
  upi_sales: number; card_sales: number; delivery_sales: number; note: string | null;
};

function toClosing(r: DayClosingRow): DayClosing {
  return {
    id: r.id, day: r.day, closedAt: r.closed_at, closedBy: r.closed_by, openingCash: r.opening_cash,
    cashSales: r.cash_sales, expectedCash: r.expected_cash, countedCash: r.counted_cash, difference: r.difference,
    billCount: r.bill_count, totalSales: r.total_sales, upiSales: r.upi_sales, cardSales: r.card_sales,
    deliverySales: r.delivery_sales, note: r.note ?? '',
  };
}

export function saveDayClosing(input: { day: string; closedBy: string; openingCash: number; countedCash: number; note: string }): DayClosing {
  const s = getDaySummary(input.day);
  const cashSales = s.byMode.cash.amount;
  const expectedCash = input.openingCash + cashSales;
  const row: DayClosingRow = {
    id: newId(),
    day: input.day,
    closed_at: new Date().toISOString(),
    closed_by: input.closedBy,
    opening_cash: input.openingCash,
    cash_sales: cashSales,
    expected_cash: expectedCash,
    counted_cash: input.countedCash,
    difference: input.countedCash - expectedCash,
    bill_count: s.billCount,
    total_sales: s.totalSales,
    upi_sales: s.byMode.upi.amount,
    card_sales: s.byMode.card.amount,
    delivery_sales: s.byMode.zomato.amount + s.byMode.swiggy.amount,
    note: input.note.trim() || null,
  };
  db.runSync(
    `INSERT INTO day_closings (id, day, closed_at, closed_by, opening_cash, cash_sales, expected_cash, counted_cash, difference, bill_count, total_sales, upi_sales, card_sales, delivery_sales, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.day, row.closed_at, row.closed_by, row.opening_cash, row.cash_sales, row.expected_cash, row.counted_cash, row.difference, row.bill_count, row.total_sales, row.upi_sales, row.card_sales, row.delivery_sales, row.note],
  );
  return toClosing(row);
}

// Latest closing for a day, if any.
export function getDayClosing(day: string): DayClosing | null {
  const r = db.getFirstSync<DayClosingRow>('SELECT * FROM day_closings WHERE day = ? ORDER BY closed_at DESC LIMIT 1', [day]);
  return r ? toClosing(r) : null;
}

export function getRecentClosings(limit = 30): DayClosing[] {
  return db.getAllSync<DayClosingRow>('SELECT * FROM day_closings ORDER BY closed_at DESC LIMIT ?', [limit]).map(toClosing);
}

// ---------- Export for the CA ----------

export type ExportBill = {
  created_at: string; day: string; invoice_no: string | null; token: number; order_type: string;
  table_no: number | null; payment_mode: string; platform_order_id: string | null; gst_rate: number;
  subtotal: number; gst: number; total: number; status: string; cancel_reason: string | null; staff_name: string | null;
};

// All bills in the range, oldest first, cancelled ones included (marked), as a CA expects.
export function getBillsForExport(fromDay: string, toDay: string): ExportBill[] {
  return db.getAllSync<ExportBill>(
    `SELECT created_at, day, invoice_no, token, order_type, table_no, payment_mode, platform_order_id, gst_rate,
            subtotal, gst, total, status, cancel_reason, staff_name
     FROM bills WHERE day BETWEEN ? AND ? ORDER BY created_at ASC`,
    [fromDay, toDay],
  );
}

export function getItemSalesForExport(fromDay: string, toDay: string): ItemTotal[] {
  return db.getAllSync<ItemTotal>(
    `SELECT i.name AS name, SUM(i.qty) AS qty, SUM(i.amount) AS amount
     FROM bill_items i JOIN bills b ON b.id = i.bill_id
     WHERE b.day BETWEEN ? AND ? AND b.status = 'paid'
     GROUP BY i.item_id
     ORDER BY amount DESC`,
    [fromDay, toDay],
  );
}
