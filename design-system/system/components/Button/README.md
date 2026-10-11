# Button

Buttons start the main action on a screen. Labels are short verbs in sentence case: "Send to kitchen", "Print test page".

- **primary** (`action-primary`): the main action of a sheet or screen. One per view.
- **accent** (`action-accent`, turmeric): the one money moment per screen, such as "Show UPI QR · ₹231" or "Free trial". Never two on one screen.
- **secondary**: the alternatives beside a primary (Print, WhatsApp).
- **danger** (`action-danger`): destructive and recorded actions, such as "Cancel this bill". Always pair with a text button to back out ("Keep bill").
- **text**: low-weight exits and links inside sheets.
- Sizes: `lg` 52px for main actions, `md` 44px, `sm` 36px only on web or dense rows. Nothing tappable under 44px on phones.
- Put the amount in the label when money moves ("Show UPI QR · ₹231").
- A loading button keeps its label ("Saving") and blocks double taps.
