import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { addExpense, dayKey, EXPENSE_CATEGORIES, getExpenses, removeExpense } from '../db/database';
import { can, useCurrentUser } from '../data/staffStore';
import { formatRupees } from '../utils/money';
import { colors, fonts } from '../theme';

function dayLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Money spent during the day. Cash taken from the drawer is subtracted from the
// cash expected at day closing, so the count still matches.
export default function ExpensesScreen({ onBack }: { onBack: () => void }) {
  const user = useCurrentUser();
  const canRemove = can(user, 'removeExpense');
  const today = dayKey();
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const [day, setDay] = useState(today);
  const [version, setVersion] = useState(0);
  const list = useMemo(() => getExpenses(day, day), [day, version]);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [fromCash, setFromCash] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const active = list.filter((e) => !e.removedAt);
  const cashTotal = active.filter((e) => e.fromCash).reduce((s, e) => s + e.amount, 0);
  const otherTotal = active.filter((e) => !e.fromCash).reduce((s, e) => s + e.amount, 0);

  function add() {
    const paise = Math.round((Number(amount) || 0) * 100);
    if (paise <= 0) return setError('Enter the amount.');
    if (!category) return setError('Choose what it was for.');
    if (category === 'Other' && note.trim().length < 3) return setError('Write a short note for "Other".');
    addExpense({ day, amount: paise, category, note, fromCash, addedBy: user?.name ?? '' });
    setAmount('');
    setCategory(null);
    setNote('');
    setFromCash(true);
    setError(null);
    setVersion((v) => v + 1);
  }

  function remove(id: string, label: string) {
    Alert.alert('Remove this expense?', `${label}\n\nIt stays in the list, marked as removed.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeExpense(id, user?.name ?? '');
          setVersion((v) => v + 1);
        },
      },
    ]);
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
              onPress={() => setDay(d)}
              style={[styles.dayChip, day === d && styles.dayChipActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: day === d }}
            >
              <Text style={[styles.dayChipText, day === d && styles.dayChipTextActive]}>{d === today ? 'Today' : 'Yesterday'}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sumLabel}>Paid from cash drawer</Text>
            <Text style={styles.sumValue}>{formatRupees(cashTotal)}</Text>
          </View>
          {otherTotal > 0 && (
            <View style={{ flex: 1 }}>
              <Text style={styles.sumLabel}>Paid by UPI / bank</Text>
              <Text style={[styles.sumValue, { color: colors.ink }]}>{formatRupees(otherTotal)}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add expense · {dayLabel(day)}</Text>
          <View style={styles.moneyBox}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => {
                setAmount(t.replace(/[^0-9.]/g, ''));
                setError(null);
              }}
              keyboardType="decimal-pad"
              placeholder="Amount"
              placeholderTextColor={colors.muted}
              style={styles.moneyInput}
            />
          </View>

          <Text style={styles.label}>For</Text>
          <View style={styles.chips}>
            {EXPENSE_CATEGORIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => {
                  setCategory(c);
                  setError(null);
                }}
                style={[styles.chip, category === c && styles.chipActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: category === c }}
              >
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Note (optional), e.g. Ramesh sabziwala"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Paid from the cash drawer</Text>
              <Text style={styles.switchSub}>Turn off if paid by UPI or from the owner's pocket.</Text>
            </View>
            <Switch
              value={fromCash}
              onValueChange={setFromCash}
              trackColor={{ true: colors.brand, false: colors.line }}
              thumbColor={colors.paper}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={styles.primary} onPress={add} accessibilityRole="button">
            <Text style={styles.primaryText}>Add expense</Text>
          </Pressable>
        </View>

        <Text style={styles.groupTitle}>{list.length ? 'Expenses' : 'No expenses yet'}</Text>
        {list.length > 0 && (
          <View style={[styles.card, { paddingVertical: 4, marginTop: 0 }]}>
            {list.map((e) => {
              const removed = !!e.removedAt;
              const label = `${e.category} ${formatRupees(e.amount)}`;
              return (
                <Pressable
                  key={e.id}
                  onLongPress={canRemove && !removed ? () => remove(e.id, label) : undefined}
                  style={styles.row}
                  accessibilityHint={canRemove && !removed ? 'Long-press to remove' : undefined}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, removed && styles.removed]}>{e.category}</Text>
                    <Text style={styles.rowMeta}>
                      {new Date(e.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} ·{' '}
                      {e.fromCash ? 'Cash' : 'UPI / bank'} · {e.addedBy}
                      {e.note ? ` · ${e.note}` : ''}
                      {removed ? ` · removed by ${e.removedBy}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.rowAmount, removed && styles.removed]}>{formatRupees(e.amount)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {canRemove && list.some((e) => !e.removedAt) && <Text style={styles.hint}>Long-press an expense to remove it.</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
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
  summary: { flexDirection: 'row', gap: 12, marginTop: 12, padding: 16, borderRadius: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  sumLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  sumValue: { fontFamily: fonts.bold, fontSize: 24, color: colors.brand, marginTop: 2 },
  card: { backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 16, marginTop: 12 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  moneyBox: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 14, marginTop: 12 },
  rupee: { fontFamily: fonts.bold, fontSize: 18, color: colors.muted, marginRight: 6 },
  moneyInput: { flex: 1, fontFamily: fonts.semibold, fontSize: 18, color: colors.ink, paddingVertical: 0 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, marginTop: 16, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1.5, borderColor: colors.line },
  chipActive: { borderColor: colors.brand, backgroundColor: '#E6F4EA' },
  chipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  chipTextActive: { color: colors.brand },
  input: { height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 12, marginTop: 14, fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  switchTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  switchSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.danger, marginTop: 12 },
  primary: { height: 52, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primaryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
  groupTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted, marginTop: 20, marginBottom: 8, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  rowMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  rowAmount: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  removed: { color: colors.muted, textDecorationLine: 'line-through' },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 8, marginLeft: 4 },
});
