import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { upiLink } from './UpiQrSheet';
import { formatRupees } from '../utils/money';
import { colors, fonts } from '../theme';

type Line = { name: string; qty: number; amount: number };

type Props = {
  restaurantName: string;
  tableNo: number;
  lines: Line[];
  subtotal: number;
  gst: number;
  gstRate: number;
  pricesIncludeGst: boolean;
  total: number;
  upiId: string;
  onShare: () => void;
  onClose: () => void;
};

// Table pre-bill: shown to the guest before they pay, with a UPI QR for the exact
// amount. Not a tax invoice; the invoice number is given when the table is settled.
// Later this same layout prints on the 57 mm printer.
export default function PreBillSheet({
  restaurantName,
  tableNo,
  lines,
  subtotal,
  gst,
  gstRate,
  pricesIncludeGst,
  total,
  upiId,
  onShare,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const half = Math.floor(gst / 2);
  return (
    <View style={styles.backdrop}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
          <View style={styles.paper}>
            <Text style={styles.restaurant}>{restaurantName}</Text>
            <Text style={styles.sub}>Table {tableNo} · Bill</Text>
            <View style={styles.rule} />

            {lines.map((l, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.item} numberOfLines={2}>
                  {l.name}
                </Text>
                <Text style={styles.qty}>×{l.qty}</Text>
                <Text style={styles.amt}>{formatRupees(l.amount)}</Text>
              </View>
            ))}

            <View style={styles.rule} />
            {gstRate > 0 && (
              <>
                <Row label={pricesIncludeGst ? 'Before GST' : 'Subtotal'} value={formatRupees(subtotal)} />
                <Row label={`CGST ${gstRate / 2}%`} value={formatRupees(half)} />
                <Row label={`SGST ${gstRate / 2}%`} value={formatRupees(gst - half)} />
              </>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>To pay</Text>
              <Text style={styles.totalValue}>{formatRupees(total)}</Text>
            </View>

            {upiId ? (
              <View style={styles.qrWrap}>
                <View style={styles.qrBox} accessibilityLabel={`UPI QR code for ${formatRupees(total)}`}>
                  <QRCode value={upiLink(upiId, restaurantName, total, `Table ${tableNo}`)} size={170} color={colors.ink} backgroundColor="#FFFFFF" />
                </View>
                <Text style={styles.qrHint}>Scan with any UPI app to pay {formatRupees(total)}</Text>
                <Text style={styles.upi}>{upiId}</Text>
              </View>
            ) : null}

            <Text style={styles.foot}>This is not a tax invoice. Your invoice is given after payment.</Text>
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={onShare} accessibilityRole="button">
            <Text style={styles.btnGhostText}>Send on WhatsApp</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onClose} accessibilityRole="button">
            <Text style={styles.btnPrimaryText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.item, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.amt, { color: colors.muted }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', backgroundColor: colors.mist, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, paddingHorizontal: 16 },
  paper: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.line },
  restaurant: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink, textAlign: 'center' },
  sub: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 2 },
  rule: { borderBottomWidth: 1, borderStyle: 'dashed', borderColor: colors.line, marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 3, gap: 8 },
  item: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  qty: { width: 36, fontFamily: fonts.regular, fontSize: 15, color: colors.muted, textAlign: 'right' },
  amt: { minWidth: 72, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
  totalLabel: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink },
  totalValue: { fontFamily: fonts.bold, fontSize: 24, color: colors.brand },
  qrWrap: { alignItems: 'center', marginTop: 16 },
  qrBox: { padding: 10, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: colors.line },
  qrHint: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, marginTop: 10, textAlign: 'center' },
  upi: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  foot: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.paper },
  btnGhostText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  btnPrimary: { backgroundColor: colors.brand },
  btnPrimaryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
});
