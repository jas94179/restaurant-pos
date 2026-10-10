import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { saveSettings, useSettings } from '../data/settingsStore';
import { bluetoothPrintingAvailable, listPairedDevices, type PairedDevice } from '../print/bluetooth';
import { printReceipt } from '../print/print';
import { testReceipt } from '../print/receipts';
import { colors, fonts } from '../theme';

// Owner: choose the Bluetooth receipt printer (57 mm), test it, and turn on auto-printing.
export default function PrinterScreen({ onBack }: { onBack: () => void }) {
  const settings = useSettings();
  const [devices, setDevices] = useState<PairedDevice[] | null>(null);
  const [busy, setBusy] = useState<'find' | 'test' | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function find() {
    setBusy('find');
    setMessage(null);
    const { devices: list, error } = await listPairedDevices();
    setBusy(null);
    if (error) return setMessage({ text: error, error: true });
    setDevices(list);
    if (list.length === 0) setMessage({ text: 'No paired devices. Pair the printer in phone Settings → Bluetooth first.', error: true });
  }

  async function test() {
    setBusy('test');
    setMessage(null);
    const error = await printReceipt(testReceipt(settings.restaurantName, settings.printerName || 'Phone print'));
    setBusy(null);
    setMessage(error ? { text: error, error: true } : { text: 'Test page sent. Check the printer.' });
  }

  function choose(d: PairedDevice) {
    saveSettings({ printerAddress: d.address, printerName: d.name || d.address });
    setDevices(null);
    setMessage({ text: `${d.name || d.address} chosen. Print a test page to check.` });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button">
        <Text style={styles.backLink}>‹ Profile</Text>
      </Pressable>

      <View style={[styles.status, !settings.printerAddress && styles.statusEmpty]}>
        <Text style={styles.statusLabel}>Receipt printer</Text>
        <Text style={styles.statusName}>{settings.printerName || 'Not chosen yet'}</Text>
        <Text style={styles.statusText}>
          {settings.printerAddress
            ? 'Bills, kitchen slips and day closing print here (57 mm paper).'
            : bluetoothPrintingAvailable
              ? 'Choose your Bluetooth printer below.'
              : 'You are in Expo Go: Print opens the phone print screen. Direct printing works in the installed galla app.'}
        </Text>
      </View>

      {bluetoothPrintingAvailable && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{settings.printerAddress ? 'Change printer' : 'Choose printer'}</Text>
          <Text style={styles.cardText}>
            1. Switch the printer on.{'\n'}2. Pair it once in phone Settings → Bluetooth (PIN is usually 0000 or 1234).{'\n'}3. Tap Find printers and pick it.
          </Text>
          <Pressable style={styles.primary} onPress={find} disabled={busy != null} accessibilityRole="button">
            {busy === 'find' ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.primaryText}>Find printers</Text>}
          </Pressable>
          {devices?.map((d) => (
            <Pressable
              key={d.address}
              onPress={() => choose(d)}
              style={({ pressed }) => [styles.device, pressed && { backgroundColor: colors.mist }]}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>{d.name || 'Unnamed device'}</Text>
                <Text style={styles.deviceAddr}>{d.address}</Text>
              </View>
              <Text style={styles.choose}>{d.address === settings.printerAddress ? 'Chosen' : 'Use'}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Test</Text>
        <Pressable style={styles.secondary} onPress={test} disabled={busy != null} accessibilityRole="button">
          {busy === 'test' ? <ActivityIndicator color={colors.brand} /> : <Text style={styles.secondaryText}>Print test page</Text>}
        </Pressable>
        {message && <Text style={[styles.message, message.error && styles.messageError]}>{message.text}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Automatic printing</Text>
        <Toggle
          title="Print bill after saving"
          detail="The customer bill prints as soon as a bill is saved or a table is settled."
          value={settings.autoPrintBill}
          onChange={(v) => saveSettings({ autoPrintBill: v })}
        />
        <Toggle
          title="Print kitchen slip automatically"
          detail="Counter orders print a kitchen slip on saving; tables print when sent to kitchen."
          value={settings.autoPrintKot}
          onChange={(v) => saveSettings({ autoPrintKot: v })}
        />
      </View>

      {!!settings.printerAddress && (
        <Pressable
          onPress={() => {
            saveSettings({ printerAddress: '', printerName: '' });
            setMessage(null);
          }}
          style={styles.forget}
          accessibilityRole="button"
        >
          <Text style={styles.forgetText}>Forget this printer</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function Toggle({ title, detail, value, onChange }: { title: string; detail: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleText}>{detail}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.brand, false: colors.line }} thumbColor={colors.paper} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  content: { padding: 16, paddingBottom: 40 },
  backLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.brand, marginBottom: 12 },
  status: { padding: 16, borderRadius: 16, backgroundColor: '#E6F4EA' },
  statusEmpty: { backgroundColor: '#FBF0D2' },
  statusLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  statusName: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink, marginTop: 2 },
  statusText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.ink, marginTop: 6 },
  card: { backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 16, marginTop: 12 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  cardText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: 6 },
  primary: { height: 50, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
  secondary: { height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  secondaryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.brand },
  device: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, marginTop: 4 },
  deviceName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  deviceAddr: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
  choose: { fontFamily: fonts.semibold, fontSize: 15, color: colors.brand },
  message: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.veg, marginTop: 12 },
  messageError: { color: colors.danger },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  toggleTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  toggleText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 2 },
  forget: { alignItems: 'center', paddingVertical: 16 },
  forgetText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.danger },
});
