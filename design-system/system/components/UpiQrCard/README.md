# UpiQrCard

The UPI QR screen: the restaurant's name, the exact amount, and a QR any UPI app can scan.

- The amount is inside the QR, so the customer never types it. Say so in plain words under the amount.
- The QR always sits on white with dark ink, in both themes; scanners need that contrast.
- After the cashier confirms, the button turns to "Payment received" in `status-success`.
- The preview QR is a placeholder pattern; the app draws a real one from the UPI ID.
