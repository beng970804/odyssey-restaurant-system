# Order status changes through Action endpoints, not a status field

There is no `PATCH /orders/:id { status }`. Status changes happen through named operations — `POST /orders/:id/accept`, `/start-preparing`, `/mark-ready`, `/complete`, `/cancel` — each of which consults a shared transition map and returns `409 Conflict` if the Order's current status doesn't permit it.

A writable status field invites the client to decide what the Order's state should be, which makes every illegal sequence a matter of front-end discipline rather than a server-enforced impossibility. Modelling the operations instead means the API describes what staff actually do, the OpenAPI document reads as a list of business operations, and each Action has a natural home for its own rules — `cancel` requires a reason, `accept` is skipped entirely when auto-accept is on.

## Consequences

- The transition map lives in `packages/types` and is imported by both sides: the server enforces it, the dashboard renders buttons from it. The UI cannot offer an Action the server will refuse.
- Adding a status means editing one object and adding one route, rather than auditing everywhere a status string could be assigned.
- `completed` and `cancelled` are terminal. Reversing an Order would be a refund, which is a different domain and out of scope.
