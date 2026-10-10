// FlatList grids stretch the last item to full width when a row isn't full.
// Fill the last row with invisible spacers so every tile keeps the same width.
export type Padded<T> = { pad: true; key: string } | { pad: false; value: T };

export function padGrid<T>(items: T[], columns: number): Padded<T>[] {
  const out: Padded<T>[] = items.map((value) => ({ pad: false as const, value }));
  const extra = items.length % columns === 0 ? 0 : columns - (items.length % columns);
  for (let i = 0; i < extra; i++) out.push({ pad: true, key: `__pad${i}` });
  return out;
}
