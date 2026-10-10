import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Kot } from '../db/database';
import { printReceipt } from '../print/print';
import { kotReceipt } from '../print/receipts';
import { colors, fonts } from '../theme';

// Kitchen slip on screen (show the kitchen, or print it).
export default function KotSheet({ kot, onClose }: { kot: Kot; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const add = kot.items.filter((i) => i.qty > 0);
  const cancel = kot.items.filter((i) => i.qty < 0);
  const time = new Date(kot.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

  return (
    <View style={styles.backdrop}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <ScrollView>
          <View style={styles.paper}>
            <Text style={styles.kotNo}>KOT #{kot.kotNo}</Text>
            <Text style={styles.where}>{kot.tableNo != null ? `Table ${kot.tableNo}` : `Token #${kot.token ?? '-'}`}</Text>
            <Text style={styles.meta}>
              {time}
              {kot.staffName ? ` · ${kot.staffName}` : ''}
            </Text>
            <View style={styles.rule} />
            {add.map((i, idx) => (
              <View key={`a${idx}`} style={styles.item}>
                <Text style={styles.qty}>{i.qty} ×</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{i.name}</Text>
                  {!!i.note && <Text style={styles.note}>{i.note}</Text>}
                </View>
              </View>
            ))}
            {cancel.length > 0 && (
              <>
                <Text style={styles.cancelTitle}>Cancel</Text>
                {cancel.map((i, idx) => (
                  <View key={`c${idx}`} style={styles.item}>
                    <Text style={[styles.qty, { color: colors.danger }]}>{-i.qty} ×</Text>
                    <Text style={[styles.name, styles.cancelled]}>{i.name}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </ScrollView>
        {error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, styles.ghost]}
            onPress={async () => setError(await printReceipt(kotReceipt(kot)))}
            accessibilityRole="button"
          >
            <Text style={styles.ghostText}>Print</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.primary]} onPress={onClose} accessibilityRole="button">
            <Text style={styles.primaryText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', backgroundColor: colors.mist, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, paddingHorizontal: 16 },
  paper: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.line },
  kotNo: { fontFamily: fonts.bold, fontSize: 26, color: colors.ink, textAlign: 'center' },
  where: { fontFamily: fonts.bold, fontSize: 22, color: colors.brand, textAlign: 'center', marginTop: 2 },
  meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4 },
  rule: { borderBottomWidth: 2, borderColor: colors.ink, marginVertical: 12 },
  item: { flexDirection: 'row', gap: 10, paddingVertical: 6 },
  qty: { width: 44, fontFamily: fonts.bold, fontSize: 20, color: colors.ink },
  name: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink, flexShrink: 1 },
  note: { fontFamily: fonts.semibold, fontSize: 16, color: colors.turmericDeep, marginTop: 2 },
  cancelTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.danger, marginTop: 12, textTransform: 'uppercase' },
  cancelled: { color: colors.danger, textDecorationLine: 'line-through' },
  error: { fontFamily: fonts.semibold, fontSize: 14, color: colors.danger, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ghost: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.paper },
  ghostText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  primary: { backgroundColor: colors.brand },
  primaryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
});
