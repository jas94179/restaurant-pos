// Shared menu for every screen. When the menu is edited, all screens update together.
import { useSyncExternalStore } from 'react';
import { Category, DbMenuItem, getAllMenuItems, getCategories, seedMenuIfEmpty } from '../db/database';
import { CATEGORIES, SAMPLE_MENU } from './sampleMenu';

export type MenuState = {
  categories: Category[];
  items: DbMenuItem[]; // includes archived items
  byId: Record<string, DbMenuItem>;
};

function load(): MenuState {
  const categories = getCategories();
  const items = getAllMenuItems();
  const byId: Record<string, DbMenuItem> = {};
  for (const i of items) byId[i.id] = i;
  return { categories, items, byId };
}

let state: MenuState = load();
const listeners = new Set<() => void>();

export function reloadMenu(): void {
  state = load();
  listeners.forEach((l) => l());
}

export function getMenu(): MenuState {
  return state;
}

export function useMenu(): MenuState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

// Used during setup when the owner picks "Start with sample menu".
export function loadSampleMenu(): void {
  seedMenuIfEmpty(SAMPLE_MENU, CATEGORIES);
  reloadMenu();
}
