# DishTile

A dish on the counter menu: tap ADD, then use the stepper to change the count.

- States: rest (ADD), selected with a quantity (stepper, `border-selected` 2px), out of stock (`opacity-off`, no ADD).
- Always show the veg or non-veg mark; it is a legal and trust signal in India.
- Long-press a tile to mark it out of stock.
- Tiles sit two per row on phones; a half-filled last row keeps empty spacers, so no tile ever stretches wider than the others.
