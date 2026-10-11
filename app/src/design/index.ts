// galla Design System for the app. Import from here (or from '../theme', which re-exports this).
// Docs: design-system/ in the repo, the Design System page, and the Figma library.
import { radius, shadows, size, spacing, stroke, themes, typography, duration, easing, opacity, palette } from './tokens';
import type { ColorRoles } from './tokens';

export { radius, size, spacing, stroke, typography, duration, easing, opacity, palette, themes };
export type { ColorRoles };

export type ThemeName = 'light' | 'dark';

export type Theme = {
  name: ThemeName;
  color: ColorRoles;
  shadow: (typeof shadows)['light'];
};

// The app ships light only for now. Dark is fully defined in tokens.ts and will be
// switched on later (a setting plus useColorScheme), without touching components.
const ACTIVE: ThemeName = 'light';

export function getTheme(name: ThemeName = ACTIVE): Theme {
  return { name, color: themes[name], shadow: shadows[name] };
}

// Components call this rather than importing colours directly, so dark mode is one change here.
export function useTheme(): Theme {
  return getTheme(ACTIVE);
}
