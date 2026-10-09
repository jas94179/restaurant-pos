import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { getMenu } from '../data/menuStore';
import { getSettings } from '../data/settingsStore';
import { computeTotals } from '../utils/tax';
import { getOpenTables, OpenTable } from '../db/database';
import { formatRupees } from '../utils/money';
import { useSettings } from '../data/settingsStore';
import { colors, fonts } from '../theme';

function tableTotals(t: OpenTable) {
  let items = 0;
  let subtotal = 0;
  for (const [id, qty] of Object.entries(t.cart)) {
    const item = getMenu().byId[id];
    if (!item) continue;
    items += qty;
    subtotal += item.price * qty;
  }
  const { total } = computeTotals(subtotal, getSettings());
  return { items, total };
}

function minutesSince(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

type Props = {
  visible: boolean;
  activeTable: number | null;
  onOpenTable: (tableNo: number) => void;
};

export default function TablesScreen({ visible, activeTable, onOpenTable }: Props) {
  const { tableCount: TABLE_COUNT } = useSettings();
  const [open, setOpen] = useState<Record<number, OpenTable>>(() => getOpenTables());
  const refresh = useCallback(() => setOpen(getOpenTables()), []);

  // Reload whenever this tab is shown, so totals are always current.
  useEffect(() => {
    if (visible) refresh();
  }, [visible, refresh]);

  const tables = Array.from({ length: TABLE_COUNT }, (_, i) => i + 1);
  const busyCount = tables.filter((n) => open[n]).length;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          {busyCount} occupied · {TABLE_COUNT - busyCount} free
        </Text>
      </View>

      <FlatList
        data={tables}
        keyExtractor={(n) => String(n)}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item: n }) => {
          const t = open[n];
          const busy = !!t;
          const info = t ? tableTotals(t) : null;
          return (
            <Pressable
              style={[styles.table, busy && styles.tableBusy, activeTable === n && styles.tableActive]}
              onPress={() => onOpenTable(n)}
            >
              <Text style={[styles.tableNo, busy && styles.tableNoBusy]}>T{n}</Text>
              {busy && info ? (
                <>
                  <Text style={styles.tableAmount}>{formatRupees(info.total)}</Text>
                  <Text style={styles.tableSub}>
                    {info.items} item{info.items === 1 ? '' : 's'} · {minutesSince(t.openedAt)}
                  </Text>
                </>
              ) : (
                <Text style={styles.free}>Free</Text>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const INK = colors.ink;
const MUTED = colors.muted;
const ACCENT = colors.brand;
const LINE = colors.line;
const TINT = '#E5EEE9'; // light curry-leaf green for selected things

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist, paddingTop: 8 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontFamily: fonts.bold, color: INK },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: MUTED, marginTop: 2 },
  grid: { padding: 12, paddingBottom: 32 },
  row: { gap: 10 },
  table: { flex: 1, aspectRatio: 1, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: LINE, backgroundColor: '#fff', padding: 10, justifyContent: 'space-between' },
  tableBusy: { backgroundColor: TINT, borderColor: ACCENT },
  tableActive: { borderWidth: 2.5 },
  tableNo: { fontSize: 20, fontFamily: fonts.bold, color: INK },
  tableNoBusy: { color: ACCENT },
  free: { fontFamily: fonts.regular, fontSize: 13, color: MUTED },
  tableAmount: { fontSize: 15, fontFamily: fonts.bold, color: INK },
  tableSub: { fontFamily: fonts.regular, fontSize: 11, color: MUTED },
});
