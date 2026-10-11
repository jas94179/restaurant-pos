# galla Design System

One system, three places. They all come from `tokens.json` in this folder.

| Where | What it is | Link |
|---|---|---|
| Design System page | Brand book, tokens, 36 live components, writing, patterns, print and accessibility rules | https://claude.ai/artifact/2pAw7WgjKZtU3dVruf1LtT |
| Figma library | Variables (Light and Dark), text and effect styles, components with variants | https://www.figma.com/design/1XJLUboTbfq7h6IlESjVR5 |
| App code | `app/src/design/` (tokens and `useTheme`) and `app/src/components/ui/` | this repo |

## Rules that matter most

- Colours are used by **role** (`bgSurface`, `actionPrimary`, `textSecondary`), never by hex.
- One Primary button per screen. Turmeric (Accent) only for the one money action, such as "Show UPI QR · ₹231".
- Nothing tappable under 44px. Status is always shown in words, not colour alone.
- Fonts: Bricolage Grotesque (400, 600, 800) in the app; Poppins for marketing only.
- Receipts: 58 mm, 32 columns, plain characters, "Rs" for rupees.

## Dark mode

Dark is fully defined (tokens, Figma collection "Color · Dark", Design System page) but the app ships **light only** for now.
To switch it on later, change `ACTIVE` in `app/src/design/index.ts` (or wire it to a setting plus `useColorScheme`).
Components that use `useTheme()` will follow without edits.

## Changing a token

1. Edit `tokens.json`.
2. `python3 make_rn_tokens.py` regenerates `app/src/design/tokens.ts`.
3. `python3 make_tokens.py` / `make_components.py` regenerate the Design System page files in `system/`.
4. Update the matching Figma variable (same name, `/` instead of `-`).

## In the app

```tsx
import { Button, Badge, Card } from '../components/ui';
import { useTheme, spacing, typography } from '../design';
```

`app/src/theme.ts` still exports the older `colors` and `fonts` names, now pointing at the same values, so existing screens look exactly the same. Screens move to the shared components one at a time.

## Figma notes

The file is on the Starter plan: 3 pages, 1 mode per collection, and a daily limit on scripted edits.
That's why Light and Dark are two collections with matching variable names rather than two modes.
`figma/` holds the build helpers and a state ledger; `figma/fig_b5.js` (web components) is ready to run once the limit resets.
