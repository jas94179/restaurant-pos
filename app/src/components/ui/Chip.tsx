import { Pressable, StyleSheet, Text } from 'react-native';
import { radius, size, spacing, stroke, typography, useTheme } from '../../design';

type Props = { label: string; selected?: boolean; solid?: boolean; onPress: () => void };

// Filters a list (menu categories, periods) or adds a quick choice (kitchen notes).
// `solid` is only for a single period picker.
export default function Chip({ label, selected, solid, onPress }: Props) {
  const { color } = useTheme();
  const bg = !selected ? color.bgSurface : solid ? color.actionPrimary : color.bgSelected;
  const bd = !selected ? color.borderInput : solid ? color.actionPrimary : color.borderSelected;
  const fg = !selected ? color.textSecondary : solid ? color.actionPrimaryText : color.textLink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      hitSlop={4}
      style={({ pressed }) => [styles.chip, { backgroundColor: bg, borderColor: bd }, pressed && { opacity: 0.8 }]}
    >
      <Text style={[typography.bodySm, styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { height: size.controlSm, paddingHorizontal: spacing[14], borderRadius: radius.full, borderWidth: stroke.default, justifyContent: 'center' },
  label: { fontFamily: 'BricolageGrotesque_600SemiBold' },
});
