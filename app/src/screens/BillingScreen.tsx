import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [token, setToken] = useState(1);
  const [lastBill, setLastBill] = useState<{ token: number; total: number } | null>(null);

  // When something is typed, search across every category; otherwise show the chosen category.
  const query = search.trim().toLowerCase();
  const items = query
    ? SAMPLE_MENU.filter((i) => i.name.toLowerCase().includes(query))
    : SAMPLE_MENU.filter((i) => i.category === category);

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

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search items"
          placeholderTextColor={MUTED}
          style={styles.searchInput}
          autoCorrect={false}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={12}>
            <Text style={styles.clear}>✕</Text>
          </Pressable>
        )}
      </View>

      {!query && (
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
      )}

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>No items match "{search}"</Text>}
        renderItem={({ item }) => (
          <ItemTile
            item={item}
            qty={cart[item.id] ?? 0}
            onAdd={() => changeQty(item.id, 1)}
            onRemove={() => changeQty(item.id, -1)}
          />
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

function ItemTile({
  item,
  qty,
  onAdd,
  onRemove,
}: {
  item: MenuItem;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.tile, qty > 0 && styles.tileSelected]}>
      <View style={[styles.vegMark, { borderColor: item.veg ? '#1B8A3A' : '#B3261E' }]}>
        <View style={[styles.vegDot, { backgroundColor: item.veg ? '#1B8A3A' : '#B3261E' }]} />
      </View>
      <Text style={styles.tileName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.tilePrice}>{formatRupees(item.price)}</Text>

      {qty === 0 ? (
        <Pressable style={styles.addBtn} onPress={onAdd}>
          <Text style={styles.addText}>ADD</Text>
        </Pressable>
      ) : (
        <View style={styles.tileStepper}>
          <Pressable style={styles.tileStepBtn} onPress={onRemove} hitSlop={6}>
            <Text style={styles.tileStepText}>−</Text>
          </Pressable>
          <Text style={styles.tileQty}>{qty}</Text>
          <Pressable style={styles.tileStepBtn} onPress={onAdd} hitSlop={6}>
            <Text style={styles.tileStepText}>+</Text>
          </Pressable>
        </View>
      )}
    </View>
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
  searchBox: { marginHorizontal: 16, marginBottom: 4, paddingHorizontal: 12, height: 44, borderRadius: 10, borderWidth: 1, borderColor: LINE, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchIcon: { fontSize: 18, color: MUTED },
  searchInput: { flex: 1, fontSize: 16, color: INK, paddingVertical: 0 },
  clear: { fontSize: 16, color: MUTED },
  empty: { textAlign: 'center', color: MUTED, marginTop: 32, fontSize: 15 },
  chips: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: LINE, backgroundColor: '#fff' },
  chipActive: { backgroundColor: INK, borderColor: INK },
  chipText: { color: INK, fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  grid: { padding: 12, paddingBottom: 100 },
  row: { gap: 12 },
  tile: { flex: 1, minHeight: 132, marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: LINE },
  tileSelected: { borderColor: ACCENT, borderWidth: 2 },
  vegMark: { width: 14, height: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  tileName: { fontSize: 15, fontWeight: '600', color: INK },
  tilePrice: { marginTop: 4, fontSize: 14, color: MUTED },
  addBtn: { marginTop: 'auto', height: 36, borderRadius: 8, borderWidth: 1.5, borderColor: ACCENT, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF7F2' },
  addText: { color: ACCENT, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  tileStepper: { marginTop: 'auto', height: 36, borderRadius: 8, backgroundColor: ACCENT, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileStepBtn: { width: 40, height: 36, alignItems: 'center', justifyContent: 'center' },
  tileStepText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  tileQty: { color: '#fff', fontSize: 16, fontWeight: '800' },
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
