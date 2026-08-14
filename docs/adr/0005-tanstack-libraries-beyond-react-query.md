# TanStack Form, Table and Charts alongside React Query

The brief names React Query as part of the required stack and forbids *replacing* the stack with alternatives — Next.js, NestJS, Prisma, tRPC, Supabase, Firebase, handwritten frontend API types. Adding TanStack Form, Table and Charts substitutes for none of those: React Query remains the only data layer, and every request still goes through an Orval-generated hook. All three are headless, so they contribute behaviour and no markup, and the design system keeps rendering every pixel.

Each earns its place differently.

**Form** closes a hole in the contract pipeline. The menu item form previously validated by hand — a `name.trim().length > 0` in the component restating a rule the Drizzle schema already encoded. Orval now emits Zod schemas from the same OpenAPI document as the hooks (`packages/api-client/src/generated/zod/`), and `useMenuItemForm` validates against `schemas.CreateMenuItemBody`. A required field or a minimum is written once, in the column definition, and reaches the form the same way the types do. This is the only one of the three that removes a duplicated contract rather than adding a capability.

**Table** replaced the row-ordering logic the CRM screen would otherwise have grown. CRM is the one list the server does not paginate, so the whole set is in hand and sorting it client-side is honest. The primitive's public API is unchanged apart from three optional fields — `sortable`, `sortValue`, `sortDescFirst`. `sortValue` exists because a money column renders `S$120.00` and must sort on `12000`; comparing rendered strings puts `S$120.00` before `S$30.00`.

**Charts** replaced a hand-rolled bar row. The original spec ruled a charting library out on the grounds that one "under React Native Web is a time sink" — that reasoning was weaker than it looked, because the brief makes web the requirement and native an explicit bonus. The trade it does force is real and is recorded below.

## Consequences

- **`TrendChart` is web-only.** It uses the library's DOM adapter, which emits SVG elements directly. That is fine under React Native Web, where every `View` is already a `div`, and broken on iOS and Android. TanStack Charts does ship a `react-native` adapter backed by `react-native-svg`; swapping to it is the work a native build would need. It was tried first and abandoned: `react-native-svg` requires bare `react-native`, which is Flow source Node cannot parse, and the test setup externalises node_modules so the `react-native` → `react-native-web` alias never reaches it. Fixing that is a test-infrastructure problem, not a product one, and native is not a requirement.
- **`@tanstack/charts` is pre-1.0** (0.11.1). Its API may move under a minor bump; the blast radius is one component. The newer 0.12.0 exists but was published days before this was written, and the workspace's minimum-release-age policy correctly held it back.
- **`react-native-svg` is present in `node_modules` without being a declared dependency.** `autoInstallPeers` pulls it in as an optional peer of `@tanstack/charts`. Nothing imports it while the DOM adapter is in use, so it does not reach the web bundle.
- **`@tanstack/react-table` is v9**, whose API differs substantially from the v8 that most examples online show: features are opted into individually via `tableFeatures({ ... })` rather than arriving by default. Only `rowSortingFeature` and two comparators are registered, so nothing unused is bundled.
- **A second Orval output now runs** on every `pnpm gen:contract`. It writes to `packages/api-client/src/generated/zod/` and is covered by the same CI drift check as the rest of the contract.
- The generated Zod validators share names with the generated *types* — `CreateMenuItemBody` is both. They are re-exported under a `schemas` namespace to keep both reachable.
