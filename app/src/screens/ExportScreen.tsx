import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { dayKey } from '../db/database';
import { useSettings } from '../data/settingsStore';
import { buildExport, EXPORTS, type ExportKind } from '../utils/exportCsv';
import { colors, fonts } from '../theme';

type Range = { id: string; label: string; from: string; to: string };

function ranges(): Range[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const fyStart = m >= 3 ? y : y - 1; // financial year starts in April
  return [
    { id: 'this', label: 'This month', from: dayKey(new Date(y, m, 1)), to: dayKey(now) },
    { id: 'last', label: 'Last month', from: dayKey(new Date(y, m - 1, 1)), to: dayKey(new Date(y, m, 0)) },
    { id: 'fy', label: `FY ${fyStart}-${String(fyStart + 1).slice(2)}`, from: dayKey(new Date(fyStart, 3, 1)), to: dayKey(now) },
    { id: 'lastfy', label: `FY ${fyStart - 1}-${String(fyStart).slice(2)}`, from: dayKey(new Date(fyStart - 1, 3, 1)), to: dayKey(new Date(fyStart, 2, 31)) },
  ];
}

function nice(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Owner only. Sales files for the CA, shared as CSV (opens in Excel / Google Sheets).
export default function ExportScreen({ onBack }: { onBack: () => void }) {
  const settings = useSettings();
  const all = ranges();
  const [rangeId, setRangeId] = useState('last');
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const range = all.find((r) => r.id === rangeId) ?? all[0];

  async function share(kind: ExportKind, title: string) {
    setBusy(kind);
    setMessage(null);
    try {
      const { csv, rows } = buildExport(kind, range.from, range.to, {
        restaurant: settings.restaurantName,
        gstin: settings.gstin,
      });
      if (rows === 0) {
        setMessage({ text: `No sales from ${nice(range.from)} to ${nice(range.to)}.`, error: true });
        return;
      }
      const safe = settings.restaurantName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'restaurant';
      const file = new File(Paths.cache, `${safe}-${kind}-${range.from}-to-${range.to}.csv`);
      if (file.exists) file.delete();
      file.create();
      file.write(csv);
      if (!(await Sharing.isAvailableAsync())) {
        setMessage({ text: 'Sharing is not available on this phone.', error: true });
        return;
      }
      await Sharing.shareAsync(file.uri, { dialogTitle: title, mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
    } catch {
      setMessage({ text: 'Could not create the file. Please try again.', error: true });
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button">
        <Text style={styles.backLink}>‹ Profile</Text>
      </Pressable>
      <Text style={styles.lead}>
        Send these to your CA on WhatsApp or email. They open in Excel and Google Sheets.
      </Text>

      <View style={styles.chips}>
        {all.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => setRangeId(r.id)}
            style={[styles.chip, r.id === rangeId && styles.chipActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: r.id === rangeId }}
          >
            <Text style={[styles.chipText, r.id === rangeId && styles.chipTextActive]}>{r.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.period}>
        {nice(range.from)} to {nice(range.to)}
      </Text>

      {message && <Text style={[styles.message, message.error && styles.messageError]}>{message.text}</Text>}

      {EXPORTS.map((e) => (
        <Pressable
          key={e.kind}
          onPress={() => share(e.kind, e.title)}
          disabled={busy != null}
          style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.mist }]}
          accessibilityRole="button"
          accessibilityLabel={`Share ${e.title}`}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{e.title}</Text>
            <Text style={styles.cardText}>{e.detail}</Text>
          </View>
          {busy === e.kind ? <ActivityIndicator color={colors.brand} /> : <Text style={styles.share}>Share</Text>}
        </Pressable>
      ))}

      <Text style={styles.fine}>
        Cancelled bills stay in the bill-wise register, marked "Cancelled", and are left out of totals. Zomato and Swiggy
        orders have no invoice number because the app pays their GST.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  content: { padding: 16, paddingBottom: 40 },
  backLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.brand, marginBottom: 12 },
  lead: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { paddingHorizontal: 14, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.paper, justifyContent: 'center' },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  chipTextActive: { color: colors.paper },
  period: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted, marginTop: 10, marginLeft: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 16, marginTop: 12 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  cardText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.muted, marginTop: 3 },
  share: { fontFamily: fonts.semibold, fontSize: 15, color: colors.brand },
  message: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.veg, marginTop: 12 },
  messageError: { color: colors.danger },
  fine: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.muted, marginTop: 16, marginHorizontal: 4 },
});
