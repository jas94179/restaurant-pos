# BottomSheet

The app's one overlay: it slides up from the bottom and closes by swiping down, tapping outside, or Back.

- Every sheet has the handle, a `title-md` title, and at most one primary action plus a text button to back out.
- Opens in `duration-sheet` (260ms) with `ease-enter`; closes in `duration-base` (200ms).
- Never centre a dialog in the middle of the screen; that was a bug we removed.
