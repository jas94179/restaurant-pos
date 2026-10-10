import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PinPad from '../../components/PinPad';
import { useSettings } from '../../data/settingsStore';
import { loginWithPin } from '../../data/staffStore';
import { APP_NAME, colors, fonts } from '../../theme';

// Sign in: each person types their own PIN. In the real app this comes after
// signing in with the mobile number.
export default function LockScreen({ onBack }: { onBack: () => void }) {
  const settings = useSettings();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  async function type(d: string) {
    if (pin.length >= 4) return;
    setError(false);
    const p = pin + d;
    setPin(p);
    if (p.length === 4) {
      const user = await loginWithPin(p);
      if (!user) {
        setError(true);
        setAttempts((a) => a + 1);
        setTimeout(() => setPin(''), 350);
      }
    }
  }

  return (
    <View style={styles.screen}>
      <View>
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.wordmark}>{APP_NAME}</Text>
        <Text style={styles.name}>{settings.restaurantName}</Text>
        <Text style={[styles.hint, error && styles.hintError]}>
          {error ? `That PIN doesn't match anyone.${attempts >= 3 ? ' Ask the owner to reset your PIN.' : ' Try again.'}` : 'Enter your PIN'}
        </Text>
      </View>
      <PinPad length={pin.length} onDigit={type} onDelete={() => setPin((p) => p.slice(0, -1))} error={error} dark />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brand, paddingHorizontal: 28, paddingTop: 64, paddingBottom: 48, justifyContent: 'space-between' },
  back: { alignSelf: 'flex-start', marginBottom: 20 },
  backText: { fontFamily: fonts.semibold, fontSize: 16, color: '#CFE0D6' },
  wordmark: { fontFamily: fonts.bold, fontSize: 40, color: colors.turmeric, letterSpacing: -1.2 },
  name: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, color: colors.paper, marginTop: 12 },
  hint: { fontFamily: fonts.regular, fontSize: 17, color: '#CFE0D6', marginTop: 10 },
  hintError: { color: '#FFB4AB' },
});
