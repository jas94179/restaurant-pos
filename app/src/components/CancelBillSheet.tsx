import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import BottomSheet from './BottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PinPad from './PinPad';
import { cancelBill } from '../db/database';
import { canApprove, findApprover, useCurrentUser } from '../data/staffStore';
import { formatRupees } from '../utils/money';
import { colors, fonts } from '../theme';

const REASONS = ['Wrong items billed', 'Customer cancelled', 'Duplicate bill', 'Wrong payment mode', 'Other'];

type Props = { billId: string; token: number; total: number; onDone: () => void; onClose: () => void };

// Cancelling needs a reason, and an owner or manager. Cashiers ask one of them to type their PIN.
export default function CancelBillSheet({ billId, token, total, onDone, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const me = useCurrentUser();
  const selfApprove = canApprove(me);
  const [reason, setReason] = useState<string | null>(null);
  const [other, setOther] = useState('');
  const [step, setStep] = useState<'reason' | 'pin'>('reason');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const finalReason = reason === 'Other' ? other.trim() : reason ?? '';

  function next() {
    if (!reason) return setError('Choose a reason.');
    if (reason === 'Other' && finalReason.length < 3) return setError('Write a short reason.');
    setError(null);
    if (selfApprove && me) {
      cancelBill(billId, me.name, finalReason);
      onDone();
    } else {
      setStep('pin');
    }
  }

  async function typePin(d: string) {
    if (pin.length >= 4) return;
    setError(null);
    const p = pin + d;
    setPin(p);
    if (p.length === 4) {
      const approver = await findApprover(p);
      if (approver) {
        cancelBill(billId, approver.name, finalReason);
        onDone();
      } else {
        setError('That is not an owner or manager PIN.');
        setTimeout(() => setPin(''), 350);
      }
    }
  }

  return (
    <BottomSheet onClose={onClose}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Cancel bill #{token}?</Text>
            <Text style={styles.sub}>
              {formatRupees(total)} will be removed from sales. The bill stays in Bills, marked as cancelled.
            </Text>

            {step === 'reason' ? (
              <>
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
                    placeholder="What happened?"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    autoFocus
                  />
                )}
                {error && <Text style={styles.error}>{error}</Text>}
                <Pressable style={styles.dangerBtn} onPress={next} accessibilityRole="button">
                  <Text style={styles.dangerText}>{selfApprove ? 'Cancel bill' : 'Next: owner or manager PIN'}</Text>
                </Pressable>
                <Pressable style={styles.keepBtn} onPress={onClose} accessibilityRole="button">
                  <Text style={styles.keepText}>Keep bill</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.label}>Ask an owner or manager to enter their PIN</Text>
                <View style={{ marginTop: 8 }}>
                  <PinPad length={pin.length} onDigit={typePin} onDelete={() => setPin((p) => p.slice(0, -1))} error={!!error} />
                </View>
                {error && <Text style={styles.error}>{error}</Text>}
                <Pressable style={styles.keepBtn} onPress={onClose} accessibilityRole="button">
                  <Text style={styles.keepText}>Keep bill</Text>
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
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, marginTop: 18, marginBottom: 8 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reason: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line },
  reasonActive: { borderColor: colors.danger, backgroundColor: '#FCEBEA' },
  reasonText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  reasonTextActive: { color: colors.danger },
  input: { height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 12, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, marginTop: 10 },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.danger, marginTop: 10 },
  dangerBtn: { height: 52, borderRadius: 14, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  dangerText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
  keepBtn: { height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  keepText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.brand },
});
