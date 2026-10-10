import { StyleSheet, Text, View } from 'react-native';
import type { LegalDoc } from '../legal/legal';
import { colors, fonts } from '../theme';

// Readable layout for the Terms of Use and Privacy Notice.
export default function LegalDocView({ doc }: { doc: LegalDoc }) {
  return (
    <View>
      <Text style={styles.title} accessibilityRole="header">
        {doc.title}
      </Text>
      <Text style={styles.intro}>{doc.intro}</Text>
      {doc.sections.map((s) => (
        <View key={s.heading} style={styles.section}>
          <Text style={styles.heading}>{s.heading}</Text>
          {s.body.map((p, i) => (
            <Text key={i} style={styles.p}>
              {p}
            </Text>
          ))}
          {s.bullets?.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.dot}>•</Text>
              <Text style={[styles.p, { flex: 1, marginTop: 0 }]}>{b}</Text>
            </View>
          ))}
        </View>
      ))}
      {doc.hindiSummary && (
        <View style={styles.hindi}>
          <Text style={styles.heading}>सारांश (हिंदी में)</Text>
          {doc.hindiSummary.map((h, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.dot}>•</Text>
              <Text style={[styles.p, { flex: 1, marginTop: 0 }]}>{h}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.ink },
  intro: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted, marginTop: 8 },
  section: { marginTop: 18 },
  heading: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, marginBottom: 4 },
  p: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.ink, marginTop: 4 },
  bulletRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  dot: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, color: colors.turmericDeep },
  hindi: { marginTop: 22, padding: 14, borderRadius: 14, backgroundColor: colors.mist },
});
