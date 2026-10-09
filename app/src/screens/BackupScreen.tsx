import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { exportBackup } from '../db/database';
import { saveSettings, useSettings } from '../data/settingsStore';
import { formatWhen as when, pickAndRestore } from '../data/backup';
import { colors, fonts } from '../theme';

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

// Owner only. A backup file holds every bill, the menu, staff and settings.
// Save it somewhere other than this phone (Google Drive, or WhatsApp to yourself).
export default function BackupScreen({ onBack }: { onBack: () => void }) {
  const settings = useSettings();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const last = settings.lastBackupAt;

  async function backUp() {
    setBusy(true);
    setMessage(null);
    try {
      const data = exportBackup();
      const stamp = data.exportedAt.slice(0, 16).replace(/[:T]/g, '-');
      const safeName = settings.restaurantName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'restaurant';
      const file = new File(Paths.cache, `galla-backup-${safeName}-${stamp}.json`);
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(data));

      if (!(await Sharing.isAvailableAsync())) {
        setMessage({ text: 'Sharing is not available on this phone.', error: true });
        return;
      }
      await Sharing.shareAsync(file.uri, {
        dialogTitle: 'Save your backup',
        mimeType: 'application/json',
        UTI: 'public.json',
      });
      saveSettings({ lastBackupAt: data.exportedAt });
      setMessage({ text: `Backup ready with ${data.tables.bills.length} bills. Make sure you saved it to Drive or sent it to yourself.` });
    } catch {
      setMessage({ text: 'Could not create the backup. Please try again.', error: true });
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    setMessage(null);
    const error = await pickAndRestore();
    if (error) setMessage({ text: error, error: true });
  }

  const stale = !last || daysSince(last) >= 7;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button">
        <Text style={styles.backLink}>‹ Profile</Text>
      </Pressable>

      <View style={[styles.status, stale && styles.statusStale]}>
        <Text style={[styles.statusTitle, stale && styles.statusTitleStale]}>
          {last ? `Last backup: ${when(last)}` : 'No backup yet'}
        </Text>
        <Text style={styles.statusText}>
          {stale
            ? 'Your bills live only on this phone. If it is lost or broken, they are gone. Back up at least once a week.'
            : 'Good. Keep backing up at least once a week.'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Back up now</Text>
        <Text style={styles.cardText}>
          Makes one file with every bill, your menu, staff and settings. Save it to Google Drive, or send it to yourself on
          WhatsApp.
        </Text>
        <Pressable style={[styles.primary, busy && { opacity: 0.5 }]} onPress={backUp} disabled={busy} accessibilityRole="button">
          <Text style={styles.primaryText}>{busy ? 'Preparing…' : 'Back up now'}</Text>
        </Pressable>
        <Text style={styles.fine}>Keep the file private. It contains your sales and staff details.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Restore from a backup</Text>
        <Text style={styles.cardText}>
          For a new or reset phone. Choose a backup file and everything on this phone is replaced with it.
        </Text>
        <Pressable style={styles.secondary} onPress={restore} accessibilityRole="button">
          <Text style={styles.secondaryText}>Choose backup file</Text>
        </Pressable>
      </View>

      {message && <Text style={[styles.message, message.error && styles.messageError]}>{message.text}</Text>}

      <Text style={styles.fine}>Automatic cloud backup is coming next, so this becomes hands-free.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  content: { padding: 16, paddingBottom: 40 },
  backLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.brand, marginBottom: 12 },
  status: { padding: 16, borderRadius: 16, backgroundColor: '#E6F4EA' },
  statusStale: { backgroundColor: '#FBF0D2' },
  statusTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.brand },
  statusTitleStale: { color: colors.brandDeep },
  statusText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.ink, marginTop: 4 },
  card: { backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 16, marginTop: 12 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  cardText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 4 },
  primary: { height: 52, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
  secondary: { height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  fine: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.muted, marginTop: 10 },
  message: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.veg, marginTop: 14 },
  messageError: { color: colors.danger },
});
