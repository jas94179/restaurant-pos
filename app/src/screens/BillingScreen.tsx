import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CATEGORIES, GST_PERCENT, MenuItem, SAMPLE_MENU } from '../data/sampleMenu';

// Turns paise into "₹1,234.50" style text.
export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  return '₹' + rupees.toLocaleString('en-IN', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

type Cart = Record<string, number>; // item id -> quantity

export default function BillingScreen() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [token, setToken] = useState(1);
  const [lastBill, setLastBill] = useState<{ token: number; total: number } | null>(null);

  const items = SAMPLE_MENU.filter((i) => i.category === category);

  const cartLines = useMemo(
    () =>
      SAMPLE_MENU.filter((i) => cart[i.id] > 0).map((i) => ({
        item: i,
        qty: cart[i.id],
        amount: i.price * cart[i.id],
      })),
    [cart],
  );
  const itemCount = cartLines.reduce((sum, l) => sum + l.qty, 0);
  const subtotal = cartLines.reduce((sum, l) => sum + l.amount, 0);
  const gst = Math.round((subtotal * GST_PERCENT) / 100);
  const total = subtotal + gst;

  function changeQty(id: string, delta: number) {
    setLastBill(null);
    setCart((prev) => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  }

  function saveBill() {
    setLastBill({ token, total });
    setToken((t) => t + 1);
    setCart({});
    setCartOpen(false);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Counter billing</Text>
        <Text style={styles.subtitle}>Next token #{token}</Text>
      </View>

      {lastBill && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Bill saved · Token #{lastBill.token} · {formatRupees(lastBill.total)}
          </Text>
        </View>
      )}

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, c === category && styles.chipActive]}
            >
              <Text style={[styles.chipText, c === category && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <ItemTile item={item} qty={cart[item.id] ?? 0} onAdd={() => changeQty(item.id, 1)} />
        )}
      />

      {itemCount > 0 && !cartOpen && (
        <Pressable style={styles.cartBar} onPress={() => setCartOpen(true)}>
          <Text style={styles.cartBarText}>
            {itemCount} item{itemCount > 1 ? 's' : ''} · {formatRupees(total)}
          </Text>
          <Text style={styles.cartBarText}>View bill ›</Text>
        </Pressable>
      )}

      {cartOpen && (
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Bill · Token #{token}</Text>
            <Pressable onPress={() => setCartOpen(false)} hitSlop={12}>
              <Text style={styles.link}>Add more</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.lines}>
            {cartLines.map(({ item, qty, amount }) => (
              <View key={item.id} style={styles.line}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineName}>{item.name}</Text>
                  <Text style={styles.muted}>{formatRupees(item.price)} each</Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepBtn} onPress={() => changeQty(item.id, -1)}>
                    <Text style={styles.stepText}>−</Text>
                  </Pressable>
                  <Text style={styles.qty}>{qty}</Text>
                  <Pressable style={styles.stepBtn} onPress={() => changeQty(item.id, 1)}>
                    <Text style={styles.stepText}>+</Text>
                  </Pressable>
                </View>
                <Text style={styles.amount}>{formatRupees(amount)}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.totals}>
            <TotalRow label="Subtotal" value={formatRupees(subtotal)} />
            <TotalRow label={`GST ${GST_PERCENT}%`} value={formatRupees(gst)} />
            <TotalRow label="Total" value={formatRupees(total)} bold />
          </View>

          <Pressable
            style={[styles.saveBtn, itemCount === 0 && styles.saveBtnDisabled]}
            disabled={itemCount === 0}
            onPress={saveBill}
          >
            <Text style={styles.saveText}>Save bill</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ItemTile({ item, qty, onAdd }: { item: MenuItem; qty: number; onAdd: () => void }) {
  return (
    <Pressable style={[styles.tile, qty > 0 && styles.tileSelected]} onPress={onAdd}>
      <View style={styles.tileTop}>
        <View style={[styles.vegMark, { borderColor: item.veg ? '#1B8A3A' : '#B3261E' }]}>
          <View style={[styles.vegDot, { backgroundColor: item.veg ? '#1B8A3A' : '#B3261E' }]} />
        </View>
        {qty > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{qty}</Text>
          </View>
        )}
      </View>
      <Text style={styles.tileName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.tilePrice}>{formatRupees(item.price)}</Text>
    </Pressable>
  );
}

function TotalRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.totalValue, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const INK = '#1C1B1F';
const MUTED = '#6B6870';
const ACCENT = '#C2410C';
const LINE = '#E7E3DE';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF8F5', paddingTop: 52 },
  header: { paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontSize: 22, fontWeight: '700', color: INK },
  subtitle: { fontSize: 14, color: MUTED },
  banner: { marginHorizontal: 16, marginBottom: 8, padding: 10, borderRadius: 8, backgroundColor: '#E6F4EA' },
  bannerText: { color: '#14532D', fontWeight: '600' },
  chips: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: LINE, backgroundColor: '#fff' },
  chipActive: { backgroundColor: INK, borderColor: INK },
  chipText: { color: INK, fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  grid: { padding: 12, paddingBottom: 100 },
  row: { gap: 12 },
  tile: { flex: 1, minHeight: 104, marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: LINE },
  tileSelected: { borderColor: ACCENT, borderWidth: 2 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  vegMark: { width: 14, height: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  badge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontWeight: '700' },
  tileName: { fontSize: 15, fontWeight: '600', color: INK },
  tilePrice: { marginTop: 4, fontSize: 14, color: MUTED },
  cartBar: { position: 'absolute', left: 12, right: 12, bottom: 24, padding: 16, borderRadius: 12, backgroundColor: ACCENT, flexDirection: 'row', justifyContent: 'space-between' },
  cartBarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '80%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 32, borderTopWidth: 1, borderColor: LINE },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: INK },
  link: { color: ACCENT, fontWeight: '600', fontSize: 15 },
  lines: { flexGrow: 0 },
  line: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: LINE, gap: 10 },
  lineName: { fontSize: 15, color: INK, fontWeight: '500' },
  muted: { fontSize: 12, color: MUTED },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, color: INK },
  qty: { minWidth: 20, textAlign: 'center', fontSize: 15, fontWeight: '600' },
  amount: { width: 72, textAlign: 'right', fontSize: 15, color: INK },
  totals: { paddingVertical: 10, gap: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15, color: MUTED },
  totalValue: { fontSize: 15, color: INK },
  bold: { fontWeight: '700', color: INK, fontSize: 17 },
  saveBtn: { marginTop: 8, padding: 16, borderRadius: 12, backgroundColor: INK, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
