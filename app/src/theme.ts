// Visual identity for the app. The source of truth is the galla Design System
// (design-system/tokens.json → src/design/tokens.ts). This file keeps the older
// short names working so existing screens don't change, and re-exports the system.
import { palette, themes } from './design/tokens';

const light = themes.light;

// Legacy names, now pointing at design-system values. Same colours as before.
export const colors = {
  brand: light.bgBrand, // curry leaf green
  brandDeep: palette.green800,
  turmeric: palette.turmeric500,
  turmericDeep: palette.turmeric600,
  ink: light.textPrimary,
  muted: light.textSecondary,
  line: light.borderDefault,
  mist: light.bgApp,
  paper: light.bgSurface,
  danger: light.actionDanger,
  veg: light.foodVeg,
  nonVeg: light.foodNonVeg,
};

export const fonts = {
  regular: 'BricolageGrotesque_400Regular',
  semibold: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_800ExtraBold',
};

export const APP_NAME = 'galla';

export * from './design';
