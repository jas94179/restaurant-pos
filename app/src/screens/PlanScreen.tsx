import { useState } from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../data/settingsStore';
import { PLAN_LABEL, PLANS, PlanInfo, SUPPORT_WHATSAPP } from '../data/plans';
import { useCurrentUser } from '../data/staffStore';
import { colors, fonts } from '../theme';

// Current plan and the option to upgrade or change. The request goes to the
// galla team on WhatsApp; we switch the plan for them (no online payment yet).
export default function PlanScreen({ onBack }: { onBack: () => void }) {
  const settings = useSettings();
  const user = useCurrentUser();
  const [sent, setSent] = useState<string | null>(null);
  const current = settings.plan;
  const onPilot = current === 'pilot';

  async function request(plan: PlanInfo) {
    const message =
      `Hi galla team, please change our plan to ${plan.name}` +
      (plan.price ? ` (Rs ${plan.price}/month)` : '') +
      `.\nRestaurant: ${settings.restaurantName}` +
      `\nCurrent plan: ${PLAN_LABEL[current]}` +
      (user ? `\nRequested by: ${user.name}` : '');
    try {
      await Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`);
    } catch {
      await Share.share({ message });
    }
    setSent(plan.name);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button">
        <Text style={styles.backLink}>‹ Profile</Text>
      </Pressable>

      <View style={styles.currentCard}>
        <Text style={styles.currentLabel}>Your plan</Text>
        <Text style={styles.currentName}>{PLAN_LABEL[current]}</Text>
        <Text style={styles.currentNote}>
          {onPilot
            ? 'Thank you for piloting galla. Every feature is free during the pilot. Pick a plan below for when the pilot ends.'
            : 'Need more? Upgrade any time. Your bills, menu and staff stay as they are.'}
        </Text>
      </View>

      {sent && (
        <View style={styles.sentBox}>
          <Text style={styles.sentText}>
            Request for {sent} sent. We'll confirm on WhatsApp and switch your plan within a day.
          </Text>
        </View>
      )}

      {PLANS.map((p) => {
        const isCurrent = p.id === current;
        return (
          <View key={p.id} style={[styles.planCard, isCurrent && styles.planCardCurrent]}>
            <View style={styles.planTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{p.name}</Text>
                <Text style={styles.planTagline}>{p.tagline}</Text>
              </View>
              <Text style={styles.price}>
                {p.price === 0 ? 'Free' : `₹${p.price.toLocaleString('en-IN')}`}
                {p.price > 0 && <Text style={styles.perMonth}>/month</Text>}
              </Text>
            </View>
            {p.features.map((f) => (
              <Text key={f} style={styles.feature}>
                ✓  {f}
              </Text>
            ))}
            {isCurrent ? (
              <View style={styles.currentPill}>
                <Text style={styles.currentPillText}>Current plan</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => request(p)}
                style={({ pressed }) => [styles.chooseBtn, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
              >
                <Text style={styles.chooseText}>{onPilot ? `Choose ${p.name}` : `Switch to ${p.name}`}</Text>
              </Pressable>
            )}
          </View>
        );
      })}

      <Text style={styles.footnote}>
        Prices are per restaurant per month. Pay by UPI each month; no card needed. You can change or stop your plan any
        time, and your data is never deleted.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  content: { padding: 16, paddingBottom: 40 },
  backLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.brand },
  currentCard: { marginTop: 12, padding: 18, borderRadius: 20, backgroundColor: colors.brand },
  currentLabel: { fontFamily: fonts.semibold, fontSize: 13, color: '#CFE0D6' },
  currentName: { fontFamily: fonts.bold, fontSize: 24, color: colors.turmeric, marginTop: 2 },
  currentNote: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.paper, marginTop: 8 },
  sentBox: { marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: '#E5F2EA' },
  sentText: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.brand },
  planCard: { marginTop: 14, padding: 16, borderRadius: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  planCardCurrent: { borderColor: colors.turmeric, borderWidth: 2 },
  planTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  planName: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink },
  planTagline: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  price: { fontFamily: fonts.bold, fontSize: 20, color: colors.brand },
  perMonth: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  feature: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.ink },
  chooseBtn: { marginTop: 14, height: 46, borderRadius: 12, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  chooseText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.paper },
  currentPill: { marginTop: 14, height: 46, borderRadius: 12, backgroundColor: '#FBF0D2', alignItems: 'center', justifyContent: 'center' },
  currentPillText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.turmericDeep },
  footnote: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.muted, marginTop: 18, marginHorizontal: 4 },
});
