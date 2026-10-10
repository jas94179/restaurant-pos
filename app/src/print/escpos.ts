// ESC/POS: the command language of small thermal receipt printers.
// Turns our receipt lines into the bytes the printer understands.
import type { ReceiptLine } from './receipt';

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

// Thermal printers print plain ASCII reliably; swap common symbols for safe ones.
function toAscii(s: string): number[] {
  const clean = s
    .replace(/₹/g, 'Rs ')
    .replace(/[·•]/g, '-')
    .replace(/[–—−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/×/g, 'x')
    .replace(/…/g, '...');
  const out: number[] = [];
  for (const ch of clean) {
    const c = ch.charCodeAt(0);
    out.push(c >= 32 && c < 127 ? c : 0x3f); // unknown → '?'
  }
  return out;
}

function qrBytes(data: string): number[] {
  const payload = toAscii(data);
  const len = payload.length + 3;
  const pL = len % 256;
  const pH = Math.floor(len / 256);
  return [
    GS, 0x28, 0x6b, 4, 0, 0x31, 0x41, 0x32, 0x00, // model 2
    GS, 0x28, 0x6b, 3, 0, 0x31, 0x43, 0x06, // module size 6
    GS, 0x28, 0x6b, 3, 0, 0x31, 0x45, 0x31, // error correction M
    GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...payload, // store data
    GS, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30, // print
  ];
}

export function encodeReceipt(lines: ReceiptLine[]): Uint8Array {
  const out: number[] = [ESC, 0x40]; // reset
  for (const l of lines) {
    out.push(ESC, 0x61, l.align === 'center' || l.qr ? 1 : 0); // alignment
    if (l.qr) {
      out.push(...qrBytes(l.qr), LF);
      if (l.text) out.push(...toAscii(l.text), LF);
      continue;
    }
    out.push(ESC, 0x45, l.bold || l.big ? 1 : 0); // bold
    out.push(GS, 0x21, l.big ? 0x11 : 0x00); // double width + height for big
    out.push(...toAscii(l.text), LF);
  }
  out.push(GS, 0x21, 0, ESC, 0x45, 0, ESC, 0x61, 0); // back to normal
  out.push(ESC, 0x64, 3); // feed 3 lines so the slip can be torn off
  return new Uint8Array(out);
}
