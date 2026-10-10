import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import LegalDocView from '../components/LegalDocView';
import { clearErrors, getErrors } from '../db/database';
import { appVersion, shareReport } from '../data/crash';
import { saveSettings, useSettings } from '../data/settingsStore';
import { useCurrentUser } from '../data/staffStore';
import { LEGAL, PRIVACY, TERMS, parseAcceptance } from '../legal/legal';
import { colors, fonts } from '../theme';

// Profile → Terms and privacy: what was accepted, the documents, and the optional contact permission.
export function LegalScreen({ onBack }: { onBack: () => void }) {
  const settings = useSettings();
  const user = useCurrentUser();
  const acceptance = parseAcceptance(settings.legalAcceptance);
  const [doc, setDoc] = useState<'terms' | 'privacy'>('privacy');
  const isOwner = user?.role === 'owner';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button">
        <Text style={styles.backLink}>‹ Profile</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Accepted</Text>
        <Text style={styles.cardText}>
          {acceptance
            ? `By ${acceptance.by || 'the owner'} on ${new Date(acceptance.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}. Terms version ${acceptance.terms}, Privacy version ${acceptance.privacy}.`
            : 'Not accepted yet. The owner will be asked at next sign-in.'}
        </Text>
        {isOwner && acceptance && (
          <View style={styles.toggle}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>galla may contact me</Text>
              <Text style={styles.cardText}>About the trial and updates, by phone or WhatsApp. Optional.</Text>
            </View>
            <Switch
              value={acceptance.contactOk}
              onValueChange={(v) => saveSettings({ legalAcceptance: JSON.stringify({ ...acceptance, contactOk: v }) })}
              trackColor={{ true: colors.brand, false: colors.line }}
              thumbColor={colors.paper}
            />
          </View>
        )}
        <Text style={[styles.cardText, { marginTop: 10 }]}>
          Questions, or want to see, correct or delete your information? Contact {LEGAL.grievanceOfficer} at {LEGAL.contactEmail}.
        </Text>
      </View>

      <View style={styles.tabs}>
        {(['privacy', 'terms'] as const).map((d) => (
          <Pressable
            key={d}
            onPress={() => setDoc(d)}
            style={[styles.tab, doc === d && styles.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: doc === d }}
          >
            <Text style={[styles.tabText, doc === d && styles.tabTextOn]}>{d === 'privacy' ? 'Privacy Notice' : 'Terms of Use'}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[styles.card, { marginTop: 10 }]}>
        <LegalDocView doc={doc === 'privacy' ? PRIVACY : TERMS} />
      </View>
    </ScrollView>
  );
}

// Profile → Problem reports: errors saved on this phone, to send to galla if you want.
export function ProblemReportsScreen({ onBack }: { onBack: () => void }) {
  const [version, setVersion] = useState(0);
  const errors = useMemo(() => getErrors(), [version]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button">
        <Text style={styles.backLink}>‹ Profile</Text>
      </Pressable>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{errors.length ? `${errors.length} problem report${errors.length === 1 ? '' : 's'}` : 'No problems so far'}</Text>
        <Text style={styles.cardText}>
          When something goes wrong, galla saves technical details here. They stay on this phone. Send them to galla to help fix the problem. Reports never include bills, sales or customer details.
        </Text>
        <Text style={[styles.cardText, { marginTop: 6 }]}>App version {appVersion()}</Text>
        {errors.length > 0 && (
          <>
            <Pressable style={styles.primary} onPress={() => shareReport()} accessibilityRole="button">
              <Text style={styles.primaryText}>Send report to galla</Text>
            </Pressable>
            <Pressable
              style={styles.textBtn}
              onPress={() =>
                Alert.alert('Clear problem reports?', 'They will be removed from this phone.', [
                  { text: 'Keep', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: () => { clearErrors(); setVersion((v) => v + 1); } },
                ])
              }
              accessibilityRole="button"
            >
              <Text style={[styles.textBtnText, { color: colors.danger }]}>Clear reports</Text>
            </Pressable>
          </>
        )}
      </View>
      {errors.slice(0, 20).map((e) => (
        <View key={e.id} style={[styles.card, { paddingVertical: 12 }]}>
          <Text style={styles.errWhen}>
            {new Date(e.at).toLocaleString('en-IN')}
            {e.fatal ? '  ·  app closed' : ''}
          </Text>
          <Text style={styles.errMsg} numberOfLines={3}>
            {e.message}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  content: { padding: 16, paddingBottom: 40 },
  backLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.brand, marginBottom: 12 },
  card: { backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 16, marginTop: 12 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  cardText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 4 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  toggleTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  tabs: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 14, backgroundColor: colors.line, marginTop: 16 },
  tab: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: colors.paper },
  tabText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  tabTextOn: { color: colors.brand },
  primary: { height: 50, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
  textBtn: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  textBtnText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.brand },
  errWhen: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  errMsg: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink, marginTop: 4 },
});
