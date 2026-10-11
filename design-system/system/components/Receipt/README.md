# Receipt

An on-screen preview of what prints on the 58 mm Bluetooth printer: bills, kitchen slips, table bills, day close.

- 32 characters per line, plain ASCII only. Amounts print as "Rs", separators as "-"; many cheap printers cannot print ₹ or ·.
- Shop name double size and bold; section titles bold; a line of 32 dashes between parts.
- Tax invoices show GSTIN, FSSAI, a running invoice number INV-<financial year>-<serial>, taxable value, CGST and SGST.
- Kitchen slips show no prices, only new items, notes, and who took the order; removed items print as CANCEL.
- The paper is always white with black text, in both themes.
