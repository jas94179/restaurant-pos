import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, stroke, typography, useTheme } from '../../design';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

// Stays on screen until the problem is fixed, e.g. "Printer not connected".
// For a passing confirmation use a toast instead.
export default function Banner({ title, message, tone = 'info' }: { title: string; message?: string; tone?: BannerTone }) {
  const { color } = useTheme();
  const [bg, fg] = {
    info: [color.bgSelected, color.textLink],
    success: [color.statusSuccessBg, color.statusSuccess],
    warning: [color.statusWarningBg, color.statusWarning],
    danger: [color.statusDangerBg, color.statusDanger],
  }[tone];
  return (
    <View style={[styles.banner, { backgroundColor: bg, borderColor: fg }]} accessibilityRole={tone === 'danger' || tone === 'warning' ? 'alert' : undefined}>
      <Text style={[typography.bodyMd, styles.title, { color: fg }]}>{title}</Text>
      {message ? <Text style={[typography.bodySm, { color: color.textPrimary }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { padding: spacing[14], borderRadius: radius.lg, borderWidth: stroke.hairline, gap: spacing[4] },
  title: { fontFamily: 'BricolageGrotesque_600SemiBold' },
});
