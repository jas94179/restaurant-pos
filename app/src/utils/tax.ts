// GST for a bill. Prices can be entered with GST already included (common for counters)
// or without (GST is added on top). All amounts are in paise.
export type TaxSettings = { gstRate: number; pricesIncludeGst: boolean };

export type Totals = {
  subtotal: number; // taxable value, before GST
  gst: number;
  total: number; // what the customer pays
};

export function computeTotals(itemsSum: number, { gstRate, pricesIncludeGst }: TaxSettings): Totals {
  if (gstRate <= 0) return { subtotal: itemsSum, gst: 0, total: itemsSum };
  if (pricesIncludeGst) {
    // Customer pays the menu price; work out the GST hidden inside it.
    const gst = Math.round((itemsSum * gstRate) / (100 + gstRate));
    return { subtotal: itemsSum - gst, gst, total: itemsSum };
  }
  const gst = Math.round((itemsSum * gstRate) / 100);
  return { subtotal: itemsSum, gst, total: itemsSum + gst };
}

// Rates a restaurant can choose. Confirm the right one with your CA.
export const GST_RATES = [
  { rate: 0, label: 'No GST' },
  { rate: 5, label: '5%' },
  { rate: 18, label: '18%' },
];
