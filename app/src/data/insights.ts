// Owner insights, worked out on the phone with plain arithmetic (no internet, no AI yet).
// The AI summary will later replace the sentences in `summary`, using these same numbers.
import { BillRow, dayKey, getBillsInRange, getTopItems, ItemTotal, PaymentMode } from '../db/database';
import { formatRupees } from '../utils/money';

export type Period = 'today' | 'week' | 'month';
export const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: '7 days' },
  { key: 'month', label: '30 days' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function hourLabel(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12} ${ampm}`;
}

export type Bar = { key: string; label: string; value: number; bills: number; detail: string };

export type Insights = {
  period: Period;
  totalSales: number;
  billCount: number;
  avgBill: number;
  gst: number;
  changePct: number | null; // vs previous comparable period
  changeLabel: string; // e.g. "vs last Friday"
  bars: Bar[];
  barsTitle: string;
  topItems: ItemTotal[];
  byMode: Record<PaymentMode, number>;
  byType: { dineIn: number; takeaway: number };
  summary: string[];
  bills: BillRow[];
};

function totals(bills: BillRow[]) {
  let sales = 0;
  let gst = 0;
  for (const b of bills) {
    sales += b.total;
    gst += b.gst;
  }
  return { sales, gst };
}

export function buildInsights(period: Period, now: Date = new Date()): Insights {
  const length = period === 'today' ? 1 : period === 'week' ? 7 : 30;
  const from = addDays(now, -(length - 1));
  // Today is compared with the same weekday last week (a fairer comparison than yesterday).
  const prevTo = period === 'today' ? addDays(now, -7) : addDays(from, -1);
  const prevFrom = period === 'today' ? prevTo : addDays(prevTo, -(length - 1));

  const bills = getBillsInRange(dayKey(from), dayKey(now));
  const prevBills = getBillsInRange(dayKey(prevFrom), dayKey(prevTo));
  const { sales, gst } = totals(bills);
  const prevSales = totals(prevBills).sales;
  const changePct = prevSales > 0 ? Math.round(((sales - prevSales) / prevSales) * 100) : null;
  const changeLabel =
    period === 'today' ? `vs last ${DAY_NAMES[now.getDay()]}` : period === 'week' ? 'vs previous 7 days' : 'vs previous 30 days';

  // Chart: by hour for today, by day otherwise.
  let bars: Bar[];
  if (period === 'today') {
    const byHour = Array.from({ length: 24 }, () => ({ value: 0, bills: 0 }));
    for (const b of bills) {
      const h = new Date(b.created_at).getHours();
      byHour[h].value += b.total;
      byHour[h].bills += 1;
    }
    const active = byHour.map((v, h) => (v.bills ? h : -1)).filter((h) => h >= 0);
    const start = Math.min(8, ...active);
    const end = Math.max(22, ...active);
    bars = [];
    for (let h = start; h <= end; h++) {
      bars.push({
        key: String(h),
        label: hourLabel(h),
        value: byHour[h].value,
        bills: byHour[h].bills,
        detail: `${hourLabel(h)} to ${hourLabel((h + 1) % 24)}`,
      });
    }
  } else {
    const byDay: Record<string, { value: number; bills: number }> = {};
    for (const b of bills) {
      byDay[b.day] ??= { value: 0, bills: 0 };
      byDay[b.day].value += b.total;
      byDay[b.day].bills += 1;
    }
    bars = [];
    for (let i = 0; i < length; i++) {
      const d = addDays(from, i);
      const k = dayKey(d);
      bars.push({
        key: k,
        label: period === 'week' ? SHORT_DAYS[d.getDay()] : String(d.getDate()),
        value: byDay[k]?.value ?? 0,
        bills: byDay[k]?.bills ?? 0,
        detail: `${SHORT_DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`,
      });
    }
  }

  const topItems = getTopItems(dayKey(from), dayKey(now), 5);
  const byMode: Record<PaymentMode, number> = { cash: 0, upi: 0, card: 0 };
  const byType = { dineIn: 0, takeaway: 0 };
  for (const b of bills) {
    byMode[b.payment_mode] = (byMode[b.payment_mode] ?? 0) + b.total;
    if (b.order_type === 'dine_in') byType.dineIn += b.total;
    else byType.takeaway += b.total;
  }

  // Plain-language summary sentences.
  const summary: string[] = [];
  if (bills.length === 0) {
    summary.push('No bills yet for this period. Your insights will appear here as you bill.');
  } else {
    if (changePct != null) {
      if (changePct > 0) summary.push(`Sales are up ${changePct}% ${changeLabel}.`);
      else if (changePct < 0) summary.push(`Sales are down ${Math.abs(changePct)}% ${changeLabel}.`);
      else summary.push(`Sales are the same ${changeLabel}.`);
    }
    const peak = bars.reduce((a, b) => (b.value > a.value ? b : a), bars[0]);
    if (peak && peak.value > 0) {
      summary.push(
        period === 'today'
          ? `Your busiest hour was ${peak.detail} (${formatRupees(peak.value)}).`
          : `Your best day was ${peak.detail} (${formatRupees(peak.value)}).`,
      );
    }
    if (topItems[0]) summary.push(`${topItems[0].name} sold the most: ${topItems[0].qty} sold.`);
    if (byType.dineIn > 0 && byType.takeaway > 0) {
      const share = Math.round((byType.takeaway / sales) * 100);
      summary.push(`Takeaway brought in ${share}% of sales.`);
    }
  }

  return {
    period,
    totalSales: sales,
    billCount: bills.length,
    avgBill: bills.length ? Math.round(sales / bills.length) : 0,
    gst,
    changePct,
    changeLabel,
    bars,
    barsTitle: period === 'today' ? 'Sales by hour' : 'Sales by day',
    topItems,
    byMode,
    byType,
    summary,
    bills: period === 'today' ? bills : [],
  };
}

