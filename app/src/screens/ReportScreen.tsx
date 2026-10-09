import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { DaySummary, getDaySummary, PAYMENT_MODES } from '../db/database';
import { formatRupees } from '../utils/money';

function formatTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function formatDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months.at(m - 1)} ${y}`;
}

export default function ReportScreen({ visible }: { visible: boolean }) {
  const [summary, setSummary] = useState<DaySummary>(() => getDaySummary());

  const refresh = useCallback(() => setSummary(getDaySummary()), []);

  // Reload the numbers every time this tab is opened.
  useEffect(() => {
    if (visible) refresh();
  }, [visible, refresh]);

  const avg = summary.billCount ? Math.round(summary.totalSales / summary.billCount) : 0;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today's sales</Text>
          <Text style={styles.subtitle}>{formatDay(summary.day)}</Text>
        </View>
        <Pressable onPress={refresh} hitSlop={12}>
          <Text style={styles.link}>Refresh</Text>
        </Pressable>
      </View>

      <FlatList
        data={summary.bills}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>Total sales</Text>
              <Text style={styles.heroValue}>{formatRupees(summary.totalSales)}</Text>
              <Text style={styles.heroSub}>
                {summary.billCount} bill{summary.billCount === 1 ? '' : 's'} · Avg {formatRupees(avg)} · GST{' '}
                {formatRupees(summary.gstCollected)}
              </Text>
            </View>

            <View style={styles.modes}>
              {PAYMENT_MODES.map((m) => {
                const v = summary.byMode[m.key];
                return (
                  <View key={m.key} style={styles.modeCard}>
                    <Text style={styles.modeLabel}>{m.label}</Text>
                    <Text style={styles.modeValue}>{formatRupees(v.amount)}</Text>
                    <Text style={styles.modeSub}>
                      {v.count} bill{v.count === 1 ? '' : 's'}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Bills</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No bills yet today.</Text>}
        renderItem={({ item: b }) => (
          <View style={styles.billRow}>
            <Text style={styles.token}>#{b.token}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.billMain}>
                {b.table_no != null ? `Table ${b.table_no}` : 'Takeaway'} · {b.item_count} item
                {b.item_count === 1 ? '' : 's'} · {PAYMENT_MODES.find((m) => m.key === b.payment_mode)?.label}
              </Text>
              <Text style={styles.billSub}>{formatTime(b.created_at)}</Text>
            </View>
            <Text style={styles.billTotal}>{formatRupees(b.total)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const INK = '#1C1B1F';
const MUTED = '#6B6870';
const ACCENT = '#C2410C';
const LINE = '#E7E3DE';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF8F5', paddingTop: 52 },
  header: { paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: INK },
  subtitle: { fontSize: 14, color: MUTED },
  link: { color: ACCENT, fontWeight: '600', fontSize: 15 },
  content: { padding: 16, paddingBottom: 32 },
  hero: { padding: 16, borderRadius: 12, backgroundColor: INK },
  heroLabel: { color: '#D6D3D1', fontSize: 14 },
  heroValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginVertical: 4 },
  heroSub: { color: '#D6D3D1', fontSize: 13 },
  modes: { flexDirection: 'row', gap: 8, marginTop: 12 },
  modeCard: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: LINE },
  modeLabel: { color: MUTED, fontSize: 13 },
  modeValue: { color: INK, fontSize: 17, fontWeight: '700', marginTop: 2 },
  modeSub: { color: MUTED, fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: INK, marginTop: 20, marginBottom: 4 },
  empty: { color: MUTED, textAlign: 'center', marginTop: 24 },
  billRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: LINE, gap: 12 },
  token: { width: 44, fontSize: 15, fontWeight: '700', color: INK },
  billMain: { fontSize: 15, color: INK },
  billSub: { fontSize: 12, color: MUTED, marginTop: 2 },
  billTotal: { fontSize: 15, fontWeight: '600', color: INK },
});
