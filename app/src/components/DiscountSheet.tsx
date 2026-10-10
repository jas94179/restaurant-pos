import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import BottomSheet from './BottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PinPad from './PinPad';
import { canApprove, findApprover, useCurrentUser } from '../data/staffStore';
import { formatRupees } from '../utils/money';
import { colors, fonts } from '../theme';

export type Discount = {
  kind: 'percent' | 'flat';
  value: number; // percent (e.g. 10) or paise
  reason: string;
  by: string; // who gave or approved it
};

// Discount in paise for an items total.
export function discountAmount(d: Discount | null, itemsSum: number): number {
  if (!d) return 0;
  const raw = d.kind === 'percent' ? Math.round((itemsSum * d.value) / 100) : d.value;
  return Math.max(0, Math.min(raw, itemsSum));
}

export function discountLabel(d: Discount): string {
  return d.kind === 'percent' ? `${d.value}%` : formatRupees(d.value);
}

const REASONS = ['Regular customer', 'Staff meal', 'Complaint', 'Festival offer', 'Other'];
const QUICK_PERCENT = [5, 10, 15, 20];

type Props = {
  itemsSum: number; // paise
  current: Discount | null;
  onApply: (d: Discount | null) => void;
  onClose: () => void;
};

// Owners and managers give discounts directly; cashiers need an owner or manager PIN,
// so discounts can't be used to pocket cash.
export default function DiscountSheet({ itemsSum, current, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const me = useCurrentUser();
  const selfApprove = canApprove(me);
  const [kind, setKind] = useState<'percent' | 'flat'>(current?.kind ?? 'percent');
  const [value, setValue] = useState(
    current ? (current.kind === 'percent' ? String(current.value) : String(current.value / 100)) : '',
  );
  const [reason, setReason] = useState<string | null>(
    current ? (REASONS.includes(current.reason) ? current.reason : 'Other') : null,
  );
  const [other, setOther] = useState(current && !REASONS.includes(current.reason) ? current.reason : '');
  const [step, setStep] = useState<'form' | 'pin'>('form');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const num = Number(value) || 0;
  const draft: Discount = {
    kind,
    value: kind === 'percent' ? num : Math.round(num * 100),
    reason: reason === 'Other' ? other.trim() : reason ?? '',
    by: '',
  };
  const preview = discountAmount(draft, itemsSum);

  function next() {
    if (num <= 0) return setError('Enter the discount.');
    if (kind === 'percent' && num > 100) return setError('A discount cannot be more than 100%.');
    if (kind === 'flat' && draft.value > itemsSum) return setError(`The discount cannot be more than ${formatRupees(itemsSum)}.`);
    if (!reason) return setError('Choose a reason.');
    if (reason === 'Other' && draft.reason.length < 3) return setError('Write a short reason.');
    setError(null);
    if (selfApprove && me) onApply({ ...draft, by: me.name });
    else setStep('pin');
  }

  async function typePin(d: string) {
    if (pin.length >= 4) return;
    setError(null);
    const p = pin + d;
    setPin(p);
    if (p.length === 4) {
      const approver = await findApprover(p);
      if (approver) onApply({ ...draft, by: approver.name });
      else {
        setError('That is not an owner or manager PIN.');
        setTimeout(() => setPin(''), 350);
      }
    }
  }

  return (
    <BottomSheet onClose={onClose}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Discount</Text>
            <Text style={styles.sub}>Items total {formatRupees(itemsSum)}. GST is worked out after the discount.</Text>

            {step === 'form' ? (
              <>
                <View style={styles.modeRow}>
                  {(['percent', 'flat'] as const).map((k) => (
                    <Pressable
                      key={k}
                      onPress={() => {
                        setKind(k);
                        setValue('');
                        setError(null);
                      }}
                      style={[styles.modeBtn, kind === k && styles.modeBtnActive]}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: kind === k }}
                    >
                      <Text style={[styles.modeText, kind === k && styles.modeTextActive]}>
                        {k === 'percent' ? 'Percent %' : 'Amount ₹'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {kind === 'percent' && (
                  <View style={styles.quickRow}>
                    {QUICK_PERCENT.map((q) => (
                      <Pressable
                        key={q}
                        onPress={() => setValue(String(q))}
                        style={[styles.quick, value === String(q) && styles.quickActive]}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.quickText, value === String(q) && styles.quickTextActive]}>{q}%</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                <View style={styles.inputBox}>
                  <Text style={styles.unit}>{kind === 'percent' ? '%' : '₹'}</Text>
                  <TextInput
                    value={value}
                    onChangeText={(t) => {
                      setValue(t.replace(/[^0-9.]/g, ''));
                      setError(null);
                    }}
                    keyboardType="decimal-pad"
                    placeholder={kind === 'percent' ? 'e.g. 10' : 'e.g. 50'}
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                  />
                  {preview > 0 && <Text style={styles.preview}>− {formatRupees(preview)}</Text>}
                </View>

                <Text style={styles.label}>Reason</Text>
                <View style={styles.reasons}>
                  {REASONS.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => {
                        setReason(r);
                        setError(null);
                      }}
                      style={[styles.reason, reason === r && styles.reasonActive]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: reason === r }}
                    >
                      <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{r}</Text>
                    </Pressable>
                  ))}
                </View>
                {reason === 'Other' && (
                  <TextInput
                    value={other}
                    onChangeText={setOther}
                    placeholder="Why the discount?"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, styles.otherInput]}
                  />
                )}

                {error && <Text style={styles.error}>{error}</Text>}
                <Pressable style={styles.primary} onPress={next} accessibilityRole="button">
                  <Text style={styles.primaryText}>{selfApprove ? 'Apply discount' : 'Next: owner or manager PIN'}</Text>
                </Pressable>
                {current && (
                  <Pressable style={styles.textBtn} onPress={() => onApply(null)} accessibilityRole="button">
                    <Text style={[styles.textBtnText, { color: colors.danger }]}>Remove discount</Text>
                  </Pressable>
                )}
                <Pressable style={styles.textBtn} onPress={onClose} accessibilityRole="button">
                  <Text style={styles.textBtnText}>Cancel</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.label}>
                  Discount of {formatRupees(preview)} needs an owner or manager. Ask them to enter their PIN.
                </Text>
                <View style={{ marginTop: 8 }}>
                  <PinPad length={pin.length} onDigit={typePin} onDelete={() => setPin((p) => p.slice(0, -1))} error={!!error} />
                </View>
                {error && <Text style={styles.error}>{error}</Text>}
                <Pressable style={styles.textBtn} onPress={() => setStep('form')} accessibilityRole="button">
                  <Text style={styles.textBtnText}>Back</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,42,31,0.55)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', backgroundColor: colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20 },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink },
  sub: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 6 },
  modeRow: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 12, backgroundColor: colors.mist, marginTop: 16 },
  modeBtn: { flex: 1, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  modeBtnActive: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  modeText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  modeTextActive: { color: colors.brand },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  quick: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  quickActive: { borderColor: colors.brand, backgroundColor: '#E6F4EA' },
  quickText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  quickTextActive: { color: colors.brand },
  inputBox: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 14, marginTop: 12 },
  unit: { fontFamily: fonts.bold, fontSize: 18, color: colors.muted, marginRight: 8 },
  input: { flex: 1, fontFamily: fonts.semibold, fontSize: 18, color: colors.ink, paddingVertical: 0 },
  otherInput: { flex: 0, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 12, marginTop: 10, fontSize: 16 },
  preview: { fontFamily: fonts.bold, fontSize: 16, color: colors.veg },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, marginTop: 18, marginBottom: 8 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reason: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line },
  reasonActive: { borderColor: colors.brand, backgroundColor: '#E6F4EA' },
  reasonText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  reasonTextActive: { color: colors.brand },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.danger, marginTop: 10 },
  primary: { height: 52, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  primaryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
  textBtn: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  textBtnText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.brand },
});
