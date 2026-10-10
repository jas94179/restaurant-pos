// Bluetooth thermal printer, through our small native module (modules/galla-printer).
// The module exists only in the real Android app; in Expo Go it is missing and we
// fall back to the phone's print screen.
import { PermissionsAndroid, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

export type PairedDevice = { name: string; address: string };

type NativePrinter = {
  isEnabled(): boolean;
  getPairedDevices(): PairedDevice[];
  print(address: string, data: Uint8Array): Promise<void>;
};

const native = Platform.OS === 'android' ? requireOptionalNativeModule<NativePrinter>('GallaPrinter') : null;

export const bluetoothPrintingAvailable = !!native;

// Android 12+ asks the user before an app may use paired Bluetooth devices.
async function ensurePermission(): Promise<string | null> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 31) return null;
  const perm = 'android.permission.BLUETOOTH_CONNECT' as Parameters<typeof PermissionsAndroid.request>[0];
  const result = await PermissionsAndroid.request(perm);
  return result === PermissionsAndroid.RESULTS.GRANTED
    ? null
    : 'galla needs "Nearby devices" permission to use the printer. Allow it in phone Settings → Apps → galla → Permissions.';
}

export async function listPairedDevices(): Promise<{ devices: PairedDevice[]; error: string | null }> {
  if (!native) return { devices: [], error: 'Bluetooth printing works in the installed galla app, not in Expo Go.' };
  const permError = await ensurePermission();
  if (permError) return { devices: [], error: permError };
  if (!native.isEnabled()) return { devices: [], error: 'Bluetooth is off. Turn it on in the phone settings.' };
  return { devices: native.getPairedDevices(), error: null };
}

export async function sendToPrinter(address: string, data: Uint8Array): Promise<string | null> {
  if (!native) return 'Bluetooth printing works in the installed galla app, not in Expo Go.';
  const permError = await ensurePermission();
  if (permError) return permError;
  if (!native.isEnabled()) return 'Bluetooth is off. Turn it on and try again.';
  try {
    await native.print(address, data);
    return null;
  } catch {
    return "Couldn't reach the printer. Check it is switched on, has paper, and is near the phone.";
  }
}
