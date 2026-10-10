// Turns a saved bill into a neat plain-text message for WhatsApp.
import { BillDetail, modeLabel } from '../db/database';
import { formatRupees } from './money';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function billText(
  bill: BillDetail,
  restaurant: { name: string; gstin: string; address?: string; phone?: string; fssai?: string },
): string {
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
  if (restaurant.address) lines.push(restaurant.address);
  if (restaurant.phone) lines.push(`Ph: ${restaurant.phone}`);
  if (restaurant.gstin) lines.push(`GSTIN ${restaurant.gstin}`);
  if (restaurant.fssai) lines.push(`FSSAI Lic. No. ${restaurant.fssai}`);
  lines.push('');
  if (bill.invoice_no) lines.push(`Invoice ${bill.invoice_no}`);
  lines.push(`Token #${bill.token}  |  ${when}`);
  lines.push(order);
  lines.push('');
  for (const it of bill.items) {
    lines.push(`${it.qty} x ${it.name}  ${formatRupees(it.amount)}`);
  }
  lines.push('');
  if (bill.discount > 0) {
    lines.push(`Items total  ${formatRupees(bill.items.reduce((sum, i) => sum + i.amount, 0))}`);
    lines.push(`Discount  − ${formatRupees(bill.discount)}`);
  }
  if (bill.gst > 0) {
    const half = Math.floor(bill.gst / 2);
    lines.push(`Taxable value  ${formatRupees(bill.subtotal)}`);
    lines.push(`CGST ${bill.gst_rate / 2}%  ${formatRupees(half)}`);
    lines.push(`SGST ${bill.gst_rate / 2}%  ${formatRupees(bill.gst - half)}`);
  }
  lines.push(`*Total  ${formatRupees(bill.total)}*`);
  lines.push(`Paid by ${modeLabel(bill.payment_mode)}`);
  if (bill.order_type === 'delivery') lines.push(`GST paid by ${modeLabel(bill.payment_mode)} under Section 9(5).`);
  lines.push('');
  lines.push('Thank you for visiting!');
  return lines.join('\n');
}
