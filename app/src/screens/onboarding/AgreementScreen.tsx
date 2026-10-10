import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '../../components/BottomSheet';
import LegalDocView from '../../components/LegalDocView';
import { KEY_POINTS, LEGAL, PRIVACY, TERMS, type Acceptance, type LegalDoc } from '../../legal/legal';
import { APP_NAME, colors, fonts } from '../../theme';

type Props = {
  ownerName?: string; // known when an existing owner is asked again
  updated?: boolean; // terms changed since they last accepted
  onAccept: (a: Acceptance) => void;
  onBack?: () => void;
};

// Shown before setting up a restaurant (and again if the terms change).
// The three required boxes must be ticked; contact permission is optional and off.
export default function AgreementScreen({ ownerName, updated, onAccept, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [authorised, setAuthorised] = useState(false);
  const [contactOk, setContactOk] = useState(false);
  const [reading, setReading] = useState<LegalDoc | null>(null);
  const ready = terms && privacy && authorised;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
        )}
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {updated ? 'We updated our terms' : 'Before you start'}
        </Text>
        <Text style={styles.lead}>
          {updated
            ? 'Please read and accept the new version to keep using galla.'
            : 'A quick, honest summary. Tap to read the full documents.'}
        </Text>

        <View style={styles.points}>
          {KEY_POINTS.map((p) => (
            <View key={p} style={styles.point}>
              <View style={styles.pointDot} />
              <Text style={styles.pointText}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={styles.docs}>
          <DocButton label="Read Terms of Use" onPress={() => setReading(TERMS)} />
          <DocButton label="Read Privacy Notice" onPress={() => setReading(PRIVACY)} />
        </View>

        <Check checked={terms} onToggle={() => setTerms((v) => !v)} label="I have read and agree to the Terms of Use." />
        <Check
          checked={privacy}
          onToggle={() => setPrivacy((v) => !v)}
          label="I have read the Privacy Notice and understand how galla handles information."
        />
        <Check
          checked={authorised}
          onToggle={() => setAuthorised((v) => !v)}
          label="I am 18 or older and I own this restaurant or am allowed to accept for it."
        />
        <Check
          checked={contactOk}
          onToggle={() => setContactOk((v) => !v)}
          label="Optional: galla may contact me by phone or WhatsApp about the trial and updates."
          optional
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          disabled={!ready}
          onPress={() =>
            onAccept({
              terms: LEGAL.termsVersion,
              privacy: LEGAL.privacyVersion,
              at: new Date().toISOString(),
              by: ownerName ?? '',
              contactOk,
            })
          }
          style={[styles.cta, !ready && { opacity: 0.4 }]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !ready }}
        >
          <Text style={styles.ctaText}>Agree and continue</Text>
        </Pressable>
        {!ready && <Text style={styles.needed}>Tick the first three boxes to continue.</Text>}
      </View>

      {reading && (
        <BottomSheet onClose={() => setReading(null)}>
          <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
            <LegalDocView doc={reading} />
          </ScrollView>
        </BottomSheet>
      )}
    </View>
  );
}

function DocButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.docBtn, pressed && { opacity: 0.8 }]} accessibilityRole="button">
      <Text style={styles.docText}>{label}</Text>
      <Text style={styles.docArrow}>›</Text>
    </Pressable>
  );
}

function Check({ checked, onToggle, label, optional }: { checked: boolean; onToggle: () => void; label: string; optional?: boolean }) {
  return (
    <Pressable
      onPress={onToggle}
      style={styles.check}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <View style={[styles.box, checked && styles.boxOn]}>{checked && <Text style={styles.tick}>✓</Text>}</View>
      <Text style={[styles.checkText, optional && { color: colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  back: { fontFamily: fonts.semibold, fontSize: 16, color: colors.brand, marginBottom: 12 },
  brand: { fontFamily: fonts.bold, fontSize: 28, color: colors.brand, letterSpacing: -0.8 },
  title: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, color: colors.ink, marginTop: 8 },
  lead: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted, marginTop: 6 },
  points: { marginTop: 18, padding: 16, borderRadius: 16, backgroundColor: '#E6F4EA', gap: 10 },
  point: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  pointDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand, marginTop: 7 },
  pointText: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.brandDeep },
  docs: { marginTop: 14, gap: 10 },
  docBtn: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line },
  docText: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.brand },
  docArrow: { fontFamily: fonts.regular, fontSize: 26, color: colors.muted, marginTop: -2 },
  check: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 18 },
  box: { width: 26, height: 26, borderRadius: 7, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  boxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  tick: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper, marginTop: -1 },
  checkText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.ink },
  footer: { paddingHorizontal: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paper },
  cta: { height: 56, borderRadius: 16, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.bold, fontSize: 17, color: colors.paper },
  needed: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
