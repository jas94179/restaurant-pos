# Restaurant POS

An offline-first billing app for small restaurants, bakeries and cafes.

We are building the **Pilot MVP** first: a simple version tested free with 4 to 5 restaurants before growing into the full product.

## Pilot MVP scope

- Menu setup (categories, items, variants, add-ons, GST)
- Billing for takeaway and dine-in with tables
- KOT printing to the kitchen and bill printing at the counter (Bluetooth thermal printer)
- GST bill, shareable on WhatsApp from the phone
- UPI QR on the bill using the restaurant's own UPI ID
- Cash, UPI and card recorded as payment modes
- Quick entry for Zomato / Swiggy orders
- Day-end report
- Owner and staff PINs
- Works fully offline, with automatic cloud backup

## Folder plan

| Folder | What it will hold |
| --- | --- |
| `app/` | The Android/iOS app (React Native with Expo, TypeScript) |
| `docs/` | Plain-language guides: how to install, test and use the app |

## Technology

- React Native with Expo (one codebase for Android and iOS)
- TypeScript
- Encrypted SQLite on the device for offline billing
- PostgreSQL (managed, free/starter tier) for cloud backup

## Team

- **Product, UX and testing:** jas94179
- **Code:** written with Claude
