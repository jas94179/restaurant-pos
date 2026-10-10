// Pick a backup file, confirm, and restore it. Used on the welcome screen (new phone)
// and in Profile > Backup.
import { Alert } from 'react-native';
import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { describeBackup, isBackupFile, restoreBackup } from '../db/database';
import { getSettings, saveSettings } from './settingsStore';
import { cancelNewRestaurant, startNewRestaurant } from './restaurants';
import { reloadMenu } from './menuStore';
import { logout, reloadStaff } from './staffStore';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// From the start page: restore a backup as a new restaurant on this phone.
// Resolves with an error message to show, or null when restored or cancelled.
export async function restoreAsNewRestaurant(): Promise<string | null> {
  const previous = startNewRestaurant();
  const error = await pickAndRestore('new');
  if (!getSettings().setupDone) cancelNewRestaurant(previous);
  return error;
}

// 'replace': Profile > Backup, replaces the open restaurant's data.
// 'new': the open restaurant is a fresh empty one (see restoreAsNewRestaurant).
export async function pickAndRestore(mode: 'replace' | 'new' = 'replace'): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', '*/*'], copyToCacheDirectory: true });
  if (result.canceled) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(await new File(result.assets[0].uri).text());
  } catch {
    return "This file can't be read. Choose a galla backup file (.json).";
  }
  if (!isBackupFile(parsed)) return 'This is not a galla backup file.';

  const backup = parsed;
  const info = describeBackup(backup);
  return new Promise((resolve) => {
    const summary = `Backup of ${info.restaurantName} from ${formatWhen(info.exportedAt)}: ${info.bills} bills, ${info.items} menu items, ${info.staff} staff.`;
    Alert.alert(
      mode === 'new' ? `Add ${info.restaurantName} to this phone?` : `Replace ${getSettings().restaurantName}'s data?`,
      mode === 'new'
        ? `${summary}\n\nStaff sign in with the PINs from the backup.`
        : `${summary}\n\nAll bills, menu, staff and settings of ${getSettings().restaurantName} will be replaced. Staff log in with the PINs from the backup.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        {
          text: mode === 'new' ? 'Restore' : 'Replace and restore',
          style: mode === 'new' ? 'default' : 'destructive',
          onPress: () => {
            try {
              restoreBackup(backup);
              saveSettings({}); // reload settings from the restored data
              reloadMenu();
              reloadStaff();
              logout(); // everyone logs in again with their restored PIN
              resolve(null);
            } catch (e) {
              resolve(e instanceof Error ? e.message : 'Restore failed. Nothing was changed.');
            }
          },
        },
      ],
    );
  });
}
