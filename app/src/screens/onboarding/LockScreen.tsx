import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PinPad from '../../components/PinPad';
import { checkOwnerPin, useSettings } from '../../data/settingsStore';
import { APP_NAME, colors, fonts } from '../../theme';

// Shown every time the app opens. Staff PINs will be added here later.
export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
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
      const ok = await checkOwnerPin(p);
      if (ok) {
        onUnlock();
      } else {
        setError(true);
        setAttempts((a) => a + 1);
        setTimeout(() => setPin(''), 350);
      }
    }
  }

  return (
    <View style={styles.screen}>
      <View>
        <Text style={styles.wordmark}>{APP_NAME}</Text>
        <Text style={styles.name}>{settings.restaurantName}</Text>
        <Text style={[styles.hint, error && styles.hintError]}>
          {error ? `Wrong PIN. Try again.${attempts >= 3 ? ' Ask the owner if you have forgotten it.' : ''}` : 'Enter your PIN'}
        </Text>
      </View>
      <PinPad length={pin.length} onDigit={type} onDelete={() => setPin((p) => p.slice(0, -1))} error={error} dark />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brand, paddingHorizontal: 28, paddingTop: 96, paddingBottom: 48, justifyContent: 'space-between' },
  wordmark: { fontFamily: fonts.bold, fontSize: 40, color: colors.turmeric, letterSpacing: -1.2 },
  name: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, color: colors.paper, marginTop: 12 },
  hint: { fontFamily: fonts.regular, fontSize: 17, color: '#CFE0D6', marginTop: 10 },
  hintError: { color: '#FFB4AB' },
});
