// Turns a saved bill into a neat plain-text message for WhatsApp.
import { BillDetail, modeLabel } from '../db/database';
import { formatRupees } from './money';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function billText(bill: BillDetail, restaurant: { name: string; gstin: string }): string {
  const d = new Date(bill.created_at);
  const h = d.getHours();
  const when = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  const order =
    bill.table_no != null
      ? `Table ${bill.table_no}`
      : bill.order_type === 'delivery'
        ? `${modeLabel(bill.payment_mode)} order ${bill.platform_order_id ?? ''}`
        : 'Takeaway';

  const lines: string[] = [];
  lines.push(`*${restaurant.name}*`);
  if (restaurant.gstin) lines.push(`GSTIN ${restaurant.gstin}`);
  lines.push('');
  lines.push(`Bill #${bill.token}  |  ${when}`);
  lines.push(order);
  lines.push('');
  for (const it of bill.items) {
    lines.push(`${it.qty} x ${it.name}  ${formatRupees(it.amount)}`);
  }
  lines.push('');
  if (bill.gst > 0) {
    const half = Math.floor(bill.gst / 2);
    lines.push(`Taxable value  ${formatRupees(bill.subtotal)}`);
    lines.push(`CGST ${bill.gst_rate / 2}%  ${formatRupees(half)}`);
    lines.push(`SGST ${bill.gst_rate / 2}%  ${formatRupees(bill.gst - half)}`);
  }
  lines.push(`*Total  ${formatRupees(bill.total)}*`);
  lines.push(`Paid by ${modeLabel(bill.payment_mode)}`);
  lines.push('');
  lines.push('Thank you for visiting!');
  return lines.join('\n');
}
