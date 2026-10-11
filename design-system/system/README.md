galla is billing for small Indian restaurants: a counter, a cafe, a family dine-in. It runs on the Android phone the restaurant already owns, works without internet, and prints to a cheap 58 mm Bluetooth printer. The brand is warm, plain and trustworthy, like a well-kept cash box. Its colours come from the Indian kitchen: curry-leaf green for trust, turmeric for the money moment.

This system covers four surfaces. Use the parts listed for each.

| Surface | Fonts | Tokens | Components |
|---|---|---|---|
| Android app (React Native) | `app` (Bricolage Grotesque) | all, light theme only for now | the app's own React Native components, which this system documents |
| Product web (owner dashboard, website) | `app` | all, light and dark | `window.Galla` components in this system |
| Print (58 mm thermal) | the printer's built-in font | none; see Print rules | Receipt |
| Marketing (posts, reels, brochure, case study) | `marketing` (Poppins) | colours, radius, shadow | Logo; see Marketing |

## Visual foundations

### Colour
- The screen background is `bg-app`. Cards, tiles and lists sit on `bg-surface` with a `border-default` hairline. Sheets use `bg-raised`.
- `bg-brand` (curry leaf) is for headers, hero bands and one highlighted card. Text on it is `text-on-brand`, with `text-on-brand-muted` for second lines.
- `action-primary` is the main button. `action-accent` (turmeric) is the one money action per screen: "Show UPI QR · ₹231", "Free trial". Text on turmeric is always `text-on-accent`, never white.
- Selected things (chips, segments, rows) use `bg-selected`, `border-selected` and `text-link` together.
- Status colours mean exactly one thing each. `status-success` is paid, saved, cash matches. `status-danger` is short, cancelled, errors. `status-warning` is extra cash, unsent kitchen items. `status-offline` is the Offline badge. Every status also carries a word, so colour is never the only signal.
- `food-veg` and `food-non-veg` are only for the veg mark.
- Use primitive tokens (`green-700`, `turmeric-500`) only to define new semantic tokens or in marketing art. Screens use semantic tokens.
- Dark theme: every semantic token has a dark value. In dark, `action-primary` becomes a light mint with dark text, because the dark green would vanish. The app ships light only for now; product web supports both.

### Type
- App and product web use the `app` family, Bricolage Grotesque, in three weights only: 400, 600, 800.
- Use the App styles by role: `title-lg` for screen titles, `title-md` for sheet titles, `title-sm` for card titles, `body-lg` for inputs, `body-md` for list rows, `body-sm` for secondary text, `label-lg` / `label-md` / `label-sm` for buttons, `caption` for fine print.
- Money uses `amount` or the style it sits in, always with tabular numbers, the ₹ sign and Indian grouping (₹1,23,456).
- Marketing uses Poppins (`mkt-*` styles). Never use Poppins inside the app, or Bricolage for long marketing paragraphs.
- Invoice numbers, UPI IDs and receipt previews use `mono`.

### Space, size and shape
- Space comes from the `space-*` scale (4-point with half steps). Screen side padding is `space-16`; gaps between tiles and rows are `space-12`.
- Nothing tappable is smaller than `size-control-md` (44px). Main buttons are `size-control-lg` (52px), inputs `size-input` (48px).
- Corners: `radius-lg` buttons, `radius-md` inputs and tiles, `radius-xl` cards, `radius-3xl` the top of bottom sheets, `radius-full` chips, pills and avatars. Receipts are square (`radius-none`).
- Borders: `stroke-hairline` for dividers, `stroke-default` for inputs and chips, `stroke-selected` for selected tiles and focus.

### Depth and motion
- The app is flat. Separation comes from `border-default`, not shadows. `shadow-2` is only for things that float: bottom sheets, toasts, menus. `shadow-1` is web hover; `shadow-3` is marketing mockups.
- The bottom sheet opens in `duration-sheet` with `ease-enter`, and closes in `duration-base` with `ease-exit`. Press feedback is `duration-fast`. Turn motion off when the phone asks for reduced motion.

### Focus and accessibility
- Keyboard focus is a solid 2px `border-focus` ring with a 2px gap: dark turmeric in light, turmeric in dark. It meets 3:1 on every surface in both themes.
- Text on its stated grounds meets 4.5:1 in both themes; control borders (`border-input`) meet 3:1. Details are in Accessibility.

## Iconography
- The app uses the phone's own icons: SF Symbols on iPhone and Material Symbols on Android, at `size-icon` (24px). Tabs are `fork.knife` / `restaurant` (Orders), `doc.text` / `receipt_long` (Bills) and `chart.bar` / `bar_chart` (Insights). Profile shows the person's initial instead of an icon.
- Small text symbols are part of the voice: "‹ Profile" for back, "›" on rows that open, "✓" on plan features and "Cash matches".
- The web components in this system draw simple stroke icons (2px, round caps) in the same spirit. They are not the app's icon set.
- No emoji in the product.

## Logo
- The mark is a gold coin with the rupee sign dropping into a cash-box slot, on curry-leaf green. Use the files in the Logos asset group exactly; never redraw or recolour them.
- The wordmark is "galla", always lowercase, in Bricolage Grotesque ExtraBold.

## Using the components (product web)
- Load React 18, then this system's `components/bundle.js`; components are on `window.Galla` (for example `Galla.Button`).
- The page must load `tokens.css` and `components/bundle.css` and set `data-theme="light"` or `"dark"` on the root. Components take plain props and never fetch data; the page supplies the numbers, names and handlers.
- The app's React Native components follow the same names and rules (Button, Chip, DishTile, PinPad, BottomSheet and so on). When building app screens, use these guidelines and the same tokens.
