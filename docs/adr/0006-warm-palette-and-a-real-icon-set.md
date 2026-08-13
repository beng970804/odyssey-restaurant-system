# A warm palette, an orange brand, and a real icon set

The design system started slate-and-blue. It is now cream-and-burnt-orange, and the dashboard pulls line icons from `@tabler/icons-react-native` rather than shipping none.

The palette moved because the product is a restaurant floor tool, and a cool slate board reads as a finance product. The direction was taken from a reference design, but not copied from it: three of its decisions did not survive contact with the constraints already in this repo.

**The brand is darker than the reference's orange.** A saturated `#F97316` carries white label text at 2.9:1, which fails WCAG AA outright. The brand darkens to `#C2410C`, where white clears 4.5:1, so the accent is usable on a button rather than only on decoration. Dark mode cannot use that colour — it disappears into a near-black canvas — so it brightens to `#FF8A4C` and flips `onBrand` to a dark label instead. Same brand, opposite label, both modes accessible.

**Warning moved off amber.** The old `#B45309` sat about six degrees from the new brand hue. Once the brand turned orange, a Pending badge and a primary button were the same colour, so warning shifted to gold and `status.neutral` warmed up to stop its chips looking like a foreign palette on cream.

**Money did not turn orange.** In the reference every price is orange, which works when a card shows one number. A thirty-row Orders table with every total in orange turns the accent into noise and destroys the signal that orange means actionable. Orange is reserved for the active nav pill, primary buttons, the focus ring, and at most one emphasized figure per screen.

The direction is enforced rather than trusted: `packages/ui/test/tokens.test.ts` asserts that every surface and the whole text ramp lean warm, that the brand stays inside the orange band in both modes, and that warning keeps its distance from the brand hue — on top of the AA contrast and light/dark parity checks that were already there. Its first run caught `bg.raised` still being pure white.

## The icon set

The spec's stack is React Native Web, where there are no HTML tags, so a DOM-SVG pack like `@tabler/icons-react` was not an option — it would inject raw `<svg>` elements into a tree built from typed style objects. Tabler, Phosphor and Hugeicons all ship React Native builds and all three peer-depend on `react-native-svg`, so the dependency cost was identical and the choice came down to Tabler's 2px stroke matching the intended look.

`@repo/ui` does not depend on either package. `NavItem` and `ChipGroup` take their `icon` as a node *or* a function of `{ color, size }`, which keeps the icon set an application choice while the design system keeps control of what colour an icon takes in an active row. The Menu's category icons are a keyword map in the Menu feature, not a column on `categories`: categories are free text, so 'Hot Drinks' and 'Drinks' match the same icon, and an icon column would have meant a schema change, a contract regeneration and an editor UI for something cosmetic.

## Consequences

- **Icons are imported one subpath at a time**, never from the package barrel. Metro does not tree-shake it, so a barrel import ships all ~5,900 icons: it took the exported web bundle from 3.7MB to 9.1MB and put `IconZeppelin` in production. The subpaths are untyped because the package's `exports` map points per-icon types at a path they are not published at, so `apps/dashboard/src/types/tabler-icons.d.ts` supplies the shape.
- `react-native-svg` ships separate native and web builds. Metro picks the web one from `platform=web`; Vitest has no such notion, so `apps/dashboard/vitest.config.ts` needs both an alias to the web entry and those packages inlined. Removing either brings back a Flow parse error from the native build.
- `ChipGroup` is a new primitive rather than a `Tabs` variant. Tabs switch panels and announce a `tablist`; chips filter a list that stays put and announce a `radiogroup`. One component would have to lie to assistive technology about which is happening.
- Dark mode's `brand.onBrand` differs from light's. Any component that hardcodes white on the brand colour instead of reading the token will be unreadable in one of the two modes.
- The greeting on Home names nobody. There is no auth and no operator record, so the header greets without a name and reports the fetch time instead.
