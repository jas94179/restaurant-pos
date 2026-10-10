// The receipts the app prints, built line by line for 57 mm paper.
import { modeLabel, type BillDetail, type DayClosing, type Kot } from '../db/database';
import { upiLink } from '../components/UpiQrSheet';
import { Receipt, rs } from './receipt';

function dateText(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function dayClosingReceipt(restaurant: string, gstin: string, c: DayClosing) {
  const r = new Receipt();
  r.center(restaurant, { big: true });
  if (gstin) r.center(`GSTIN ${gstin}`);
  r.center('DAY CLOSING', { bold: true });
  r.center(dateText(c.day));
  r.rule();
  r.pair('Bills', String(c.billCount));
  r.pair('Total sales', rs(c.totalSales), true);
  r.pair('Cash', rs(c.cashSales));
  r.pair('UPI', rs(c.upiSales));
  r.pair('Card', rs(c.cardSales));
  r.pair('Zomato/Swiggy', rs(c.deliverySales));
  r.rule();
  r.text('CASH IN DRAWER', true);
  r.pair('Start of day', rs(c.openingCash));
  r.pair('+ Cash bills', rs(c.cashSales));
  if (c.paidOut) r.pair('- Paid out', rs(c.paidOut));
  r.pair('Should be', rs(c.expectedCash), true);
  r.pair('Counted', rs(c.countedCash), true);
  r.rule();
  const result = c.difference === 0 ? 'CASH MATCHES' : c.difference < 0 ? `SHORT ${rs(-c.difference)}` : `EXTRA ${rs(c.difference)}`;
  r.center(result, { bold: true });
  if (c.note) {
    r.rule();
    r.text(`Note: ${c.note}`);
  }
  r.rule();
  const closedAt = new Date(c.closedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  r.text(`Closed by ${c.closedBy}`);
  r.text(closedAt);
  r.blank();
  r.text('Signature: ______________');
  r.blank();
  return r.lines;
}

// Kitchen order ticket: big, simple, no prices. Cancelled items are clearly marked.
export function kotReceipt(kot: Kot) {
  const r = new Receipt();
  r.center(`KOT #${kot.kotNo}`, { big: true });
  r.center(kot.tableNo != null ? `TABLE ${kot.tableNo}` : `TOKEN #${kot.token ?? '-'}`, { big: true });
  const time = new Date(kot.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  r.center(`${time}${kot.staffName ? ` - ${kot.staffName}` : ''}`);
  r.rule('=');
  const add = kot.items.filter((i) => i.qty > 0);
  const cancel = kot.items.filter((i) => i.qty < 0);
  for (const i of add) {
    r.text(`${String(i.qty).padStart(2)} x ${i.name}`, true);
    if (i.note) r.text(`     > ${i.note}`);
  }
  if (cancel.length) {
    r.rule();
    r.text('CANCEL', true);
    for (const i of cancel) r.text(`${String(-i.qty).padStart(2)} x ${i.name}`, true);
  }
  r.rule('=');
  r.blank();
  return r.lines;
}

// ---------- Customer bill ----------

export type RestaurantInfo = { name: string; gstin: string; address?: string; phone?: string; fssai?: string };

function header(r: Receipt, info: RestaurantInfo) {
  r.center(info.name, { big: true });
  if (info.address) r.center(info.address);
  if (info.phone) r.center(`Ph: ${info.phone}`);
  if (info.gstin) r.center(`GSTIN ${info.gstin}`);
  if (info.fssai) r.center(`FSSAI Lic. No. ${info.fssai}`);
}

const ORDER = { takeaway: 'Counter', dine_in: 'Dine-in', delivery: 'Delivery' } as Record<string, string>;

function itemRows(r: Receipt, items: { name: string; qty: number; amount: number }[]) {
  r.text(`${'Item'.padEnd(18)}${'Qty'.padStart(4)}${'Amount'.padStart(10)}`, true);
  r.rule();
  for (const it of items) {
    const tail = `${String(it.qty).padStart(4)}${rs(it.amount).replace('Rs ', '').padStart(10)}`;
    if (it.name.length <= 18) r.text(it.name.padEnd(18) + tail);
    else {
      r.text(it.name);
      r.text(' '.repeat(18) + tail);
    }
  }
}

function taxRows(r: Receipt, b: { subtotal: number; gst: number; gstRate: number; discount: number; itemsSum: number }) {
  if (b.discount > 0) {
    r.pair('Items total', rs(b.itemsSum));
    r.pair('Discount', '-' + rs(b.discount));
  }
  if (b.gst > 0) {
    const half = Math.floor(b.gst / 2);
    r.pair('Taxable value', rs(b.subtotal));
    r.pair(`CGST ${b.gstRate / 2}%`, rs(half));
    r.pair(`SGST ${b.gstRate / 2}%`, rs(b.gst - half));
  }
}

export function billReceipt(restaurant: RestaurantInfo, bill: BillDetail) {
  const r = new Receipt();
  header(r, restaurant);
  r.center(bill.gst > 0 ? 'TAX INVOICE' : 'BILL', { bold: true });
  if (bill.status === 'cancelled') r.center('*** CANCELLED ***', { bold: true });
  r.rule();
  if (bill.invoice_no) r.pair('Invoice', bill.invoice_no);
  const d = new Date(bill.created_at);
  r.pair(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }));
  r.pair(`Token #${bill.token}`, bill.table_no != null ? `Table ${bill.table_no}` : ORDER[bill.order_type] ?? '');
  if (bill.platform_order_id) r.pair('Order ID', bill.platform_order_id);
  r.rule();
  itemRows(r, bill.items);
  r.rule();
  taxRows(r, {
    subtotal: bill.subtotal,
    gst: bill.gst,
    gstRate: bill.gst_rate,
    discount: bill.discount ?? 0,
    itemsSum: bill.items.reduce((s, i) => s + i.amount, 0),
  });
  r.pair('TOTAL', rs(bill.total), true);
  r.rule();
  r.text(`Paid by ${modeLabel(bill.payment_mode)}`);
  if (bill.order_type === 'delivery') r.text(`GST paid by ${modeLabel(bill.payment_mode)} (Sec 9(5))`);
  if (bill.staff_name) r.text(`Billed by ${bill.staff_name}`);
  r.blank();
  r.center('Thank you! Visit again.');
  r.blank();
  return r.lines;
}

// ---------- Table bill before payment (with UPI QR) ----------

export function preBillReceipt(
  restaurant: RestaurantInfo & { upiId: string },
  tableNo: number,
  items: { name: string; qty: number; amount: number }[],
  t: { subtotal: number; gst: number; gstRate: number; discount: number; itemsSum: number; total: number },
) {
  const r = new Receipt();
  header(r, restaurant);
  r.center(`TABLE ${tableNo} - BILL`, { bold: true });
  const now = new Date();
  r.center(now.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }));
  r.rule();
  itemRows(r, items);
  r.rule();
  taxRows(r, t);
  r.pair('TO PAY', rs(t.total), true);
  r.rule();
  if (restaurant.upiId) {
    r.center('Scan to pay with any UPI app', { bold: true });
    r.qr(upiLink(restaurant.upiId, restaurant.name, t.total, `Table ${tableNo}`), restaurant.upiId);
  }
  r.center('Not a tax invoice.');
  r.center('Invoice is given after payment.');
  r.blank();
  return r.lines;
}

// ---------- Test page ----------

export function testReceipt(restaurant: string, printerName: string) {
  const r = new Receipt();
  r.center('galla', { big: true });
  r.center('PRINTER TEST', { bold: true });
  r.rule();
  r.text(`Restaurant: ${restaurant}`);
  r.text(`Printer: ${printerName}`);
  r.text(new Date().toLocaleString('en-IN'));
  r.rule();
  r.pair('Left', 'Right');
  r.text('Bold line', true);
  r.center('Big text', { big: true });
  r.text('12345678901234567890123456789012');
  r.rule();
  r.center('If you can read this, printing works!');
  r.blank();
  return r.lines;
}
