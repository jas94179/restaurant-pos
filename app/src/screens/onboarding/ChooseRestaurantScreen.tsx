import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RestaurantEntry } from '../../data/restaurants';
import { APP_NAME, colors, fonts } from '../../theme';

// Sign in, step 1: which restaurant. Prototype stand-in for the owner's mobile
// number; in the real app the number decides the restaurant.
export default function ChooseRestaurantScreen({
  restaurants,
  onPick,
  onBack,
}: {
  restaurants: RestaurantEntry[];
  onPick: (file: string) => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.screen}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" style={styles.back}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>
      <Text style={styles.wordmark}>{APP_NAME}</Text>
      <Text style={styles.title} accessibilityRole="header">
        Sign in to
      </Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list}>
        {restaurants.map((r) => (
          <Pressable
            key={r.file}
            onPress={() => onPick(r.file)}
            style={({ pressed }) => [styles.card, pressed && { backgroundColor: 'rgba(255,255,255,0.14)' }]}
            accessibilityRole="button"
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(r.name.trim()[0] ?? 'R').toUpperCase()}</Text>
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {r.name}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.note}>In the full app, you'll sign in with the owner's mobile number.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brand, paddingHorizontal: 28, paddingTop: 64, paddingBottom: 40 },
  back: { alignSelf: 'flex-start', marginBottom: 20 },
  backText: { fontFamily: fonts.semibold, fontSize: 16, color: '#CFE0D6' },
  wordmark: { fontFamily: fonts.bold, fontSize: 40, color: colors.turmeric, letterSpacing: -1.2 },
  title: { fontFamily: fonts.bold, fontSize: 30, color: colors.paper, marginTop: 12, marginBottom: 16 },
  list: { gap: 12, paddingBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.turmeric, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 20, color: colors.brandDeep },
  name: { flex: 1, fontFamily: fonts.semibold, fontSize: 18, color: colors.paper },
  chevron: { fontFamily: fonts.regular, fontSize: 28, color: '#CFE0D6', marginTop: -2 },
  note: { fontFamily: fonts.regular, fontSize: 13, color: '#9DB8AA', textAlign: 'center', marginTop: 12 },
});
