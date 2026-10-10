// Problem reports ("crash alerts"). Errors are saved on the phone; after a crash,
// the app offers to send a report to galla (on WhatsApp / email via the share menu).
// Nothing is sent automatically. Later, with the cloud, reports can reach our dashboard.
import { Platform, Share } from 'react-native';
import { getErrors, logError, type ErrorEntry } from '../db/database';

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsType = { getGlobalHandler(): GlobalHandler; setGlobalHandler(h: GlobalHandler): void };

let installed = false;

export function installCrashReporting(): void {
  if (installed) return;
  installed = true;
  const eu = (globalThis as unknown as { ErrorUtils?: ErrorUtilsType }).ErrorUtils;
  if (!eu) return;
  const previous = eu.getGlobalHandler();
  eu.setGlobalHandler((error, isFatal) => {
    const e = error instanceof Error ? error : new Error(String(error));
    logError(e.message, e.stack ?? '', !!isFatal);
    previous(error, isFatal);
  });
}

export function recordError(error: unknown, fatal = false): void {
  const e = error instanceof Error ? error : new Error(String(error));
  logError(e.message, e.stack ?? '', fatal);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const APP_JSON = require('../../app.json') as { expo: { version: string } };

export function appVersion(): string {
  return APP_JSON.expo.version;
}

export function reportText(entries: ErrorEntry[] = getErrors()): string {
  const head = [
    'galla problem report',
    `App version: ${appVersion()}`,
    `Phone: ${Platform.OS} ${String(Platform.Version)}`,
    `Reports: ${entries.length}`,
    '(No bills, sales or customer details are included.)',
    '',
  ];
  const body = entries.slice(0, 10).map((e) =>
    [
      `${new Date(e.at).toLocaleString('en-IN')}${e.fatal ? ' [app closed]' : ''}`,
      e.message,
      e.stack.split('\n').slice(0, 6).join('\n'),
      '',
    ].join('\n'),
  );
  return [...head, ...body].join('\n');
}

export async function shareReport(): Promise<void> {
  await Share.share({ message: reportText() });
}
