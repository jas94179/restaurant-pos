import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { dayKey, DayClosing, getDayClosing, getDaySummary, getRecentClosings, saveDayClosing } from '../db/database';
import { useSettings } from '../data/settingsStore';
import { can, useCurrentUser } from '../data/staffStore';
import { formatRupees } from '../utils/money';
import { colors, fonts } from '../theme';

// Notes and coins counted in an Indian cash drawer.
const NOTES = [500, 200, 100, 50, 20, 10];

function toPaise(text: string): number {
  const n = Number(text.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function dayLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function diffText(diff: number): string {
  if (diff === 0) return 'Cash matches';
  return diff < 0 ? `Short by ${formatRupees(-diff)}` : `Extra ${formatRupees(diff)}`;
}

export function closingMessage(restaurant: string, c: DayClosing): string {
  return [
    `*${restaurant}* – day closing, ${dayLabel(c.day)}`,
    `Bills: ${c.billCount}   Sales: ${formatRupees(c.totalSales)}`,
    `UPI: ${formatRupees(c.upiSales)}   Card: ${formatRupees(c.cardSales)}   Delivery apps: ${formatRupees(c.deliverySales)}`,
    '',
    `Cash at start: ${formatRupees(c.openingCash)}`,
    `Cash bills: ${formatRupees(c.cashSales)}`,
    `Expected in drawer: ${formatRupees(c.expectedCash)}`,
    `Counted: ${formatRupees(c.countedCash)}`,
    `*${diffText(c.difference)}*`,
    c.note ? `Note: ${c.note}` : '',
    `Closed by ${c.closedBy}`,
  ]
    .filter((l, i, a) => l !== '' || a[i - 1] !== '')
    .join('\n');
}

// Day-end cash check. Owners and managers see what should be in the drawer;
// cashiers count "blind" (they don't see the expected amount), which is the
// standard way to keep the count honest.
export default function DayCloseScreen({ onBack }: { onBack: () => void }) {
  const settings = useSettings();
  const user = useCurrentUser();
  const seesNumbers = can(user, 'seeCashDifference');
  const today = dayKey();
  const yesterday = dayKey(new Date(Date.now() - 86400000));

  const [day, setDay] = useState(today);
  const [version, setVersion] = useState(0); // bump to re-read after saving
  const existing = useMemo(() => getDayClosing(day), [day, version]);
  const summary = useMemo(() => getDaySummary(day), [day, version]);
  const history = useMemo(() => (seesNumbers ? getRecentClosings(14) : []), [seesNumbers, version]);

  const lastFloat = useMemo(() => getRecentClosings(1)[0]?.openingCash ?? 0, []);
  const [editing, setEditing] = useState(false);
  const [opening, setOpening] = useState(lastFloat ? String(lastFloat / 100) : '');
  const [counted, setCounted] = useState('');
  const [byNotes, setByNotes] = useState(false);
  const [noteCounts, setNoteCounts] = useState<Record<number, string>>({});
  const [coins, setCoins] = useState('');
  const [note, setNote] = useState('');
  const [justSaved, setJustSaved] = useState<DayClosing | null>(null);

  const notesTotal =
    NOTES.reduce((sum, n) => sum + n * 100 * (Number(noteCounts[n]) || 0), 0) + toPaise(coins);
  const countedPaise = byNotes ? notesTotal : toPaise(counted);
  const hasCount = byNotes ? notesTotal > 0 : counted.trim() !== '';
  const expected = toPaise(opening) + summary.byMode.cash.amount;
  const diff = countedPaise - expected;

  const showForm = !existing || editing;

  function save() {
    if (!hasCount || !user) return;
    const c = saveDayClosing({ day, closedBy: user.name, openingCash: toPaise(opening), countedCash: countedPaise, note });
    setJustSaved(c);
    setEditing(false);
    setCounted('');
    setNoteCounts({});
    setCoins('');
    setNote('');
    setVersion((v) => v + 1);
  }

  async function send(c: DayClosing) {
    await Share.share({ message: closingMessage(settings.restaurantName, c) });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button">
          <Text style={styles.backLink}>‹ Profile</Text>
        </Pressable>

        <View style={styles.dayRow}>
          {[today, yesterday].map((d) => (
            <Pressable
              key={d}
              onPress={() => {
                setDay(d);
                setEditing(false);
                setJustSaved(null);
              }}
              style={[styles.dayChip, day === d && styles.dayChipActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: day === d }}
            >
              <Text style={[styles.dayChipText, day === d && styles.dayChipTextActive]}>
                {d === today ? 'Today' : 'Yesterday'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.dateText}>{dayLabel(day)}</Text>

        {seesNumbers && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sales</Text>
            <Line label={`Bills`} value={String(summary.billCount)} />
            <Line label="Total sales" value={formatRupees(summary.totalSales)} strong />
            <Line label={`Cash (${summary.byMode.cash.count})`} value={formatRupees(summary.byMode.cash.amount)} />
            <Line label={`UPI (${summary.byMode.upi.count})`} value={formatRupees(summary.byMode.upi.amount)} />
            <Line label={`Card (${summary.byMode.card.count})`} value={formatRupees(summary.byMode.card.amount)} />
            <Line
              label={`Zomato and Swiggy (${summary.byMode.zomato.count + summary.byMode.swiggy.count})`}
              value={formatRupees(summary.byMode.zomato.amount + summary.byMode.swiggy.amount)}
            />
          </View>
        )}

        {justSaved && (
          <View style={styles.savedBox}>
            <Text style={styles.savedTitle}>Day closed</Text>
            <Text style={styles.savedText}>
              {seesNumbers
                ? `${diffText(justSaved.difference)}. Counted ${formatRupees(justSaved.countedCash)}.`
                : `Saved. You counted ${formatRupees(justSaved.countedCash)}. The owner will check it.`}
            </Text>
            {seesNumbers && (
              <Pressable onPress={() => send(justSaved)} style={styles.secondary} accessibilityRole="button">
                <Text style={styles.secondaryText}>Send summary on WhatsApp</Text>
              </Pressable>
            )}
          </View>
        )}

        {existing && !editing && !justSaved && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Already closed</Text>
            <Text style={styles.cardText}>
              Closed by {existing.closedBy} at{' '}
              {new Date(existing.closedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}.
            </Text>
            {seesNumbers && <ClosingDetail c={existing} />}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {seesNumbers && (
                <Pressable onPress={() => send(existing)} style={[styles.secondary, { flex: 1 }]} accessibilityRole="button">
                  <Text style={styles.secondaryText}>Send</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setEditing(true)} style={[styles.secondary, { flex: 1 }]} accessibilityRole="button">
                <Text style={styles.secondaryText}>Count again</Text>
              </Pressable>
            </View>
          </View>
        )}

        {showForm && !justSaved && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Count the cash</Text>
            <Text style={styles.cardText}>
              {seesNumbers
                ? 'Count every note and coin in the drawer. galla compares it with the cash bills.'
                : 'Count every note and coin in the drawer and enter the total. The owner sees the result.'}
            </Text>

            <Text style={styles.label}>Cash in the drawer at the start of the day</Text>
            <MoneyInput value={opening} onChange={setOpening} placeholder="0" />

            <View style={styles.modeRow}>
              {[false, true].map((m) => (
                <Pressable
                  key={String(m)}
                  onPress={() => setByNotes(m)}
                  style={[styles.modeBtn, byNotes === m && styles.modeBtnActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: byNotes === m }}
                >
                  <Text style={[styles.modeText, byNotes === m && styles.modeTextActive]}>
                    {m ? 'Count by notes' : 'Enter total'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {byNotes ? (
              <View style={{ marginTop: 6 }}>
                {NOTES.map((n) => (
                  <View key={n} style={styles.noteRow}>
                    <Text style={styles.noteLabel}>₹{n} ×</Text>
                    <TextInput
                      value={noteCounts[n] ?? ''}
                      onChangeText={(t) => setNoteCounts((c) => ({ ...c, [n]: t.replace(/[^0-9]/g, '') }))}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                      style={styles.noteInput}
                      accessibilityLabel={`Number of ${n} rupee notes`}
                    />
                    <Text style={styles.noteAmount}>{formatRupees(n * 100 * (Number(noteCounts[n]) || 0))}</Text>
                  </View>
                ))}
                <View style={styles.noteRow}>
                  <Text style={styles.noteLabel}>Coins</Text>
                  <View style={{ flex: 1 }}>
                    <MoneyInput value={coins} onChange={setCoins} placeholder="0" compact />
                  </View>
                </View>
                <Line label="Counted" value={formatRupees(notesTotal)} strong />
              </View>
            ) : (
              <>
                <Text style={styles.label}>Cash counted now</Text>
                <MoneyInput value={counted} onChange={setCounted} placeholder="Total in the drawer" />
              </>
            )}

            {seesNumbers && (
              <View style={styles.compare}>
                <Line label="Start of day" value={formatRupees(toPaise(opening))} />
                <Line label={`+ Cash bills (${summary.byMode.cash.count})`} value={formatRupees(summary.byMode.cash.amount)} />
                <Line label="Should be in drawer" value={formatRupees(expected)} strong />
                {hasCount && (
                  <View style={[styles.diffBox, diff < 0 ? styles.diffShort : diff > 0 ? styles.diffExtra : styles.diffOk]}>
                    <Text style={[styles.diffText, diff < 0 ? { color: colors.danger } : diff > 0 ? { color: colors.turmericDeep } : { color: colors.veg }]}>
                      {diffText(diff)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. ₹200 paid to vegetable vendor"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <Pressable
              onPress={save}
              disabled={!hasCount}
              style={[styles.primary, !hasCount && { opacity: 0.4 }]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryText}>Close the day</Text>
            </Pressable>
          </View>
        )}

        {seesNumbers && history.length > 0 && (
          <>
            <Text style={styles.groupTitle}>Recent closings</Text>
            <View style={[styles.card, { paddingVertical: 4, marginTop: 0 }]}>
              {history.map((c) => (
                <View key={c.id} style={styles.histRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.histDay}>{dayLabel(c.day)}</Text>
                    <Text style={styles.histMeta}>
                      Counted {formatRupees(c.countedCash)} · {c.closedBy}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.histDiff,
                      { color: c.difference < 0 ? colors.danger : c.difference > 0 ? colors.turmericDeep : colors.veg },
                    ]}
                  >
                    {c.difference === 0 ? 'OK' : (c.difference < 0 ? '−' : '+') + formatRupees(Math.abs(c.difference))}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ClosingDetail({ c }: { c: DayClosing }) {
  return (
    <View style={{ marginTop: 8 }}>
      <Line label="Should be in drawer" value={formatRupees(c.expectedCash)} />
      <Line label="Counted" value={formatRupees(c.countedCash)} />
      <Line label={diffText(c.difference)} value="" strong />
      {!!c.note && <Text style={styles.cardText}>Note: {c.note}</Text>}
    </View>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, strong && styles.lineStrong]}>{label}</Text>
      <Text style={[styles.lineValue, strong && styles.lineStrong]}>{value}</Text>
    </View>
  );
}

function MoneyInput({
  value,
  onChange,
  placeholder,
  compact,
}: {
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.moneyBox, compact && { marginTop: 0, height: 42 }]}>
      <Text style={styles.rupee}>₹</Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9.]/g, ''))}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.moneyInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  content: { padding: 16, paddingBottom: 48 },
  backLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.brand, marginBottom: 12 },
  dayRow: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 14, backgroundColor: colors.line },
  dayChip: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayChipActive: { backgroundColor: colors.paper },
  dayChipText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.muted },
  dayChipTextActive: { color: colors.brand },
  dateText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted, marginTop: 10, marginLeft: 4 },
  card: { backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 16, marginTop: 12 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink, marginBottom: 4 },
  cardText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 2 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, gap: 12 },
  lineLabel: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  lineValue: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  lineStrong: { fontFamily: fonts.bold },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, marginTop: 16 },
  moneyBox: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 14, marginTop: 6, backgroundColor: colors.paper },
  rupee: { fontFamily: fonts.bold, fontSize: 18, color: colors.muted, marginRight: 6 },
  moneyInput: { flex: 1, fontFamily: fonts.semibold, fontSize: 18, color: colors.ink, paddingVertical: 0 },
  modeRow: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 12, backgroundColor: colors.mist, marginTop: 16 },
  modeBtn: { flex: 1, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  modeBtnActive: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  modeText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  modeTextActive: { color: colors.brand },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  noteLabel: { width: 64, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  noteInput: { width: 72, height: 42, borderRadius: 10, borderWidth: 1.5, borderColor: colors.line, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, paddingVertical: 0 },
  noteAmount: { flex: 1, textAlign: 'right', fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  compare: { marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: colors.mist },
  diffBox: { marginTop: 8, padding: 12, borderRadius: 10, alignItems: 'center' },
  diffOk: { backgroundColor: '#E6F4EA' },
  diffShort: { backgroundColor: '#FDE7E4' },
  diffExtra: { backgroundColor: '#FBF0D2' },
  diffText: { fontFamily: fonts.bold, fontSize: 18 },
  input: { height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 14, marginTop: 6, fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  primary: { height: 54, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  primaryText: { fontFamily: fonts.bold, fontSize: 17, color: colors.paper },
  secondary: { height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginTop: 12, backgroundColor: colors.paper },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  savedBox: { marginTop: 12, padding: 16, borderRadius: 16, backgroundColor: '#E6F4EA' },
  savedTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.brand },
  savedText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.ink, marginTop: 4 },
  groupTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted, marginTop: 20, marginBottom: 8, marginLeft: 4 },
  histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  histDay: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  histMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  histDiff: { fontFamily: fonts.bold, fontSize: 15 },
});
