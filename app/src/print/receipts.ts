// The receipts the app prints, built line by line for 57 mm paper.
import type { DayClosing } from '../db/database';
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
