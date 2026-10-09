import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../data/settingsStore';
import { APP_NAME, colors, fonts } from '../theme';

// Top bar on every screen inside the app: brand and restaurant on the left, profile on the right.
export default function AppHeader({ onProfile }: { onProfile: () => void }) {
  const { restaurantName } = useSettings();
  const initial = (restaurantName.trim()[0] ?? 'R').toUpperCase();

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <View style={styles.coin}>
          <Text style={styles.coinText}>₹</Text>
        </View>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {restaurantName}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onProfile}
        style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel="Profile and settings"
        hitSlop={8}
      >
        <Text style={styles.avatarText}>{initial}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.brand, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  coin: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.turmeric, borderWidth: 2, borderColor: colors.turmericDeep, alignItems: 'center', justifyContent: 'center' },
  coinText: { fontFamily: fonts.bold, fontSize: 16, color: colors.brandDeep },
  brand: { fontFamily: fonts.bold, fontSize: 13, color: colors.turmeric, letterSpacing: -0.2 },
  name: { fontFamily: fonts.bold, fontSize: 18, color: colors.paper },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 17, color: colors.paper },
});
