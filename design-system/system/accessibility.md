# Accessibility

galla is used at a busy counter, in bright light, by people of every age and reading level. Accessibility is part of being fast.

## Contrast (checked in both themes)
| Pair | Light | Dark |
|---|---|---|
| `text-primary` on `bg-surface` | 16.9:1 | 13.8:1 |
| `text-secondary` on `bg-app` | 4.9:1 | 9.2:1 |
| `text-on-brand` on `bg-brand` | 12.8:1 | 12.7:1 |
| `action-accent-text` on `action-accent` | 8:1 | 8:1 |
| `action-primary-text` on `action-primary` | 12.8:1 | 8.9:1 |
| `status-success` on `bg-surface` | 5.4:1 | 8.9:1 |
| `status-danger` on `bg-surface` | 6.5:1 | 9.5:1 |
| `status-warning` on `bg-surface` | 5.9:1 | 9.5:1 |
| `border-input` against `bg-surface` | 3.3:1 | 3.3:1 |
| `border-focus` ring on `bg-surface` | 5.9:1 | 8.4:1 |

- `border-default` is decorative (dividers, card outlines). Any boundary someone must see to use a control uses `border-input`.
- `green-300` is too pale for text on white (2.1:1). Use it only for decoration.

## Touch and reading
- Touch targets are at least 44 × 44px; main buttons are 52px tall and PIN keys 60px.
- Inputs use 16px text so phones don't zoom.
- Never rely on colour alone: statuses have words, the veg mark has a label, required checkboxes say "Required".

## Screen readers
- Every icon-only control has a label ("Add one", "Delete").
- The Offline badge reads "Offline. Bills are still saved on this phone."
- The PIN dots announce how many digits are entered, never the digits.

## Motion
- Respect the phone's reduced-motion setting: sheets appear without sliding, spinners stop.
