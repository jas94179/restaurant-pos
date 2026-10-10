// Plain-text receipts for the 57 mm thermal printer (about 32 characters per line).
// The same lines are used now for phone printing / PDF, and later sent straight to
// the Bluetooth printer (ESC/POS) in the custom Android build.

export const WIDTH = 32;

export type ReceiptLine = {
  text: string;
  bold?: boolean;
  big?: boolean;
  align?: 'left' | 'center';
  qr?: string; // print a QR code with this content (text is shown when QR can't print)
};

// Plain "Rs 1,234.50" (thermal printers often can't print the ₹ symbol).
export function rs(paise: number): string {
  const r = Math.abs(paise) / 100;
  const s = r.toLocaleString('en-IN', { minimumFractionDigits: r % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
  return `${paise < 0 ? '-' : ''}Rs ${s}`;
}

export class Receipt {
  lines: ReceiptLine[] = [];

  center(text: string, opts: { bold?: boolean; big?: boolean } = {}) {
    for (const part of wrap(text, opts.big ? WIDTH / 2 : WIDTH)) this.lines.push({ text: part, align: 'center', ...opts });
    return this;
  }

  // Leading spaces are kept as an indent, also on wrapped lines.
  text(text: string, bold = false) {
    const indent = text.match(/^ */)?.[0] ?? '';
    for (const part of wrap(text.slice(indent.length), WIDTH - indent.length)) this.lines.push({ text: indent + part, bold });
    return this;
  }

  // "Label ........ value" on one line; long labels wrap above the value.
  pair(label: string, value: string, bold = false) {
    const room = WIDTH - value.length - 1;
    if (label.length <= room) {
      this.lines.push({ text: label + ' '.repeat(WIDTH - label.length - value.length) + value, bold });
    } else {
      const parts = wrap(label, room);
      const last = parts.pop() ?? '';
      parts.forEach((p) => this.lines.push({ text: p, bold }));
      this.lines.push({ text: last + ' '.repeat(WIDTH - last.length - value.length) + value, bold });
    }
    return this;
  }

  qr(data: string, fallbackText: string) {
    this.lines.push({ text: fallbackText, align: 'center', qr: data });
    return this;
  }

  rule(char = '-') {
    this.lines.push({ text: char.repeat(WIDTH) });
    return this;
  }

  blank() {
    this.lines.push({ text: '' });
    return this;
  }
}

function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      if (!line) line = word;
      else if ((line + ' ' + word).length <= width) line += ' ' + word;
      else {
        out.push(line);
        line = word;
      }
      while (line.length > width) {
        out.push(line.slice(0, width));
        line = line.slice(width);
      }
    }
    out.push(line);
  }
  return out;
}
