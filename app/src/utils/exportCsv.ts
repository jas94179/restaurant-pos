// Sales files for the CA, as CSV (opens in Excel and Google Sheets).
// Amounts are in rupees with 2 decimals. CGST/SGST split matches the printed bill.
import { getBillsForExport, getItemSalesForExport, modeLabel, type ExportBill } from '../db/database';

const rs = (paise: number) => (paise / 100).toFixed(2);

function cell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: (string | number | null | undefined)[][]): string {
  // BOM so Excel reads ₹ and Hindi names correctly.
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
}

const split = (gst: number) => {
  const cgst = Math.floor(gst / 2);
  return { cgst, sgst: gst - cgst };
};

const ORDER_LABEL: Record<string, string> = { takeaway: 'Counter', dine_in: 'Dine-in', delivery: 'Delivery app' };

function dmy(day: string): string {
  const [y, m, d] = day.split('-');
  return `${d}-${m}-${y}`;
}

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export type ExportKind = 'bills' | 'gst' | 'daily' | 'items';

export const EXPORTS: { kind: ExportKind; title: string; detail: string }[] = [
  { kind: 'bills', title: 'Bill-wise register', detail: 'Every bill with invoice number, taxable value, CGST, SGST. Cancelled bills marked.' },
  { kind: 'gst', title: 'GST summary', detail: 'Totals by GST rate for filing, with delivery-app sales (Section 9(5)) shown separately.' },
  { kind: 'daily', title: 'Day-wise sales', detail: 'One line per day: bills, sales, GST, cash, UPI, card, delivery apps.' },
  { kind: 'items', title: 'Item-wise sales', detail: 'Quantity and amount sold for each dish.' },
];

export function buildExport(kind: ExportKind, fromDay: string, toDay: string, meta: { restaurant: string; gstin: string }): { csv: string; rows: number } {
  const header: string[][] = [[meta.restaurant]];
  if (meta.gstin) header.push([`GSTIN ${meta.gstin}`]);
  header.push([`Period ${dmy(fromDay)} to ${dmy(toDay)}`], []);

  if (kind === 'items') {
    const items = getItemSalesForExport(fromDay, toDay);
    const total = items.reduce((s, i) => s + i.amount, 0);
    return {
      rows: items.length,
      csv: toCsv([
        ...header,
        ['Item', 'Quantity', 'Amount (Rs, menu price)'],
        ...items.map((i) => [i.name, i.qty, rs(i.amount)]),
        ['Total', items.reduce((s, i) => s + i.qty, 0), rs(total)],
      ]),
    };
  }

  const bills = getBillsForExport(fromDay, toDay);
  const paid = bills.filter((b) => b.status === 'paid');

  if (kind === 'bills') {
    const t = { sub: 0, cgst: 0, sgst: 0, total: 0 };
    const lines = bills.map((b: ExportBill) => {
      const { cgst, sgst } = split(b.gst);
      const cancelled = b.status !== 'paid';
      if (!cancelled) {
        t.sub += b.subtotal;
        t.cgst += cgst;
        t.sgst += sgst;
        t.total += b.total;
      }
      return [
        dmy(b.day), time(b.created_at), b.invoice_no ?? '', b.token, ORDER_LABEL[b.order_type] ?? b.order_type,
        b.table_no ?? '', modeLabel(b.payment_mode), b.platform_order_id ?? '', b.gst_rate,
        rs(b.subtotal), rs(cgst), rs(sgst), rs(b.total), cancelled ? 'Cancelled' : 'Paid', b.cancel_reason ?? '', b.staff_name ?? '',
      ];
    });
    return {
      rows: bills.length,
      csv: toCsv([
        ...header,
        ['Date', 'Time', 'Invoice no', 'Token', 'Order type', 'Table', 'Payment', 'Delivery app order ID', 'GST rate %',
          'Taxable value', 'CGST', 'SGST', 'Bill total', 'Status', 'Cancel reason', 'Billed by'],
        ...lines,
        [],
        ['Total (paid bills)', '', '', '', '', '', '', '', '', rs(t.sub), rs(t.cgst), rs(t.sgst), rs(t.total)],
      ]),
    };
  }

  if (kind === 'gst') {
    const byRate = new Map<number, { count: number; sub: number; cgst: number; sgst: number; total: number }>();
    let delivery = { count: 0, total: 0 };
    let cancelled = { count: 0, total: 0 };
    for (const b of bills) {
      if (b.status !== 'paid') {
        cancelled = { count: cancelled.count + 1, total: cancelled.total + b.total };
        continue;
      }
      if (b.order_type === 'delivery') {
        delivery = { count: delivery.count + 1, total: delivery.total + b.total };
        continue;
      }
      const r = byRate.get(b.gst_rate) ?? { count: 0, sub: 0, cgst: 0, sgst: 0, total: 0 };
      const { cgst, sgst } = split(b.gst);
      r.count += 1;
      r.sub += b.subtotal;
      r.cgst += cgst;
      r.sgst += sgst;
      r.total += b.total;
      byRate.set(b.gst_rate, r);
    }
    const rates = [...byRate.entries()].sort((a, b) => a[0] - b[0]);
    const sum = rates.reduce(
      (s, [, r]) => ({ count: s.count + r.count, sub: s.sub + r.sub, cgst: s.cgst + r.cgst, sgst: s.sgst + r.sgst, total: s.total + r.total }),
      { count: 0, sub: 0, cgst: 0, sgst: 0, total: 0 },
    );
    const invoices = paid.map((b) => b.invoice_no).filter(Boolean) as string[];
    return {
      rows: bills.length,
      csv: toCsv([
        ...header,
        ['Sales to customers (B2C, intra-state)'],
        ['GST rate %', 'Bills', 'Taxable value', 'CGST', 'SGST', 'Total tax', 'Invoice value'],
        ...rates.map(([rate, r]) => [rate, r.count, rs(r.sub), rs(r.cgst), rs(r.sgst), rs(r.cgst + r.sgst), rs(r.total)]),
        ['Total', sum.count, rs(sum.sub), rs(sum.cgst), rs(sum.sgst), rs(sum.cgst + sum.sgst), rs(sum.total)],
        [],
        ['Sales through Zomato / Swiggy (GST paid by the app, Section 9(5))'],
        ['Bills', 'Amount'],
        [delivery.count, rs(delivery.total)],
        [],
        ['Cancelled bills (not counted above)'],
        ['Bills', 'Amount'],
        [cancelled.count, rs(cancelled.total)],
        [],
        ['Invoice numbers used'],
        ['From', 'To', 'Count'],
        [invoices[0] ?? '', invoices[invoices.length - 1] ?? '', invoices.length],
        [],
        ['Check the figures with your CA before filing.'],
      ]),
    };
  }

  // daily
  const days = new Map<string, { count: number; total: number; gst: number; cash: number; upi: number; card: number; delivery: number }>();
  for (const b of paid) {
    const d = days.get(b.day) ?? { count: 0, total: 0, gst: 0, cash: 0, upi: 0, card: 0, delivery: 0 };
    d.count += 1;
    d.total += b.total;
    d.gst += b.gst;
    if (b.payment_mode === 'cash') d.cash += b.total;
    else if (b.payment_mode === 'upi') d.upi += b.total;
    else if (b.payment_mode === 'card') d.card += b.total;
    else d.delivery += b.total;
    days.set(b.day, d);
  }
  const list = [...days.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const t = list.reduce(
    (s, [, d]) => ({ count: s.count + d.count, total: s.total + d.total, gst: s.gst + d.gst, cash: s.cash + d.cash, upi: s.upi + d.upi, card: s.card + d.card, delivery: s.delivery + d.delivery }),
    { count: 0, total: 0, gst: 0, cash: 0, upi: 0, card: 0, delivery: 0 },
  );
  return {
    rows: list.length,
    csv: toCsv([
      ...header,
      ['Date', 'Bills', 'Sales', 'GST', 'Cash', 'UPI', 'Card', 'Delivery apps'],
      ...list.map(([day, d]) => [dmy(day), d.count, rs(d.total), rs(d.gst), rs(d.cash), rs(d.upi), rs(d.card), rs(d.delivery)]),
      ['Total', t.count, rs(t.total), rs(t.gst), rs(t.cash), rs(t.upi), rs(t.card), rs(t.delivery)],
    ]),
  };
}
