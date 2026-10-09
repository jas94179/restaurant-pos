import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GST_PERCENT } from '../data/sampleMenu';
import { reloadMenu, useMenu } from '../data/menuStore';
import { useSettings } from '../data/settingsStore';
import {
  Cart,
  getNextToken,
  getTableCart,
  DbMenuItem,
  PaymentMode,
  PAYMENT_MODES,
  saveBill as saveBillToDb,
  saveTableCart,
  setItemAvailable,
} from '../db/database';
import { formatRupees } from '../utils/money';
import { colors, fonts } from '../theme';

type Props = {
  tableNo: number | null; // null = takeaway / counter
  onBackToTables: () => void;
  onTableSettled: () => void;
};

export default function BillingScreen({ tableNo, onBackToTables, onTableSettled }: Props) {
  const menu = useMenu();
  const settings = useSettings();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  // Fall back to the first category (also when the chosen one was deleted).
  const category =
    menu.categories.find((c) => c.id === categoryId)?.id ?? menu.categories[0]?.id ?? null;
  const [search, setSearch] = useState('');
  // Takeaway cart lives in memory; each table's cart is saved on the phone.
  const [takeawayCart, setTakeawayCart] = useState<Cart>({});
  const [tableCart, setTableCart] = useState<Cart>({});
  const isTable = tableNo != null;
  const cart = isTable ? tableCart : takeawayCart;

  useEffect(() => {
    if (tableNo != null) setTableCart(getTableCart(tableNo));
    setCartOpen(false);
    setError(null);
  }, [tableNo]);

  const [cartOpen, setCartOpen] = useState(false);
  const [token, setToken] = useState(() => getNextToken());
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [lastBill, setLastBill] = useState<{ token: number; total: number; mode: string; tableNo: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // When something is typed, search across every category; otherwise show the chosen category.
  const query = search.trim().toLowerCase();
  const visibleItems = menu.items.filter((i) => !i.archived);
  const items = query
    ? visibleItems.filter((i) => i.name.toLowerCase().includes(query))
    : visibleItems.filter((i) => i.categoryId === category);

  const cartLines = useMemo(
    () =>
      (Object.entries(cart) as [string, number][])
        .filter(([id, qty]) => qty > 0 && menu.byId[id])
        .map(([id, qty]) => {
          const item = menu.byId[id];
          return { item, qty, amount: item.price * qty };
        }),
    [cart, menu],
  );
  const itemCount = cartLines.reduce((sum, l) => sum + l.qty, 0);
  const subtotal = cartLines.reduce((sum, l) => sum + l.amount, 0);
  const gst = Math.round((subtotal * GST_PERCENT) / 100);
  const total = subtotal + gst;

  function changeQty(id: string, delta: number) {
    setLastBill(null);
    const next = { ...cart, [id]: Math.max(0, (cart[id] ?? 0) + delta) };
    if (next[id] === 0) delete next[id];
    if (tableNo != null) {
      setTableCart(next);
      saveTableCart(tableNo, next); // saved instantly, survives closing the app
    } else {
      setTakeawayCart(next);
    }
  }

  // Long-press shortcut so staff can mark a dish out of stock without leaving billing.
  function toggleStock(item: DbMenuItem) {
    const goingOut = item.available;
    Alert.alert(
      item.name,
      goingOut ? 'Mark as out of stock? Staff will not be able to add it.' : 'Mark as available again?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: goingOut ? 'Out of stock' : 'Available',
          style: goingOut ? 'destructive' : 'default',
          onPress: () => {
            setItemAvailable(item.id, !goingOut);
            reloadMenu();
          },
        },
      ],
    );
  }

  function saveBill() {
    if (itemCount === 0) return;
    try {
      const saved = saveBillToDb({
        orderType: isTable ? 'dine_in' : 'takeaway',
        tableNo: tableNo ?? undefined,
        paymentMode,
        subtotal,
        gst,
        total,
        lines: cartLines.map(({ item, qty, amount }) => ({
          itemId: item.id,
          name: item.name,
          price: item.price,
          qty,
          amount,
        })),
      });
      const modeLabel = PAYMENT_MODES.find((m) => m.key === paymentMode)?.label ?? '';
      setLastBill({ token: saved.token, total, mode: modeLabel, tableNo });
      setToken(getNextToken());
      setPaymentMode('cash');
      setCartOpen(false);
      setError(null);
      if (isTable) {
        setTableCart({});
        onTableSettled();
      } else {
        setTakeawayCart({});
      }
    } catch (e) {
      // Keep the cart so nothing is lost; tell the cashier.
      setError('Could not save the bill. Please try again.');
    }
  }

  return (
    <View style={styles.screen}>
      {/* The screen name is in the top header; this row only adds context. */}
      <View style={styles.header}>
        {isTable ? (
          <Pressable onPress={onBackToTables} hitSlop={10} accessibilityRole="button">
            <Text style={styles.backLink}>‹ All tables</Text>
          </Pressable>
        ) : (
          <Text style={styles.subtitle}>Next token #{token}</Text>
        )}
        {isTable && <Text style={styles.subtitle}>Dine-in</Text>}
      </View>


      {lastBill && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {lastBill.tableNo != null ? `Table ${lastBill.tableNo} settled` : `Bill saved · Token #${lastBill.token}`} ·{' '}
            {formatRupees(lastBill.total)} · {lastBill.mode}
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
          {menu.categories.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setCategoryId(c.id)}
              style={[styles.chip, c.id === category && styles.chipActive]}
            >
              <Text style={[styles.chipText, c.id === category && styles.chipTextActive]}>{c.name}</Text>
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
        ListEmptyComponent={
          <Text style={styles.empty}>{query ? `No items match "${search}"` : 'No items in this category yet. Add them in More, then Menu.'}</Text>
        }
        renderItem={({ item }) => (
          <ItemTile
            item={item}
            qty={cart[item.id] ?? 0}
            onAdd={() => changeQty(item.id, 1)}
            onRemove={() => changeQty(item.id, -1)}
            onLongPress={() => toggleStock(item)}
          />
        )}
      />

      {itemCount > 0 && !cartOpen && (
        <Pressable style={styles.cartBar} onPress={() => setCartOpen(true)}>
          <Text style={styles.cartBarText}>
            {isTable ? `Table ${tableNo} · ` : ''}
            {itemCount} item{itemCount > 1 ? 's' : ''} · {formatRupees(total)}
          </Text>
          <Text style={styles.cartBarText}>{isTable ? 'Settle ›' : 'View bill ›'}</Text>
        </Pressable>
      )}

      {cartOpen && (
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{isTable ? `Table ${tableNo} · Bill` : `Bill · Token #${token}`}</Text>
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

          <Text style={styles.payLabel}>Payment</Text>
          <View style={styles.payRow}>
            {PAYMENT_MODES.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => setPaymentMode(m.key)}
                style={[styles.payBtn, paymentMode === m.key && styles.payBtnActive]}
              >
                <Text style={[styles.payText, paymentMode === m.key && styles.payTextActive]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.saveBtn, itemCount === 0 && styles.saveBtnDisabled]}
            disabled={itemCount === 0}
            onPress={saveBill}
          >
            <Text style={styles.saveText}>
              {isTable ? 'Settle table' : 'Save bill'} · {formatRupees(total)}
            </Text>
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
  onLongPress,
}: {
  item: DbMenuItem;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={450}
      accessibilityHint="Long press to change stock"
      style={[styles.tile, qty > 0 && styles.tileSelected, !item.available && styles.tileOff]}
    >
      <View style={[styles.vegMark, { borderColor: item.veg ? colors.veg : colors.danger }]}>
        <View style={[styles.vegDot, { backgroundColor: item.veg ? colors.veg : colors.danger }]} />
      </View>
      <Text style={styles.tileName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.tilePrice}>{formatRupees(item.price)}</Text>

      {!item.available && qty === 0 ? (
        <View style={styles.outBtn}>
          <Text style={styles.outText}>Out of stock</Text>
        </View>
      ) : qty === 0 ? (
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

const INK = colors.ink;
const MUTED = colors.muted;
const ACCENT = colors.brand;
const LINE = colors.line;
const TINT = '#E5EEE9'; // light curry-leaf green for selected things

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist, paddingTop: 8 },
  header: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontFamily: fonts.bold, color: INK },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: MUTED },
  banner: { marginHorizontal: 16, marginBottom: 8, padding: 10, borderRadius: 8, backgroundColor: '#E6F4EA' },
  bannerText: { color: '#14532D', fontFamily: fonts.semibold },
  backLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.brand, marginBottom: 2 },
  modeRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 8 },
  modeBtn: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: LINE, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  modeBtnActive: { backgroundColor: TINT, borderColor: ACCENT, borderWidth: 1.5 },
  modeText: { fontSize: 14, color: MUTED, fontFamily: fonts.semibold },
  modeTextActive: { color: ACCENT },
  searchBox: { marginHorizontal: 16, marginBottom: 4, paddingHorizontal: 12, height: 44, borderRadius: 10, borderWidth: 1, borderColor: LINE, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchIcon: { fontFamily: fonts.regular, fontSize: 18, color: MUTED },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: INK, paddingVertical: 0 },
  clear: { fontFamily: fonts.regular, fontSize: 16, color: MUTED },
  empty: { textAlign: 'center', color: MUTED, marginTop: 32, fontFamily: fonts.regular, fontSize: 15 },
  chips: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: LINE, backgroundColor: '#fff' },
  chipActive: { backgroundColor: INK, borderColor: INK },
  chipText: { color: INK, fontFamily: fonts.regular, fontSize: 14 },
  chipTextActive: { color: '#fff', fontFamily: fonts.semibold },
  grid: { padding: 12, paddingBottom: 100 },
  row: { gap: 12 },
  tile: { flex: 1, minHeight: 132, marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: LINE },
  tileSelected: { borderColor: ACCENT, borderWidth: 2 },
  vegMark: { width: 14, height: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  tileName: { fontSize: 15, fontFamily: fonts.semibold, color: INK },
  tilePrice: { marginTop: 4, fontFamily: fonts.regular, fontSize: 14, color: MUTED },
  tileOff: { opacity: 0.55 },
  outBtn: { marginTop: 'auto', height: 36, borderRadius: 8, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  outText: { color: MUTED, fontFamily: fonts.semibold, fontSize: 13 },
  addBtn: { marginTop: 'auto', height: 36, borderRadius: 8, borderWidth: 1.5, borderColor: ACCENT, alignItems: 'center', justifyContent: 'center', backgroundColor: TINT },
  addText: { color: ACCENT, fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.5 },
  tileStepper: { marginTop: 'auto', height: 36, borderRadius: 8, backgroundColor: ACCENT, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileStepBtn: { width: 40, height: 36, alignItems: 'center', justifyContent: 'center' },
  tileStepText: { color: '#fff', fontSize: 20, fontFamily: fonts.bold },
  tileQty: { color: '#fff', fontSize: 16, fontFamily: fonts.bold },
  cartBar: { position: 'absolute', left: 12, right: 12, bottom: 24, padding: 16, borderRadius: 12, backgroundColor: ACCENT, flexDirection: 'row', justifyContent: 'space-between' },
  cartBarText: { color: '#fff', fontSize: 16, fontFamily: fonts.bold },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '80%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 32, borderTopWidth: 1, borderColor: LINE },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontFamily: fonts.bold, color: INK },
  link: { color: ACCENT, fontFamily: fonts.semibold, fontSize: 15 },
  lines: { flexGrow: 0 },
  line: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: LINE, gap: 10 },
  lineName: { fontSize: 15, color: INK, fontFamily: fonts.semibold },
  muted: { fontFamily: fonts.regular, fontSize: 12, color: MUTED },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: fonts.regular, fontSize: 18, color: INK },
  qty: { minWidth: 20, textAlign: 'center', fontSize: 15, fontFamily: fonts.semibold },
  amount: { width: 72, textAlign: 'right', fontFamily: fonts.regular, fontSize: 15, color: INK },
  totals: { paddingVertical: 10, gap: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontFamily: fonts.regular, fontSize: 15, color: MUTED },
  totalValue: { fontFamily: fonts.regular, fontSize: 15, color: INK },
  bold: { fontFamily: fonts.bold, color: INK, fontSize: 17 },
  payLabel: { fontFamily: fonts.regular, fontSize: 13, color: MUTED, marginTop: 4, marginBottom: 6 },
  payRow: { flexDirection: 'row', gap: 8 },
  payBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  payBtnActive: { backgroundColor: INK, borderColor: INK },
  payText: { fontSize: 15, color: INK, fontFamily: fonts.semibold },
  payTextActive: { color: '#fff' },
  error: { color: colors.danger, marginTop: 8 },
  saveBtn: { marginTop: 8, padding: 16, borderRadius: 12, backgroundColor: INK, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { color: '#fff', fontSize: 16, fontFamily: fonts.bold },
});
