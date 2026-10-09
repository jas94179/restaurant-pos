import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

type Props = {
  length: number; // digits typed so far
  size?: number; // PIN length, 4 by default
  onDigit: (d: string) => void;
  onDelete: () => void;
  error?: boolean;
  dark?: boolean;
};

// Large number pad: faster and easier than the phone keyboard at a busy counter.
export default function PinPad({ length, size = 4, onDigit, onDelete, error, dark }: Props) {
  const fg = dark ? colors.paper : colors.ink;
  return (
    <View>
      <View style={styles.dots} accessibilityLabel={`${length} of ${size} digits entered`}>
        {Array.from({ length: size }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: error ? colors.danger : dark ? colors.turmeric : colors.brand },
              i < length && { backgroundColor: error ? colors.danger : dark ? colors.turmeric : colors.brand },
            ]}
          />
        ))}
      </View>
      <View style={styles.grid}>
        {KEYS.map((k, i) =>
          k === '' ? (
            <View key={i} style={styles.key} />
          ) : (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={k === 'del' ? 'Delete' : k}
              onPress={() => (k === 'del' ? onDelete() : onDigit(k))}
              style={({ pressed }) => [
                styles.key,
                k !== 'del' && { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : colors.paper },
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={[styles.keyText, { color: fg }, k === 'del' && styles.delText]}>
                {k === 'del' ? 'Delete' : k}
              </Text>
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginBottom: 32 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  key: { width: '31%', height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontFamily: fonts.semibold, fontSize: 28 },
  delText: { fontSize: 16 },
});
