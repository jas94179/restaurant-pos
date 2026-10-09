// Restaurant settings shared by every screen, saved on the phone.
import { useSyncExternalStore } from 'react';
import * as Crypto from 'expo-crypto';
import { getAllSettings, setSettings } from '../db/database';

export type OutletType = 'counter' | 'dine_in' | 'both';
export type Plan = 'pilot' | 'free' | 'starter' | 'pro' | 'business';

export type Settings = {
  setupDone: boolean;
  restaurantName: string;
  gstin: string;
  outletType: OutletType;
  tableCount: number;
  plan: Plan;
  ownerPinHash: string;
  ownerPinSalt: string;
};

function load(): Settings {
  const s = getAllSettings();
  return {
    setupDone: s.setupDone === '1',
    restaurantName: s.restaurantName ?? '',
    gstin: s.gstin ?? '',
    outletType: (s.outletType as OutletType) ?? 'both',
    tableCount: Number(s.tableCount ?? 12) || 12,
    plan: (s.plan as Plan) ?? 'pilot',
    ownerPinHash: s.ownerPinHash ?? '',
    ownerPinSalt: s.ownerPinSalt ?? '',
  };
}

let state: Settings = load();
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  return state;
}

export function saveSettings(values: Partial<Settings>): void {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    out[k] = typeof v === 'boolean' ? (v ? '1' : '0') : String(v);
  }
  setSettings(out);
  state = load();
  listeners.forEach((l) => l());
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

// ----- PIN -----
// The PIN itself is never stored, only a salted SHA-256 hash of it.

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export async function makePinHash(pin: string): Promise<{ hash: string; salt: string }> {
  const salt = toHex(Crypto.getRandomBytes(16));
  return { hash: await hashPin(pin, salt), salt };
}

export async function checkOwnerPin(pin: string): Promise<boolean> {
  const { ownerPinHash, ownerPinSalt } = state;
  if (!ownerPinHash) return false;
  return (await hashPin(pin, ownerPinSalt)) === ownerPinHash;
}
