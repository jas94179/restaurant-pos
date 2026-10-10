import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import BottomSheet from './BottomSheet';
import { GST_RATES } from '../utils/tax';
import { OutletType, saveSettings, useSettings } from '../data/settingsStore';
import { getOpenTables } from '../db/database';
import { colors, fonts } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TYPES: { key: OutletType; label: string }[] = [
  { key: 'counter', label: 'Counter' },
  { key: 'dine_in', label: 'Dine-in' },
  { key: 'both', label: 'Both' },
];
const PLAN_LABEL: Record<string, string> = {
  pilot: 'Pilot plan, all features free',
  free: 'Free plan',
  starter: 'Starter plan',
  pro: 'Pro plan',
  business: 'Business plan',
};
const GSTIN_PATTERN = /^[0-9]{2}[A-Z0-9]{13}$/;
const UPI_PATTERN = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

type Props = { onClose: () => void };

export default function ProfileSheet({ onClose }: Props) {
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const [name, setName] = useState(settings.restaurantName);
  const [gstin, setGstin] = useState(settings.gstin);
  const [outletType, setOutletType] = useState<OutletType>(settings.outletType);
  const [tables, setTables] = useState(settings.tableCount || 10);
  const [gstRate, setGstRate] = useState(settings.gstRate);
  const [inclusive, setInclusive] = useState(settings.pricesIncludeGst);
  const [upiId, setUpiId] = useState(settings.upiId);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    const n = name.trim();
    const g = gstin.trim().toUpperCase();
    if (n.length < 2) return setError('Enter your restaurant name.');
    if (g && !GSTIN_PATTERN.test(g)) return setError('GSTIN should be 15 characters, like 07ABCDE1234F1Z5.');
    const u = upiId.trim();
    if (u && !UPI_PATTERN.test(u)) return setError('UPI ID should look like name@bank, for example sharmasweets@okaxis.');

    // Don't hide tables that still have running orders.
    const busy = Object.keys(getOpenTables()).map(Number);
    if (outletType === 'counter' && busy.length > 0) {
      return setError(`Settle open tables first (${busy.map((t) => `T${t}`).join(', ')}).`);
    }
    const highest = busy.length ? Math.max(...busy) : 0;
    if (outletType !== 'counter' && tables < highest) {
      return setError(`Table ${highest} has a running order. Settle it before reducing tables.`);
    }

    saveSettings({
      restaurantName: n,
      gstin: g,
      outletType,
      tableCount: outletType === 'counter' ? 0 : tables,
      gstRate,
      pricesIncludeGst: inclusive,
      upiId: u,
    });
    setError(null);
    setSaved(true);
  }

  return (
    <BottomSheet onClose={onClose}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>
            <View style={styles.head}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(settings.restaurantName[0] ?? 'R').toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{settings.restaurantName}</Text>
                <Text style={styles.plan}>{PLAN_LABEL[settings.plan] ?? settings.plan}</Text>
              </View>
            </View>

            <Text style={styles.section}>Restaurant details</Text>
            <Text style={styles.label}>Name on bills</Text>
            <TextInput value={name} onChangeText={(t) => { setName(t); setSaved(false); }} style={styles.input} />
            <Text style={styles.label}>GSTIN (optional)</Text>
            <TextInput
              value={gstin}
              onChangeText={(t) => { setGstin(t); setSaved(false); }}
              style={styles.input}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={15}
              placeholder="15 characters"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>How customers order</Text>
            <View style={styles.segment}>
              {TYPES.map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => { setOutletType(t.key); setSaved(false); }}
                  style={[styles.segBtn, outletType === t.key && styles.segBtnActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: outletType === t.key }}
                >
                  <Text style={[styles.segText, outletType === t.key && styles.segTextActive]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            {outletType !== 'counter' && (
              <>
                <Text style={styles.label}>Number of tables</Text>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepBtn} onPress={() => { setTables((n) => Math.max(1, n - 1)); setSaved(false); }} accessibilityLabel="Fewer tables">
                    <Text style={styles.stepText}>−</Text>
                  </Pressable>
                  <Text style={styles.stepValue}>{tables}</Text>
                  <Pressable style={styles.stepBtn} onPress={() => { setTables((n) => Math.min(60, n + 1)); setSaved(false); }} accessibilityLabel="More tables">
                    <Text style={styles.stepText}>+</Text>
                  </Pressable>
                </View>
              </>
            )}

            <Text style={styles.section}>GST on bills</Text>
            <View style={styles.segment}>
              {GST_RATES.map((r) => (
                <Pressable
                  key={r.rate}
                  onPress={() => { setGstRate(r.rate); setSaved(false); }}
                  style={[styles.segBtn, gstRate === r.rate && styles.segBtnActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: gstRate === r.rate }}
                >
                  <Text style={[styles.segText, gstRate === r.rate && styles.segTextActive]}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
            {gstRate > 0 && (
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Menu prices include GST</Text>
                  <Text style={styles.hint}>
                    {inclusive
                      ? 'Customer pays the menu price. GST is shown inside it.'
                      : 'GST is added on top of menu prices.'}
                  </Text>
                </View>
                <Switch
                  value={inclusive}
                  onValueChange={(v) => { setInclusive(v); setSaved(false); }}
                  trackColor={{ true: colors.brand, false: colors.line }}
                />
              </View>
            )}
            {gstRate > 0 && !gstin.trim() && (
              <Text style={styles.warn}>Only GST-registered businesses can charge GST. Add your GSTIN above.</Text>
            )}
            <Text style={styles.hint}>Not sure which rate applies? Check with your CA.</Text>

            <Text style={styles.section}>UPI payments</Text>
            <Text style={styles.label}>Your UPI ID (shown as a QR on bills)</Text>
            <TextInput
              value={upiId}
              onChangeText={(t) => { setUpiId(t); setSaved(false); }}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="e.g. sharmasweets@okaxis"
              placeholderTextColor={colors.muted}
            />

            {error && <Text style={styles.error}>{error}</Text>}
            {saved && <Text style={styles.saved}>Changes saved.</Text>}

            <Pressable style={styles.saveBtn} onPress={save} accessibilityRole="button">
              <Text style={styles.saveText}>Save changes</Text>
            </Pressable>

          </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,42,31,0.45)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '88%', backgroundColor: colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginTop: 10, marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 22, color: colors.turmeric },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink },
  plan: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 2 },
  section: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, marginTop: 20 },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted, marginTop: 14, marginBottom: 6 },
  input: { height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 17, color: colors.ink },
  segment: { flexDirection: 'row', gap: 8 },
  segBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  segBtnActive: { borderColor: colors.brand, backgroundColor: '#E5EEE9' },
  segText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.muted },
  segTextActive: { color: colors.brand },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: fonts.semibold, fontSize: 22, color: colors.brand },
  stepValue: { fontFamily: fonts.bold, fontSize: 24, color: colors.ink, minWidth: 40, textAlign: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  switchTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  hint: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 6 },
  warn: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.turmericDeep, marginTop: 10 },
  error: { fontFamily: fonts.regular, color: colors.danger, fontSize: 14, marginTop: 14 },
  saved: { fontFamily: fonts.semibold, color: colors.veg, fontSize: 14, marginTop: 14 },
  saveBtn: { height: 52, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 20 },
  lockBtn: { paddingVertical: 6 },
  lockText: { fontFamily: fonts.bold, fontSize: 16, color: colors.danger },
  lockHint: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
});
