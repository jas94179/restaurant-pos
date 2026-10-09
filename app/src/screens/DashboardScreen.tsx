import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bar, buildInsights, Insights, Period, PERIODS } from '../data/insights';
import { PAYMENT_MODES } from '../db/database';
import { useSettings } from '../data/settingsStore';
import { can, useCurrentUser } from '../data/staffStore';
import { formatRupees } from '../utils/money';
import { colors, fonts } from '../theme';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// Owner dashboard: a plain-language summary, key numbers, a sales chart and breakdowns.
export default function DashboardScreen({ visible }: { visible: boolean }) {
  const settings = useSettings();
  const user = useCurrentUser();
  const allPeriods = can(user, 'insightsAllPeriods');
  const [period, setPeriod] = useState<Period>('today');
  const [data, setData] = useState<Insights>(() => buildInsights('today'));

  const refresh = useCallback(() => setData(buildInsights(period)), [period]);

  // Recalculate when the tab is opened or the period changes.
  useEffect(() => {
    if (visible) refresh();
  }, [visible, refresh]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.updated}>Updated when you open this tab</Text>
        <Pressable onPress={refresh} hitSlop={12} accessibilityRole="button">
          <Text style={styles.link}>Refresh</Text>
        </Pressable>
      </View>

      <View style={styles.periods} accessibilityRole="tablist">
        {PERIODS.filter((p) => allPeriods || p.key === 'today').map((p) => (
          <Pressable
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: period === p.key }}
          >
            <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Headline: total sales, change, and the summary in plain words */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Total sales</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroValue}>{formatRupees(data.totalSales)}</Text>
          {data.changePct != null && (
            <View style={[styles.change, data.changePct < 0 && styles.changeDown]}>
              <Text style={[styles.changeText, data.changePct < 0 && styles.changeTextDown]}>
                {data.changePct > 0 ? '▲' : data.changePct < 0 ? '▼' : '='} {Math.abs(data.changePct)}%
              </Text>
            </View>
          )}
        </View>
        {data.changePct != null && <Text style={styles.heroSub}>{data.changeLabel}</Text>}
        <View style={styles.summary}>
          {data.summary.map((line, i) => (
            <View key={i} style={styles.summaryRow}>
              <View style={styles.summaryDot} />
              <Text style={styles.summaryText}>{line}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.kpis}>
        <Kpi label="Bills" value={String(data.billCount)} />
        <Kpi label="Average bill" value={formatRupees(data.avgBill)} />
        <Kpi label="GST collected" value={formatRupees(data.gst)} />
      </View>

      <BarChart title={data.barsTitle} bars={data.bars} period={period} />

      <Card title="Top items">
        {data.topItems.length === 0 ? (
          <Text style={styles.empty}>Items you sell will be ranked here.</Text>
        ) : (
          data.topItems.map((it, i) => (
            <ShareRow
              key={it.name}
              label={`${i + 1}. ${it.name}`}
              value={`${it.qty} sold · ${formatRupees(it.amount)}`}
              fraction={it.qty / data.topItems[0].qty}
            />
          ))
        )}
      </Card>

      <Card title="Payment">
        {PAYMENT_MODES.map((m) => (
          <ShareRow
            key={m.key}
            label={m.label}
            value={`${formatRupees(data.byMode[m.key])} · ${pct(data.byMode[m.key], data.totalSales)}`}
            fraction={data.totalSales ? data.byMode[m.key] / data.totalSales : 0}
          />
        ))}
      </Card>

      {settings.outletType === 'both' && (
        <Card title="Dine-in and takeaway">
          <ShareRow
            label="Dine-in"
            value={`${formatRupees(data.byType.dineIn)} · ${pct(data.byType.dineIn, data.totalSales)}`}
            fraction={data.totalSales ? data.byType.dineIn / data.totalSales : 0}
          />
          <ShareRow
            label="Takeaway"
            value={`${formatRupees(data.byType.takeaway)} · ${pct(data.byType.takeaway, data.totalSales)}`}
            fraction={data.totalSales ? data.byType.takeaway / data.totalSales : 0}
          />
        </Card>
      )}

      {period === 'today' && (
        <Card title={`Today's bills (${data.bills.length})`}>
          {data.bills.length === 0 ? (
            <Text style={styles.empty}>No bills yet today.</Text>
          ) : (
            data.bills.map((b) => (
              <View key={b.id} style={styles.billRow}>
                <Text style={styles.token}>#{b.token}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.billMain}>
                    {b.table_no != null ? `Table ${b.table_no}` : 'Takeaway'} ·{' '}
                    {PAYMENT_MODES.find((m) => m.key === b.payment_mode)?.label}
                  </Text>
                  <Text style={styles.billSub}>{formatTime(b.created_at)}</Text>
                </View>
                <Text style={styles.billTotal}>{formatRupees(b.total)}</Text>
              </View>
            ))
          )}
        </Card>
      )}

      <Text style={styles.footnote}>
        Worked out on this phone from your saved bills. AI summaries on WhatsApp are coming later.
      </Text>
    </ScrollView>
  );
}

function pct(part: number, whole: number): string {
  return whole ? `${Math.round((part / whole) * 100)}%` : '0%';
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

// A labelled row with a thin proportion bar underneath.
function ShareRow({ label, value, fraction }: { label: string; value: string; fraction: number }) {
  return (
    <View style={styles.shareRow}>
      <View style={styles.shareTop}>
        <Text style={styles.shareLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.shareValue}>{value}</Text>
      </View>
      <View style={styles.shareTrack}>
        <View style={[styles.shareFill, { width: `${Math.max(0, Math.min(1, fraction)) * 100}%` }]} />
      </View>
    </View>
  );
}

// Single-series bar chart. Tap a bar to read its value; the best bar is selected by default.
function BarChart({ title, bars, period }: { title: string; bars: Bar[]; period: Period }) {
  const max = Math.max(0, ...bars.map((b) => b.value));
  const peakKey = useMemo(() => (max > 0 ? bars.find((b) => b.value === max)?.key ?? null : null), [bars, max]);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => setSelected(null), [period]);
  const activeKey = selected ?? peakKey;
  const active = bars.find((b) => b.key === activeKey);
  const CHART_H = 140;
  // Show a few x labels only, so they never collide.
  const labelEvery = bars.length <= 8 ? 1 : bars.length <= 16 ? 3 : 5;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.readout}>
        {active && active.value > 0
          ? `${active.detail}: ${formatRupees(active.value)} from ${active.bills} bill${active.bills === 1 ? '' : 's'}`
          : 'No sales in this period yet.'}
      </Text>
      <View style={[styles.plot, { height: CHART_H }]}>
        {bars.map((b) => {
          const h = max > 0 ? Math.max(b.value > 0 ? 3 : 0, (b.value / max) * CHART_H) : 0;
          const isActive = b.key === activeKey && b.value > 0;
          return (
            <Pressable
              key={b.key}
              style={styles.barSlot}
              onPress={() => setSelected(b.key)}
              accessibilityRole="button"
              accessibilityLabel={`${b.detail}, ${formatRupees(b.value)}`}
            >
              <View style={[styles.bar, { height: h }, isActive && styles.barActive]} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.baseline} />
      <View style={styles.xLabels}>
        {bars.map((b, i) =>
          i % labelEvery === 0 ? (
            <Text key={b.key} style={[styles.xLabel, { left: `${(i / bars.length) * 100}%` }]} numberOfLines={1}>
              {b.label}
            </Text>
          ) : null,
        )}
      </View>
    </View>
  );
}

const TINT = '#E5EEE9';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  content: { padding: 16, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.ink },
  updated: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  link: { fontFamily: fonts.semibold, fontSize: 15, color: colors.brand },
  periods: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 16 },
  periodBtn: { flex: 1, height: 40, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  periodBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  periodText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  periodTextActive: { color: colors.paper },
  hero: { backgroundColor: colors.brand, borderRadius: 20, padding: 20 },
  heroLabel: { fontFamily: fonts.regular, fontSize: 14, color: '#CFE0D6' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  heroValue: { fontFamily: fonts.bold, fontSize: 40, color: colors.turmeric, letterSpacing: -1 },
  change: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' },
  changeDown: { backgroundColor: 'rgba(255,180,171,0.18)' },
  changeText: { fontFamily: fonts.bold, fontSize: 14, color: colors.paper },
  changeTextDown: { color: '#FFDAD5' },
  heroSub: { fontFamily: fonts.regular, fontSize: 13, color: '#CFE0D6', marginTop: 2 },
  summary: { marginTop: 16, gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 14 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.turmeric, marginTop: 8 },
  summaryText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.paper },
  kpis: { flexDirection: 'row', gap: 8, marginTop: 12 },
  kpi: { flex: 1, backgroundColor: colors.paper, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.line },
  kpiLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  kpiValue: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink, marginTop: 4 },
  card: { backgroundColor: colors.paper, borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: colors.line },
  cardTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink, marginBottom: 8 },
  readout: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginBottom: 12 },
  plot: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { backgroundColor: colors.brand, borderTopLeftRadius: 4, borderTopRightRadius: 4, opacity: 0.85 },
  barActive: { backgroundColor: colors.turmeric, opacity: 1 },
  baseline: { height: 1, backgroundColor: colors.line },
  xLabels: { height: 16, marginTop: 6 },
  xLabel: { position: 'absolute', width: 48, fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  shareRow: { paddingVertical: 8 },
  shareTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 6 },
  shareLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  shareValue: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  shareTrack: { height: 6, borderRadius: 3, backgroundColor: TINT, overflow: 'hidden' },
  shareFill: { height: 6, borderRadius: 3, backgroundColor: colors.brand },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
  token: { width: 40, fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  billMain: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  billSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
  billTotal: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  footnote: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 20 },
});
