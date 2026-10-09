import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import PinPad from '../../components/PinPad';
import { loadSampleMenu } from '../../data/menuStore';
import { makePinHash, OutletType, saveSettings } from '../../data/settingsStore';
import { menuIsEmpty } from '../../db/database';
import { colors, fonts } from '../../theme';

type Step = 'name' | 'type' | 'tables' | 'menu' | 'pin' | 'confirm';

const OUTLET_TYPES: { key: OutletType; title: string; body: string }[] = [
  { key: 'counter', title: 'Counter', body: 'Customers order and pay at the counter, then collect with a token. Bakeries, sweet shops, cafés, fast food.' },
  { key: 'dine_in', title: 'Dine-in', body: 'Customers sit at tables and pay when they finish. Restaurants and dhabas.' },
  { key: 'both', title: 'Both', body: 'Tables for dine-in, plus takeaway and parcels at the counter.' },
];

const GSTIN_PATTERN = /^[0-9]{2}[A-Z0-9]{13}$/;

export default function SetupScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [outletType, setOutletType] = useState<OutletType | null>(null);
  const [tableCount, setTableCount] = useState(10);
  const [menuChoice, setMenuChoice] = useState<'sample' | 'empty' | null>(null);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const needsMenuStep = useMemo(() => menuIsEmpty(), []);
  const steps: Step[] = useMemo(() => {
    const s: Step[] = ['name', 'type'];
    if (outletType !== 'counter') s.push('tables');
    if (needsMenuStep) s.push('menu');
    s.push('pin', 'confirm');
    return s;
  }, [outletType, needsMenuStep]);

  const [index, setIndex] = useState(0);
  const step = steps[Math.min(index, steps.length - 1)];
  // The PIN confirm screen counts as part of the PIN step for the progress text.
  const visibleSteps = steps.filter((s) => s !== 'confirm');
  const visibleIndex = Math.min(visibleSteps.indexOf(step === 'confirm' ? 'pin' : step), visibleSteps.length - 1);

  function next() {
    setError(null);
    setIndex((i) => Math.min(i + 1, steps.length - 1));
  }
  function back() {
    setError(null);
    if (step === 'confirm') setConfirm('');
    if (step === 'pin') setPin('');
    if (index === 0) onBack();
    else setIndex((i) => i - 1);
  }

  function continueFromName() {
    const n = name.trim();
    if (n.length < 2) return setError('Enter your restaurant name.');
    const g = gstin.trim().toUpperCase();
    if (g && !GSTIN_PATTERN.test(g)) return setError('GSTIN should be 15 characters, like 07ABCDE1234F1Z5. You can also leave it empty.');
    setGstin(g);
    next();
  }

  async function finish(confirmPin: string) {
    if (confirmPin !== pin) {
      setError("PINs don't match. Enter your new PIN again.");
      setPin('');
      setConfirm('');
      setIndex(steps.indexOf('pin'));
      return;
    }
    setSaving(true);
    try {
      const { hash, salt } = await makePinHash(pin);
      if (needsMenuStep && menuChoice === 'sample') loadSampleMenu();
      saveSettings({
        restaurantName: name.trim(),
        gstin,
        outletType: outletType ?? 'both',
        tableCount: outletType === 'counter' ? 0 : tableCount,
        plan: 'pilot',
        ownerPinHash: hash,
        ownerPinSalt: salt,
        setupDone: true,
      });
      onDone();
    } catch {
      setSaving(false);
      setError('Could not save your setup. Please try again.');
    }
  }

  function typePin(d: string) {
    setError(null);
    if (step === 'pin') {
      const p = (pin + d).slice(0, 4);
      setPin(p);
      if (p.length === 4) setTimeout(next, 150);
    } else {
      const c = (confirm + d).slice(0, 4);
      setConfirm(c);
      if (c.length === 4) finish(c);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topBar}>
        <Pressable onPress={back} hitSlop={12} accessibilityRole="button">
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.progress}>
          Step {visibleIndex + 1} of {visibleSteps.length}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${((visibleIndex + 1) / visibleSteps.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 'name' && (
          <>
            <Text style={styles.heading}>What's your restaurant called?</Text>
            <Text style={styles.sub}>This name prints on every bill.</Text>
            <Text style={styles.label}>Restaurant name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Sharma Sweets"
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoFocus
              returnKeyType="next"
            />
            <Text style={styles.label}>GSTIN (optional)</Text>
            <TextInput
              value={gstin}
              onChangeText={setGstin}
              placeholder="15 characters"
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={15}
            />
          </>
        )}

        {step === 'type' && (
          <>
            <Text style={styles.heading}>How do customers order?</Text>
            <Text style={styles.sub}>You can change this later in settings.</Text>
            <View style={styles.options}>
              {OUTLET_TYPES.map((o) => {
                const active = outletType === o.key;
                return (
                  <Pressable
                    key={o.key}
                    onPress={() => setOutletType(o.key)}
                    style={[styles.option, active && styles.optionActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>{active && <View style={styles.radioDot} />}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionTitle}>{o.title}</Text>
                      <Text style={styles.optionBody}>{o.body}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {step === 'tables' && (
          <>
            <Text style={styles.heading}>How many tables do you have?</Text>
            <Text style={styles.sub}>A rough number is fine. You can change it later.</Text>
            <View style={styles.counter}>
              <Pressable style={styles.countBtn} onPress={() => setTableCount((n) => Math.max(1, n - 1))} accessibilityLabel="Fewer tables">
                <Text style={styles.countBtnText}>−</Text>
              </Pressable>
              <Text style={styles.countValue} accessibilityLiveRegion="polite">{tableCount}</Text>
              <Pressable style={styles.countBtn} onPress={() => setTableCount((n) => Math.min(60, n + 1))} accessibilityLabel="More tables">
                <Text style={styles.countBtnText}>+</Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 'menu' && (
          <>
            <Text style={styles.heading}>Start with a menu</Text>
            <Text style={styles.sub}>You can add, edit or delete items any time in the Menu tab.</Text>
            <View style={styles.options}>
              {[
                { key: 'sample' as const, title: 'Use a sample menu', body: '16 common dishes to try billing straight away. Edit them to match your menu.' },
                { key: 'empty' as const, title: 'Start empty', body: 'Add your own categories and items yourself.' },
              ].map((o) => {
                const active = menuChoice === o.key;
                return (
                  <Pressable key={o.key} onPress={() => setMenuChoice(o.key)} style={[styles.option, active && styles.optionActive]} accessibilityRole="radio" accessibilityState={{ selected: active }}>
                    <View style={[styles.radio, active && styles.radioActive]}>{active && <View style={styles.radioDot} />}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionTitle}>{o.title}</Text>
                      <Text style={styles.optionBody}>{o.body}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {(step === 'pin' || step === 'confirm') && (
          <>
            <Text style={styles.heading}>{step === 'pin' ? 'Create your owner PIN' : 'Enter the PIN again'}</Text>
            <Text style={styles.sub}>
              {step === 'pin'
                ? 'You will use this 4-digit PIN to open the app. Keep it private.'
                : 'Just to make sure it is right.'}
            </Text>
            <View style={styles.pinWrap}>
              <PinPad
                length={step === 'pin' ? pin.length : confirm.length}
                onDigit={typePin}
                onDelete={() => (step === 'pin' ? setPin((p) => p.slice(0, -1)) : setConfirm((c) => c.slice(0, -1)))}
                error={!!error}
              />
            </View>
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {step !== 'pin' && step !== 'confirm' && (
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.cta,
              ((step === 'type' && !outletType) || (step === 'menu' && !menuChoice)) && styles.ctaDisabled,
            ]}
            disabled={(step === 'type' && !outletType) || (step === 'menu' && !menuChoice) || saving}
            onPress={step === 'name' ? continueFromName : next}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 },
  back: { fontFamily: fonts.semibold, fontSize: 16, color: colors.brand },
  progress: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  track: { height: 4, marginHorizontal: 24, borderRadius: 2, backgroundColor: colors.line, overflow: 'hidden' },
  trackFill: { height: 4, backgroundColor: colors.turmeric },
  body: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },
  heading: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 38, color: colors.ink, letterSpacing: -0.8 },
  sub: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.muted, marginTop: 8, marginBottom: 8 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, marginTop: 20, marginBottom: 8 },
  input: { height: 54, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.paper, paddingHorizontal: 16, fontSize: 18, fontFamily: fonts.regular, color: colors.ink },
  options: { gap: 12, marginTop: 16 },
  option: { flexDirection: 'row', gap: 14, padding: 18, borderRadius: 16, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.paper },
  optionActive: { borderColor: colors.brand, borderWidth: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.line, marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.brand },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },
  optionTitle: { fontFamily: fonts.bold, fontSize: 19, color: colors.ink },
  optionBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 4 },
  counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: 40 },
  countBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.paper, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  countBtnText: { fontFamily: fonts.semibold, fontSize: 30, color: colors.brand },
  countValue: { fontFamily: fonts.bold, fontSize: 72, color: colors.ink, minWidth: 110, textAlign: 'center' },
  pinWrap: { marginTop: 32 },
  error: { fontFamily: fonts.regular, color: colors.danger, fontSize: 15, marginTop: 16 },
  footer: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 8 },
  cta: { height: 58, borderRadius: 16, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { opacity: 0.35 },
  ctaText: { fontFamily: fonts.bold, fontSize: 18, color: colors.paper },
});
