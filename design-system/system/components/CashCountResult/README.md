# CashCountResult

The day-close result: what should be in the drawer, what was counted, and whether it matches.

- Matches: `status-success` with "✓ Cash matches". Short: `status-danger`, "Short by ₹100". Extra: `status-warning`.
- Cashiers count blind: with `blind`, the expected amount is hidden and no result is shown until a manager or owner closes the day.
- Always show the working (start, cash bills, paid out) so nobody has to trust a single number.
