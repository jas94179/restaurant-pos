import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import BottomSheet from './BottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

type Props = { message: string; onClose: () => void };

// Sends the bill through WhatsApp. With a number: opens that chat directly.
// Without: WhatsApp asks which contact to send it to.
export default function WhatsAppShareSheet({ message, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const digits = phone.replace(/\D/g, '').replace(/^0+/, '');
    let number = '';
    if (digits) {
      if (digits.length === 10) number = `91${digits}`;
      else if (digits.length === 12 && digits.startsWith('91')) number = digits;
      else return setError('Enter a 10-digit mobile number, or leave it empty.');
    }
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(url);
      onClose();
    } catch {
      // WhatsApp not installed: fall back to the phone's share menu.
      await Share.share({ message });
      onClose();
    }
  }

  return (
    <BottomSheet onClose={onClose}>
          <Text style={styles.title}>Send bill on WhatsApp</Text>
          <Text style={styles.label}>Customer's mobile number (optional)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                setError(null);
              }}
              placeholder="10-digit number"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              maxLength={14}
              style={styles.input}
              autoFocus
            />
          </View>
          <Text style={styles.hint}>Leave it empty to choose a contact inside WhatsApp.</Text>
          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Pressable style={styles.cancel} onPress={onClose} accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.send} onPress={send} accessibilityRole="button">
              <Text style={styles.sendText}>Open WhatsApp</Text>
            </Pressable>
          </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,42,31,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20 },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted, marginTop: 14, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 12, gap: 8 },
  prefix: { fontFamily: fonts.semibold, fontSize: 17, color: colors.muted },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 18, color: colors.ink, paddingVertical: 0 },
  hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 6 },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.danger, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  cancel: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  send: { flex: 2, height: 50, borderRadius: 12, backgroundColor: '#1F8F4E', alignItems: 'center', justifyContent: 'center' },
  sendText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
});
