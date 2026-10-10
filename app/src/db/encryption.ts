// Encrypting each restaurant's database on the phone (SQLCipher, built into expo-sqlite
// when "useSQLCipher" is on in app.json). The key is random, made on this phone, and kept
// in the phone's secure key store (Android Keystore). If someone copies the database
// file off the phone, they cannot read it.
//
// Expo Go has no SQLCipher: there the data simply stays unencrypted, as before.
// Existing unencrypted files are converted once, with checks, before the plain copy is removed.
import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

const KEY_NAME = 'galla-db-key';

let cachedKey: string | null | undefined;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Is this build's SQLite really SQLCipher? (Only SQLCipher answers cipher_version.)
let cipherAvailable: boolean | undefined;
export function hasSqlCipher(): boolean {
  if (cipherAvailable !== undefined) return cipherAvailable;
  try {
    const probe = SQLite.openDatabaseSync(':memory:');
    const row = probe.getFirstSync<{ cipher_version: string }>('PRAGMA cipher_version');
    probe.closeSync();
    cipherAvailable = !!row?.cipher_version;
  } catch {
    cipherAvailable = false;
  }
  return cipherAvailable;
}

function getKey(): string | null {
  if (cachedKey !== undefined) return cachedKey;
  try {
    let k = SecureStore.getItem(KEY_NAME);
    if (!k) {
      k = toHex(Crypto.getRandomBytes(32));
      SecureStore.setItem(KEY_NAME, k);
      // Read back: never encrypt with a key we could not store.
      if (SecureStore.getItem(KEY_NAME) !== k) k = null;
    }
    cachedKey = k;
  } catch {
    cachedKey = null;
  }
  return cachedKey ?? null;
}

function fileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

function removeIfExists(path: string) {
  try {
    const f = new File(fileUri(path));
    if (f.exists) f.delete();
  } catch {
    // ignore
  }
}

function sqlQuote(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

export type OpenResult = { db: SQLite.SQLiteDatabase; encrypted: boolean };

// Opens a restaurant database, encrypted when possible.
// isEncrypted / markEncrypted remember (in the accounts file) which files are done.
export function openRestaurantDb(
  name: string,
  isEncrypted: (name: string) => boolean,
  markEncrypted: (name: string) => void,
  onProblem: (message: string) => void,
): OpenResult {
  const key = hasSqlCipher() ? getKey() : null;
  if (!key) return { db: SQLite.openDatabaseSync(name), encrypted: false };

  const path = `${SQLite.defaultDatabaseDirectory}/${name}`.replace(/\/+/g, '/');
  const exists = (() => {
    try {
      return new File(fileUri(path)).exists;
    } catch {
      return false;
    }
  })();

  // New file, or one we already converted: open with the key.
  if (!exists || isEncrypted(name)) {
    const db = SQLite.openDatabaseSync(name);
    db.execSync(`PRAGMA key = ${sqlQuote(key)}`);
    try {
      db.getFirstSync('SELECT count(*) FROM sqlite_master');
      if (!exists) markEncrypted(name);
      return { db, encrypted: true };
    } catch {
      // Key doesn't open it (should not happen). Keep the file aside, never delete it.
      db.closeSync();
      onProblem(`Could not open ${name} with the phone key; file kept as ${name}.locked`);
      try {
        new File(fileUri(path)).move(new File(fileUri(`${path}.locked`)));
      } catch {
        // ignore
      }
      const fresh = SQLite.openDatabaseSync(name);
      fresh.execSync(`PRAGMA key = ${sqlQuote(key)}`);
      markEncrypted(name);
      return { db: fresh, encrypted: true };
    }
  }

  // Existing plain file: copy it into an encrypted file, check, then swap.
  const tmpPath = `${path}.enc-tmp`;
  removeIfExists(tmpPath);
  const plain = SQLite.openDatabaseSync(name);
  try {
    plain.execSync('PRAGMA wal_checkpoint(TRUNCATE)');
    plain.execSync(`ATTACH DATABASE ${sqlQuote(tmpPath)} AS enc KEY ${sqlQuote(key)}`);
    plain.execSync("SELECT sqlcipher_export('enc')");
    // Every table must have the same number of rows in the copy.
    const tables = plain.getAllSync<{ name: string }>("SELECT name FROM main.sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'");
    for (const t of tables) {
      const a = plain.getFirstSync<{ n: number }>(`SELECT count(*) AS n FROM main."${t.name}"`)?.n ?? 0;
      const b = plain.getFirstSync<{ n: number }>(`SELECT count(*) AS n FROM enc."${t.name}"`)?.n ?? -1;
      if (a !== b) throw new Error(`Row count mismatch in ${t.name}`);
    }
    plain.execSync('DETACH DATABASE enc');
    plain.closeSync();
  } catch (e) {
    // Conversion failed: keep using the plain file as it is. Nothing is lost.
    try {
      plain.execSync('DETACH DATABASE enc');
    } catch {
      // not attached
    }
    removeIfExists(tmpPath);
    onProblem(`Encryption skipped for ${name}: ${e instanceof Error ? e.message : String(e)}`);
    return { db: plain, encrypted: false };
  }

  // Swap: the checked encrypted copy replaces the plain file.
  try {
    removeIfExists(`${path}-wal`);
    removeIfExists(`${path}-shm`);
    new File(fileUri(path)).delete();
    new File(fileUri(tmpPath)).move(new File(fileUri(path)));
    markEncrypted(name);
  } catch (e) {
    onProblem(`Encryption swap failed for ${name}: ${e instanceof Error ? e.message : String(e)}`);
    // If the plain file is gone but the copy exists under the temp name, use the copy.
    try {
      const tmp = new File(fileUri(tmpPath));
      if (tmp.exists && !new File(fileUri(path)).exists) {
        tmp.move(new File(fileUri(path)));
        markEncrypted(name);
      }
    } catch {
      // ignore
    }
  }

  const db = SQLite.openDatabaseSync(name);
  if (isEncrypted(name)) db.execSync(`PRAGMA key = ${sqlQuote(key)}`);
  return { db, encrypted: isEncrypted(name) };
}
