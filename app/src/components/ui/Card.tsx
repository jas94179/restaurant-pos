import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, spacing, stroke, useTheme } from '../../design';

// Groups related content on bg-app. Flat with a hairline border; no shadow in the app.
export default function Card({ children, padded = true, style }: { children: ReactNode; padded?: boolean; style?: StyleProp<ViewStyle> }) {
  const { color } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: color.bgSurface, borderColor: color.borderDefault }, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, borderWidth: stroke.hairline, overflow: 'hidden' },
  padded: { padding: spacing[16] },
});
