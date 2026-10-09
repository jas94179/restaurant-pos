import { Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatRupees } from '../utils/money';
import { colors, fonts } from '../theme';

type Props = {
  upiId: string;
  payeeName: string;
  amount: number; // paise
  note: string; // shows in the customer's UPI app, e.g. "Bill 12"
  onPaid: () => void;
  onBack: () => void;
};

// Standard UPI payment link. Any UPI app (GPay, PhonePe, Paytm, BHIM) opens it with the amount filled in.
export function upiLink(upiId: string, payeeName: string, amount: number, note: string): string {
  const params = [
    `pa=${encodeURIComponent(upiId)}`,
    `pn=${encodeURIComponent(payeeName)}`,
    `am=${(amount / 100).toFixed(2)}`,
    'cu=INR',
    `tn=${encodeURIComponent(note)}`,
  ];
  return `upi://pay?${params.join('&')}`;
}

// Big QR for the customer to scan. There is no payment gateway, so staff confirm
// the payment on their own phone or soundbox before tapping "Payment received".
export default function UpiQrSheet({ upiId, payeeName, amount, note, onPaid, onBack }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.backdrop}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.payee} numberOfLines={1}>
          {payeeName}
        </Text>
        <Text style={styles.amount}>{formatRupees(amount)}</Text>
        <Text style={styles.hint}>Scan with any UPI app. The amount is filled in.</Text>

        <View style={styles.qrBox} accessibilityLabel={`UPI QR code for ${formatRupees(amount)}`}>
          <QRCode value={upiLink(upiId, payeeName, amount, note)} size={220} color={colors.ink} backgroundColor="#FFFFFF" />
        </View>
        <Text style={styles.upiId}>{upiId}</Text>

        <View style={styles.check}>
          <Text style={styles.checkText}>
            Before tapping below, check the payment arrived in your UPI app or soundbox.
          </Text>
        </View>

        <Pressable style={styles.paidBtn} onPress={onPaid} accessibilityRole="button">
          <Text style={styles.paidText}>Payment received</Text>
        </Pressable>
        <Pressable style={styles.backBtn} onPress={onBack} accessibilityRole="button">
          <Text style={styles.backText}>Back to bill</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,42,31,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, alignItems: 'center' },
  payee: { fontFamily: fonts.semibold, fontSize: 16, color: colors.muted },
  amount: { fontFamily: fonts.bold, fontSize: 40, color: colors.ink, marginTop: 2, letterSpacing: -1 },
  hint: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 2 },
  qrBox: { marginTop: 16, padding: 14, borderRadius: 18, borderWidth: 2, borderColor: colors.line, backgroundColor: '#FFFFFF' },
  upiId: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 10 },
  check: { alignSelf: 'stretch', marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: '#FBF0D2' },
  checkText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.brandDeep },
  paidBtn: { alignSelf: 'stretch', height: 54, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  paidText: { fontFamily: fonts.bold, fontSize: 17, color: colors.paper },
  backBtn: { alignSelf: 'stretch', height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  backText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.brand },
});
