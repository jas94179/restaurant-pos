import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, useTheme } from '../../design';

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'offline';

// Short status in words: "Paid", "Cancelled", "Low stock", "Offline". Never colour alone.
export default function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const { color } = useTheme();
  const [bg, fg] = {
    neutral: [color.bgSelected, color.textLink],
    success: [color.statusSuccessBg, color.statusSuccess],
    danger: [color.statusDangerBg, color.statusDanger],
    warning: [color.statusWarningBg, color.statusWarning],
    offline: [color.statusOffline, color.textOnAccent],
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[typography.labelSm, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing[10], paddingVertical: spacing[2], borderRadius: radius.full },
});
