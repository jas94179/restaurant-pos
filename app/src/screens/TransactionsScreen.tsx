import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { BillDetail, BillListRow, dayKey, getBillDetail, getBillList, modeLabel as labelForMode } from '../db/database';
import { useSettings } from '../data/settingsStore';
import { can, useCurrentUser } from '../data/staffStore';
import { formatRupees } from '../utils/money';
import { billText } from '../utils/billText';
import BottomSheet from '../components/BottomSheet';
import { printReceipt } from '../print/print';
import { billReceipt } from '../print/receipts';
import WhatsAppShareSheet from '../components/WhatsAppShareSheet';
import CancelBillSheet from '../components/CancelBillSheet';
import { colors, fonts } from '../theme';

type Range = 'today' | 'yesterday' | 'week' | 'month';
const RANGES: { key: Range; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: '7 days' },
  { key: 'month', label: '30 days' },
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function rangeDays(r: Range): [string, string] {
  if (r === 'today') return [dayKey(), dayKey()];
  if (r === 'yesterday') return [dayKey(daysAgo(1)), dayKey(daysAgo(1))];
  if (r === 'week') return [dayKey(daysAgo(6)), dayKey()];
  return [dayKey(daysAgo(29)), dayKey()];
}

function dayTitle(day: string): string {
  if (day === dayKey()) return 'Today';
  if (day === dayKey(daysAgo(1))) return 'Yesterday';
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAYS[date.getDay()]}, ${d} ${MONTHS[m - 1]}`;
}

function time(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const modeLabel = labelForMode;

function typeLabel(b: { order_type: string; table_no: number | null; payment_mode: string; platform_order_id: string | null }): string {
  if (b.table_no != null) return `Table ${b.table_no}`;
  if (b.order_type === 'delivery') return `${modeLabel(b.payment_mode)} #${b.platform_order_id ?? ''}`;
  return 'Takeaway';
}

// Every saved bill, newest first, grouped by day. Tap a bill to see its items.
export default function TransactionsScreen({ visible }: { visible: boolean }) {
  const user = useCurrentUser();
  const allDays = can(user, 'billsAllDays');
  const [range, setRange] = useState<Range>('today');
  const [query, setQuery] = useState('');
  const [bills, setBills] = useState<BillListRow[]>([]);
  const [openBill, setOpenBill] = useState<BillDetail | null>(null);

  const load = useCallback(() => {
    const [from, to] = rangeDays(range);
    setBills(getBillList(from, to));
  }, [range]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  // Search by token number ("23"), table ("t4" or "table 4"), or payment mode ("upi").
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace('#', '');
    if (!q) return bills;
    return bills.filter((b) => {
      if (String(b.token) === q) return true;
      const table = q.match(/^(?:t|table)\s*(\d+)$/);
      if (table) return b.table_no === Number(table[1]);
      return (
        typeLabel(b).toLowerCase().includes(q) ||
        modeLabel(b.payment_mode).toLowerCase().includes(q) ||
        (b.platform_order_id ?? '').toLowerCase().includes(q) ||
        (b.invoice_no ?? '').toLowerCase().includes(q)
      );
    });
  }, [bills, query]);

  const sections = useMemo(() => {
    const byDay: Record<string, BillListRow[]> = {};
    for (const b of filtered) (byDay[b.day] ??= []).push(b);
    return Object.keys(byDay)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((day) => ({
        title: dayTitle(day),
        total: byDay[day].reduce((s, b) => s + (b.status === 'cancelled' ? 0 : b.total), 0),
        data: byDay[day],
      }));
  }, [filtered]);

  const paidBills = filtered.filter((b) => b.status !== 'cancelled');
  const total = paidBills.reduce((s, b) => s + b.total, 0);
  const cancelledCount = filtered.length - paidBills.length;

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.subtitle}>
          {paidBills.length} bill{paidBills.length === 1 ? '' : 's'}, {formatRupees(total)}
          {cancelledCount > 0 ? `, ${cancelledCount} cancelled` : ''}
        </Text>

        {!allDays && <Text style={styles.onlyToday}>Showing today's bills.</Text>}
        {allDays && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ranges}>
          {RANGES.map((r) => (
            <Pressable
              key={r.key}
              onPress={() => setRange(r.key)}
              style={[styles.rangeBtn, range === r.key && styles.rangeBtnActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: range === r.key }}
            >
              <Text style={[styles.rangeText, range === r.key && styles.rangeTextActive]}>{r.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        )}

        <View style={styles.searchBox}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search token, invoice, table (T4) or UPI"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={12} accessibilityLabel="Clear search">
              <Text style={styles.clear}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionTotal}>{formatRupees(section.total)}</Text>
          </View>
        )}
        renderItem={({ item: b }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.mist }]}
            onPress={() => setOpenBill(getBillDetail(b.id))}
            accessibilityRole="button"
            accessibilityLabel={`Bill ${b.token}, ${typeLabel(b)}, ${formatRupees(b.total)}`}
          >
            <View style={styles.tokenBox}>
              <Text style={styles.tokenText}>#{b.token}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowMain}>{typeLabel(b)}</Text>
              <Text style={styles.rowSub}>
                {time(b.created_at)}, {b.item_count} item{b.item_count === 1 ? '' : 's'}, {modeLabel(b.payment_mode)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.rowTotal, b.status === 'cancelled' && styles.struck]}>{formatRupees(b.total)}</Text>
              {b.status === 'cancelled' && <Text style={styles.cancelTag}>Cancelled</Text>}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query ? 'No bills match your search.' : 'No bills in this period. Saved bills will show up here.'}
          </Text>
        }
      />

      {openBill && (
        <BillSheet
          bill={openBill}
          onClose={() => setOpenBill(null)}
          onChanged={() => {
            load();
            setOpenBill(getBillDetail(openBill.id));
          }}
        />
      )}
    </View>
  );
}

// Looks like the printed bill, so staff can read it out to a customer.
function BillSheet({ bill, onClose, onChanged }: { bill: BillDetail; onClose: () => void; onChanged: () => void }) {
  const settings = useSettings();
  const [shareText, setShareText] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const cancelled = bill.status === 'cancelled';
  const d = new Date(bill.created_at);

  return (
    <BottomSheet onClose={onClose} background={colors.mist}>
        <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
          {cancelled && (
            <View style={styles.cancelBanner}>
              <Text style={styles.cancelBannerTitle}>Cancelled</Text>
              <Text style={styles.cancelBannerText}>
                {bill.cancel_reason}. Approved by {bill.cancelled_by}
                {bill.cancelled_at ? `, ${time(bill.cancelled_at)}` : ''}. Not counted in sales.
              </Text>
            </View>
          )}
          <View style={[styles.receipt, cancelled && { opacity: 0.6 }]}>
            <Text style={styles.rName}>{settings.restaurantName}</Text>
            {!!settings.gstin && <Text style={styles.rMeta}>GSTIN {settings.gstin}</Text>}

            <View style={styles.rDivider} />

            {bill.invoice_no ? (
              <View style={styles.rRow}>
                <Text style={styles.rLabel}>Invoice</Text>
                <Text style={styles.rValueStrong}>{bill.invoice_no}</Text>
              </View>
            ) : null}
            <View style={styles.rRow}>
              <Text style={styles.rLabel}>Token</Text>
              <Text style={styles.rValue}>#{bill.token}</Text>
            </View>
            <View style={styles.rRow}>
              <Text style={styles.rLabel}>Date</Text>
              <Text style={styles.rValue}>
                {d.getDate()} {MONTHS[d.getMonth()]} {d.getFullYear()}, {time(bill.created_at)}
              </Text>
            </View>
            <View style={styles.rRow}>
              <Text style={styles.rLabel}>Order</Text>
              <Text style={styles.rValue}>{typeLabel(bill)}</Text>
            </View>
            <View style={styles.rRow}>
              <Text style={styles.rLabel}>Paid by</Text>
              <Text style={styles.rValue}>{modeLabel(bill.payment_mode)}</Text>
            </View>
            {!!bill.staff_name && (
              <View style={styles.rRow}>
                <Text style={styles.rLabel}>Billed by</Text>
                <Text style={styles.rValue}>{bill.staff_name}</Text>
              </View>
            )}

            <View style={styles.rDivider} />

            {bill.items.map((it, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemQty}>{it.qty} ×</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{it.name}</Text>
                  <Text style={styles.itemPrice}>{formatRupees(it.price)} each</Text>
                </View>
                <Text style={styles.itemAmount}>{formatRupees(it.amount)}</Text>
              </View>
            ))}

            <View style={styles.rDivider} />

            {bill.discount > 0 && (
              <>
                <View style={styles.rRow}>
                  <Text style={styles.rLabel}>Items total</Text>
                  <Text style={styles.rValue}>{formatRupees(bill.items.reduce((sum, i) => sum + i.amount, 0))}</Text>
                </View>
                <View style={styles.rRow}>
                  <Text style={styles.rLabel}>
                    Discount{bill.discount_reason ? ` · ${bill.discount_reason}` : ''}
                    {bill.discount_by ? ` (by ${bill.discount_by})` : ''}
                  </Text>
                  <Text style={styles.rValue}>− {formatRupees(bill.discount)}</Text>
                </View>
              </>
            )}

            {bill.gst > 0 && (
              <>
                <View style={styles.rRow}>
                  <Text style={styles.rLabel}>Taxable value</Text>
                  <Text style={styles.rValue}>{formatRupees(bill.subtotal)}</Text>
                </View>
                <View style={styles.rRow}>
                  <Text style={styles.rLabel}>CGST {bill.gst_rate / 2}%</Text>
                  <Text style={styles.rValue}>{formatRupees(Math.floor(bill.gst / 2))}</Text>
                </View>
                <View style={styles.rRow}>
                  <Text style={styles.rLabel}>SGST {bill.gst_rate / 2}%</Text>
                  <Text style={styles.rValue}>{formatRupees(bill.gst - Math.floor(bill.gst / 2))}</Text>
                </View>
              </>
            )}
            <View style={[styles.rRow, { marginTop: 6 }]}>
              <Text style={styles.rTotalLabel}>Total</Text>
              <Text style={styles.rTotal}>{formatRupees(bill.total)}</Text>
            </View>
          </View>

          {!cancelled && (
            <Pressable
              style={styles.waBtn}
              onPress={() => setShareText(billText(bill, { name: settings.restaurantName, gstin: settings.gstin }))}
              accessibilityRole="button"
            >
              <Text style={styles.waText}>Send on WhatsApp</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.closeBtn}
            onPress={async () => {
              const err = await printReceipt(billReceipt({ name: settings.restaurantName, gstin: settings.gstin }, bill));
              if (err) Alert.alert('Print', err);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.closeText}>Print bill</Text>
          </Pressable>
          <Pressable style={styles.closeBtn} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
          {!cancelled && (
            <Pressable style={styles.cancelLink} onPress={() => setCancelOpen(true)} accessibilityRole="button">
              <Text style={styles.cancelLinkText}>Cancel this bill</Text>
            </Pressable>
          )}
        </ScrollView>
      {shareText && <WhatsAppShareSheet message={shareText} onClose={() => setShareText(null)} />}
      {cancelOpen && (
        <CancelBillSheet
          billId={bill.id}
          token={bill.token}
          total={bill.total}
          onClose={() => setCancelOpen(false)}
          onDone={() => {
            setCancelOpen(false);
            onChanged();
          }}
        />
      )}
    </BottomSheet>
  );
}

const TINT = '#E5EEE9';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  top: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 2 },
  ranges: { gap: 8, paddingVertical: 12 },
  rangeBtn: { paddingHorizontal: 16, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.paper, justifyContent: 'center' },
  rangeBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  rangeText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  rangeTextActive: { color: colors.paper },
  onlyToday: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 8, marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.paper, paddingHorizontal: 14, marginBottom: 4 },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, paddingVertical: 0 },
  clear: { fontSize: 16, color: colors.muted },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 18, paddingBottom: 8 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  sectionTotal: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: colors.paper, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.line },
  tokenBox: { minWidth: 48, height: 40, borderRadius: 10, backgroundColor: TINT, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  tokenText: { fontFamily: fonts.bold, fontSize: 15, color: colors.brand },
  rowMain: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  rowSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  rowTotal: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,42,31,0.45)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '88%', backgroundColor: colors.mist, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingBottom: 28 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginTop: 10, marginBottom: 14 },
  receipt: { backgroundColor: colors.paper, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.line },
  rName: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink, textAlign: 'center' },
  rMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 2 },
  rDivider: { borderBottomWidth: 1, borderStyle: 'dashed', borderColor: colors.line, marginVertical: 12 },
  rRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  rValue: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  rValueStrong: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  itemQty: { width: 34, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  itemName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  itemPrice: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 1 },
  itemAmount: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  rTotalLabel: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  rTotal: { fontFamily: fonts.bold, fontSize: 20, color: colors.brand },
  struck: { textDecorationLine: 'line-through', color: colors.muted },
  cancelTag: { fontFamily: fonts.semibold, fontSize: 11, color: colors.danger, marginTop: 2 },
  cancelBanner: { padding: 14, borderRadius: 14, backgroundColor: '#FCEBEA', marginBottom: 10 },
  cancelBannerTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.danger },
  cancelBannerText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.ink, marginTop: 2 },
  cancelLink: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  cancelLinkText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.danger },
  waBtn: { height: 52, borderRadius: 14, backgroundColor: '#1F8F4E', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  waText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
  closeBtn: { height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  closeText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
});
