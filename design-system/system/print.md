# Print

What galla prints on a 58 mm (57 mm) Bluetooth thermal printer, using ESC/POS commands. The Receipt component previews these on screen.

## Rules
- 32 characters per line, in the printer's built-in font. Plan every line to that width.
- Plain ASCII only. Amounts print as "Rs 231", separators as "-". Many cheap printers print junk for ₹ or ·.
- Shop name: double size, bold, centred. Section titles: bold. Body: normal. Parts are separated by a line of 32 dashes.
- Keep leading spaces; alignment is done with spaces, not tabs.
- Paper is white with black text. There is no colour and no dark mode on paper.

## Slips
| Slip | Must show | Never shows |
|---|---|---|
| Tax invoice | shop name, address, phone, GSTIN, FSSAI; "TAX INVOICE"; invoice number INV-<financial year>-<serial>; token, date and time; items with quantity and amount; taxable value, CGST and SGST; total; how it was paid | the customer's phone number |
| Table bill (before payment) | "This is not a tax invoice."; items; GST; TO PAY; a UPI QR with the exact amount | an invoice number |
| Kitchen slip (KOT) | KOT number, table or token, time; NEW ITEMS in large type; notes; who took the order; removed items as CANCEL | prices |
| Day close | date; start cash, cash bills, paid out, should be, counted; result (matches, short, extra); sales by payment mode | individual customer details |
| Test page | printer name, paper width, a 32-character ruler | anything real |

## Layout of a line
- Item lines: name on the left, quantity, amount right-aligned to column 32.
- Totals: label on the left, value right-aligned.
- Centre a line by padding with spaces on both sides; trim the name if it is longer than the space left.
