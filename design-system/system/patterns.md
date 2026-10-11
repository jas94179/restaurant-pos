# Patterns

Rules for the flows that make galla trustworthy. Reuse them whenever a new screen touches money, staff or the network.

## Offline first
- Save every action on the phone first. Never block billing on the network.
- When the network is gone, show the `offline` Badge in the AppHeader. Don't add a modal, a banner or a red colour; being offline is normal, not an error.
- Things that truly need the internet (opening WhatsApp, a future cloud backup) say so at the moment you tap them.

## PIN approval
- Cashiers can ask for a discount or a cancellation, but an owner or manager must approve it on the same phone with their PIN (PinPad in a BottomSheet).
- The sheet's subtitle names exactly what is being approved: "Discount ₹50 on Bill T2".
- After approval, the bill shows who approved it and why: "Approved by Owner · Regular customer".

## Nothing is deleted
- Cancelled bills stay in the list, struck through, with who cancelled them and the reason.
- Removing an expense keeps a record. Destructive actions use the `danger` Button, require a reason, and offer a text button to back out ("Keep bill").

## Blind cash count
- At day close, cashiers count the drawer without seeing the expected amount (CashCountResult with `blind`).
- Owners and managers see the working (start cash + cash bills − paid out = should be), then the result: matches, short or extra.
- The day-close report can be printed or sent on WhatsApp to the owner.

## Money moments
- One `accent` action per screen for the step where money changes hands: "Show UPI QR · ₹231".
- The UPI QR carries the exact amount, so the customer never types it.
- Confirmation is a `success` Toast with the reference: "Saved on phone · Token #42".

## Kitchen slips
- Only new items go to the kitchen. A table's order shows what is already in the kitchen apart from new items (marked NEW).
- Removed items print as CANCEL. Settling a table with unsent items shows a `warning` Banner first.

## Delivery-app orders
- Zomato and Swiggy orders are entered with their order ID; a repeated ID is blocked.
- No GST is added; the bill says why.

## Sheets, not dialogs
- Every overlay is a BottomSheet that slides up and can be swiped down. There are no centred pop-up dialogs, except the phone's own system alerts for crash reports.

## Grids
- Tiles in a grid are always equal width. When the last row is short, fill it with empty spacers instead of stretching the last tile.

## Empty and first-run
- A first-run quick start shows four cards matched to the person's role, once.
- Empty lists say what will appear and offer the one action that fills them (EmptyState).

## Privacy in our own tools
- The owner dashboard (web) shows our business data and service health only: counts, plans, requests, never a restaurant's sales or customers' phone numbers. Any restaurant numbers are opt-in and combined across five or more restaurants.
