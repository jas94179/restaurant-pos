// Switching between the restaurants saved on this phone.
// Prototype stand-in for signing in with the owner's mobile number.
import {
  currentRestaurantFile,
  isRegistered,
  listRestaurants,
  newRestaurantFile,
  openRestaurantFile,
  RestaurantEntry,
} from '../db/database';
import { reloadSettings } from './settingsStore';
import { reloadMenu } from './menuStore';
import { logout, reloadStaff } from './staffStore';

export type { RestaurantEntry };
export { listRestaurants };

function reloadAll() {
  logout();
  reloadSettings();
  reloadMenu();
  reloadStaff();
}

export function switchRestaurant(file: string): void {
  openRestaurantFile(file);
  reloadAll();
}

// Opens an empty restaurant for sign up or restore. Returns the file that was
// open before, so Back can return to it.
export function startNewRestaurant(): string {
  const previous = currentRestaurantFile();
  // Reuse an unfinished empty file (e.g. a brand-new phone) instead of making another.
  const file = isRegistered(previous) ? newRestaurantFile() : previous;
  switchRestaurant(file);
  return previous;
}

// Back out of an unfinished sign up or restore.
export function cancelNewRestaurant(previous: string): void {
  if (!isRegistered(currentRestaurantFile()) && previous !== currentRestaurantFile()) {
    switchRestaurant(previous);
  }
}
