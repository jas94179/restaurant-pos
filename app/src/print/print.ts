// Printing. In the installed Android app with a printer chosen (Profile → Printer),
// receipts go straight to the Bluetooth thermal printer. Otherwise (Expo Go, iPhone,
// no printer chosen) the phone's print screen opens with a 57 mm page (print or PDF).
import * as Print from 'expo-print';
import type { ReceiptLine } from './receipt';
import { encodeReceipt } from './escpos';
import { bluetoothPrintingAvailable, sendToPrinter } from './bluetooth';
import { getSettings } from '../data/settingsStore';

// 57 mm paper is about 162 points wide at 72 points per inch.
const PAGE_WIDTH = 162;

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toHtml(lines: ReceiptLine[]): string {
  const body = lines
    .map((l) => {
      const style = [
        l.bold || l.big ? 'font-weight:700' : '',
        l.big ? 'font-size:13px' : '',
        l.align === 'center' ? 'text-align:center' : '',
      ]
        .filter(Boolean)
        .join(';');
      if (l.qr) return `<div style="text-align:center;margin:6px 0">[QR] ${escape(l.text)}</div>`;
      return `<div style="${style}">${escape(l.text) || '&nbsp;'}</div>`;
    })
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: 57mm auto; margin: 2mm; }
    body { margin: 0; font-family: 'Courier New', monospace; font-size: 8px; line-height: 1.35; color: #000; white-space: pre; }
  </style></head><body>${body}</body></html>`;
}

// Returns an error message to show, or null when printed (or the print screen opened).
export async function printReceipt(lines: ReceiptLine[]): Promise<string | null> {
  const { printerAddress } = getSettings();
  if (bluetoothPrintingAvailable && printerAddress) {
    return sendToPrinter(printerAddress, encodeReceipt(lines));
  }
  try {
    await Print.printAsync({ html: toHtml(lines), width: PAGE_WIDTH, height: Math.max(200, lines.length * 12 + 30) });
    return null;
  } catch (e) {
    // iOS rejects when the print screen is closed without printing; that's not an error.
    const msg = e instanceof Error ? e.message : '';
    return /cancel|dismiss/i.test(msg) ? null : 'Could not open printing. Please try again.';
  }
}
