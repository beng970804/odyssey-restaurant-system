# Restaurant Operations

The staff-facing side of a single restaurant: what it sells, who it has served, the orders moving through the kitchen, and the rules that govern whether an order may be taken at all.

There is no customer-facing context. Everyone using this system works at the restaurant.

## Language

### The menu

**Menu Item**:
Something the restaurant sells, at a price, belonging to exactly one Category.
_Avoid_: Product, dish, SKU

**Category**:
A named grouping of Menu Items used to organise the menu.
_Avoid_: Section, group, tag

**Availability**:
Whether a Menu Item may be put on a *new* Order right now. It says nothing about Orders already placed.
_Avoid_: In stock, sold out, active, enabled

### Orders

**Order**:
A request for food, placed at a moment in time, that moves through a fixed sequence of Statuses until it is Completed or Cancelled.
_Avoid_: Ticket, sale, transaction, purchase

**Order Item**:
One line of an Order: a quantity, plus a frozen copy of the Menu Item's name and price as they were when the Order was placed. It does not follow later menu edits.
_Avoid_: Line item, order line, cart item

**Channel**:
How an Order is served — dine-in, takeaway, or delivery. Each Channel can be independently switched off in Settings, which prevents new Orders on it.
_Avoid_: Order type, fulfilment method, service mode

**Status**:
Where an Order currently sits in its lifecycle. One of: Pending, Accepted, Preparing, Ready, Completed, Cancelled.
_Avoid_: State, stage, phase

**Transition**:
A permitted move from one Status to another. Only the moves listed in the transition map exist; anything else is not a slow or discouraged path, it is impossible.
_Avoid_: Status update, status change

**Action**:
The named operation a member of staff performs to cause a Transition — Accept, Start Preparing, Mark Ready, Complete, Cancel. Staff perform Actions; they do not set Statuses.
_Avoid_: Command, event, mutation

**Cancellation Reason**:
Free text recorded when an Order is Cancelled, which is what distinguishes a refusal by the restaurant from a change of mind by the Customer. The two are not separate Statuses.
_Avoid_: Rejection reason, void reason

**Terminal Status**:
Completed or Cancelled. No Transition leads out of either.
_Avoid_: Final state, closed

### People

**Customer**:
A person the restaurant has served and holds a record for. Optional on an Order — a walk-in Order has no Customer. A Customer never signs in; there are no accounts in this system.
_Avoid_: User, client, account, guest, buyer

**Walk-in Order**:
An Order with no Customer attached. It counts toward revenue but appears in no Customer's history.
_Avoid_: Anonymous order, guest order

**Lifetime Spend**:
The summed Totals of every non-Cancelled Order attached to one Customer. Because Walk-in Orders belong to nobody, the sum of all Lifetime Spend is less than total revenue, by design.
_Avoid_: LTV, customer value, total spend

### Money

**Money**:
Every monetary figure in this system is a whole number of minor units — cents — in a single currency. There are no fractional cents and no per-Order currency.
_Avoid_: Price as decimal, amount as float

**Subtotal**:
The sum of every Order Item's frozen price times its quantity.

**Total**:
Subtotal plus Tax plus any Delivery Fee. Calculated by the restaurant's system when the Order is placed, never supplied by whoever is placing it, and frozen thereafter.
_Avoid_: Grand total, amount due, final price

### Rules

**Settings**:
The single set of rules governing whether and how new Orders may be placed: default prep time, auto-accept, which Channels are open, opening hours, tax rate, delivery fee, currency. There is one Settings record because there is one restaurant.
_Avoid_: Config, preferences, options

**Auto-Accept**:
A Setting which, when on, places new Orders directly in Accepted rather than Pending — skipping the staff's Accept Action.

**Opening Hours**:
The windows during which new Orders may be placed. Outside them, placing an Order is refused. They do not stop existing Orders from progressing.
_Avoid_: Business hours, schedule, availability
