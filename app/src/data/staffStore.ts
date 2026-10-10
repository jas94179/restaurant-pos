// Staff, the logged-in person, and what each role is allowed to do.
import { useSyncExternalStore } from 'react';
import { addStaff, getStaff, Role, Staff } from '../db/database';
import { getSettings, hashPin, makePinHash } from './settingsStore';

export const ROLE_LABEL: Record<Role, string> = {
  owner: 'Owner',
  manager: 'Manager',
  cashier: 'Cashier',
};

export const ROLE_INFO: Record<Role, string> = {
  owner: 'Everything: billing, all reports, menu, staff and settings.',
  manager: "Billing, all bills, today's insights, stock on and off, day-end cash check.",
  cashier: "Billing, today's bills, stock on and off, day-end cash count. No sales totals.",
};

// ---------- Permissions (one place, so rules stay consistent) ----------

export type Permission =
  | 'insights' // see the Insights tab
  | 'insightsAllPeriods' // 7 and 30 day insights
  | 'billsAllDays' // bills older than today
  | 'editMenu' // add, edit, delete items and prices
  | 'toggleStock' // mark items out of stock
  | 'manageStaff'
  | 'editRestaurant'
  | 'closeDay' // count the cash at day end
  | 'seeCashDifference' // see expected cash and shortages (cashiers count blind)
  | 'exportSales' // sales files for the CA
  | 'addExpense' // record cash paid out
  | 'removeExpense';

const RULES: Record<Role, Permission[]> = {
  owner: ['insights', 'insightsAllPeriods', 'billsAllDays', 'editMenu', 'toggleStock', 'manageStaff', 'editRestaurant', 'closeDay', 'seeCashDifference', 'exportSales', 'addExpense', 'removeExpense'],
  manager: ['insights', 'billsAllDays', 'toggleStock', 'closeDay', 'seeCashDifference', 'addExpense', 'removeExpense'],
  cashier: ['toggleStock', 'closeDay', 'addExpense'],
};

export function can(user: Staff | null, permission: Permission): boolean {
  return !!user && RULES[user.role].includes(permission);
}

// ---------- Session ----------

let current: Staff | null = null;
let staffList: Staff[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// Older phones stored only an owner PIN in settings: move it into the staff list once.
function migrateOwner() {
  if (getStaff(true).length > 0) return;
  const s = getSettings();
  if (s.ownerPinHash) {
    addStaff({ name: 'Owner', role: 'owner', pinHash: s.ownerPinHash, pinSalt: s.ownerPinSalt });
  }
}

export function reloadStaff() {
  migrateOwner();
  staffList = getStaff();
  // Keep the session in sync if the logged-in person was edited or removed.
  if (current) current = staffList.find((s) => s.id === current!.id) ?? null;
  notify();
}

reloadStaff();

export function useStaffList(): Staff[] {
  return useSyncExternalStore(subscribe, () => staffList);
}

export function useCurrentUser(): Staff | null {
  return useSyncExternalStore(subscribe, () => current);
}

export function getCurrentUser(): Staff | null {
  return current;
}

export function loginAs(id: string) {
  current = staffList.find((s) => s.id === id) ?? null;
  notify();
}

export function logout() {
  current = null;
  notify();
}

// Finds whose PIN this is. Returns null if nobody matches.
export async function loginWithPin(pin: string): Promise<Staff | null> {
  for (const s of staffList) {
    if ((await hashPin(pin, s.pinSalt)) === s.pinHash) {
      current = s;
      notify();
      return s;
    }
  }
  return null;
}

// Two people must never share a PIN, or the app can't tell who billed.
export async function pinInUse(pin: string, exceptId?: string): Promise<boolean> {
  for (const s of staffList) {
    if (s.id === exceptId) continue;
    if ((await hashPin(pin, s.pinSalt)) === s.pinHash) return true;
  }
  return false;
}

// Checks an approval PIN (owner or manager) without changing who is logged in.
export async function findApprover(pin: string): Promise<Staff | null> {
  for (const s of staffList) {
    if (s.role !== 'owner' && s.role !== 'manager') continue;
    if ((await hashPin(pin, s.pinSalt)) === s.pinHash) return s;
  }
  return null;
}

export function canApprove(user: Staff | null): boolean {
  return user?.role === 'owner' || user?.role === 'manager';
}

export { makePinHash };
