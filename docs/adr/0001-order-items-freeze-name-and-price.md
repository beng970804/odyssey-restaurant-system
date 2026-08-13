# Order Items freeze the Menu Item's name and price

An Order Item stores a copy of the Menu Item's name and unit price as they were at the moment the Order was placed, alongside the `menuItemId` reference. It does not read the current price through a join.

An Order is a record of something that already happened, so it must not change when the menu changes. If prices were read live, raising the price of a dish would silently rewrite every past Order that contained it, corrupting revenue figures and Lifetime Spend; deleting a Menu Item would break historical Orders entirely. Freezing the values costs two extra columns and some duplication, and buys an Order that is fully self-contained and immune to later menu edits.

## Consequences

- The `menuItemId` reference is kept for reporting ("most popular items"), but is never the source of an Order's money or naming.
- Menu Items are never hard-deleted while referenced; they are archived, so the reporting link survives.
- An Order's Subtotal, Tax, Delivery Fee and Total are likewise persisted rather than recomputed on read, for the same reason — a change to the tax rate in Settings must not alter last month's receipts.
