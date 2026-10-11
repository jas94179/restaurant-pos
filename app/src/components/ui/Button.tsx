import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, size, spacing, stroke, typography, useTheme } from '../../design';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'danger' | 'text';
export type ButtonSize = 'lg' | 'md' | 'sm';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

// galla Button. One Primary per screen; Accent (turmeric) for the one money action;
// Danger for recorded destructive actions, always next to a Text button to back out.
export default function Button({ label, onPress, variant = 'primary', size: sz = 'lg', disabled, loading, icon, fullWidth, accessibilityHint, style }: Props) {
  const { color } = useTheme();
  const off = disabled || loading;
  const bg = {
    primary: color.actionPrimary,
    accent: color.actionAccent,
    secondary: color.bgSurface,
    danger: color.actionDanger,
    text: 'transparent',
  }[variant];
  const fg = {
    primary: color.actionPrimaryText,
    accent: color.actionAccentText,
    secondary: color.textPrimary,
    danger: color.actionDangerText,
    text: color.textLink,
  }[variant];
  const height = { lg: size.controlLg, md: size.controlMd, sm: size.controlSm }[sz];
  const label_ = { lg: typography.labelLg, md: typography.labelMd, sm: typography.labelSm }[sz];

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      accessibilityHint={accessibilityHint}
      hitSlop={sz === 'sm' ? 4 : 0}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          paddingHorizontal: sz === 'sm' ? spacing[12] : variant === 'text' ? spacing[8] : spacing[20],
          borderRadius: sz === 'sm' ? radius.sm : radius.lg,
          backgroundColor: off && variant !== 'text' ? color.actionDisabled : bg,
        },
        variant === 'secondary' && !off && { borderWidth: stroke.default, borderColor: color.borderInput },
        pressed && variant === 'primary' && { backgroundColor: color.actionPrimaryPressed },
        pressed && variant !== 'primary' && { opacity: 0.8 },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[label_, { color: off ? color.actionDisabledText : fg }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
});
