# The generated API contract is committed to the repo

The OpenAPI document and the Orval-generated client are produced by `pnpm gen:contract` and checked into git, rather than generated on the fly during install or dev.

The alternative — pointing Orval at a running dev server and gitignoring the output — means the contract only exists while something is running, and a reviewer cloning the repo cannot see the API surface without booting the backend and a database. Committing the artifacts makes `gen:contract` a single deterministic command with no server involved, makes the contract readable in a diff, and enables the check that actually proves the architecture works: CI runs `pnpm gen:contract && git diff --exit-code`, which fails if the committed contract has drifted from the Drizzle schema.

## Consequences

- Generated files are never hand-edited. A change to the API starts in `schema.ts` or a route definition and is propagated by rerunning the command.
- Diffs on generated files will be noisy in review. Accepted — the drift check is worth more than clean diffs.
