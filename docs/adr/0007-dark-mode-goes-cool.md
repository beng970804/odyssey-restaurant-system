# Dark mode goes cool, and the two modes stop matching

[ADR 0006](0006-warm-palette-and-a-real-icon-set.md) made the whole system warm, dark mode included, on the argument that a cool dark under a cream light makes the toggle feel like two products. Dark mode is now a blue-slate — canvas `#121420`, surfaces stepping to `#1E202C` and `#2A2C37` — while light mode stays cream. That half of 0006 is reversed; everything else in it stands.

The warm dark never worked in practice, and the reason is that it had nowhere to go. Warmth is a difference between channels, and at 1% luminance there are almost no channel values left to differ. `#16110E` leant warm by 8 units out of a possible 22 — barely a tint, yet already enough to look like a black that had got dirty rather than a brown that had been chosen. Every fix pulled the wrong way: more tint made it muddier, less made it a plain black, and lifting it bright enough for the tint to read as brown gave up the darkness that makes a dark theme worth having. A blue-slate does not have this problem. Blue tolerates being dark — it is the one hue that stays recognisably itself down near black, which is why nearly every dark interface that isn't pure grey is some kind of navy.

**The toggle-continuity argument survives, carried by something else.** 0006 was right that the two modes have to feel like one product; it was wrong that matching neutrals is the only way to do that. Continuity now rides on the brand, which keeps its hue across both modes, plus the shared spacing, radius and type scale — a theme swap still changes colour and depth and never the grid. Orange against blue-slate is also a complementary pair rather than a compromise: the accent is louder in dark mode now than it ever was against brown, which suits an interface where orange means actionable.

**The surface ramp is arithmetic, not hand-picked.** Each step adds about 12 per channel and holds the blue lead constant, so the tint does not drift as surfaces stack. The steps land at 1.13:1 and 1.17:1 — the previous warm ramp managed 1.07:1, which is ordered but below what the eye resolves, so a card only read as raised because of its border. Dark mode carries depth on surfaces rather than shadows, so an unresolvable step is a real defect and not a nicety.

**Text cooled with the surfaces.** A warm text ramp on cool surfaces is the same mismatch 0006 set out to avoid, pointing the other way, so the ramp moved to `#E9EBF2` / `#C4C8D6` / `#8F94A6`. `brand.subtle` — the nav pill — is the brand mixed down into the canvas rather than a brown picked by hand, which keeps it reading as tinted canvas instead of a third neutral.

**The status hues did not move.** Success, warning, danger and info are carrying meaning, not temperature; a gold warning is warm because gold is warm, and cooling it would only make it a worse warning. Only `status.neutral` followed the surfaces, because it is a neutral.

## Consequences

- **The warmth tests became temperature tests.** `packages/ui/test/tokens.test.ts` used to assert that every surface and the whole text ramp lean warm in both modes. It now asserts that each mode's neutrals lean *its own* way, and — separately — that the two modes stay on opposite sides. The property worth protecting was never warmth as such; it was that no single neutral points the wrong way within a mode.
- A new test holds the dark surface steps to 1.08:1, so the ramp cannot quietly collapse back toward black.
- **Light mode is now the odd one out.** A cream light mode and a blue-slate dark mode is a deliberate split, not an oversight, but if the light theme ever feels mismatched the fix is to cool it — not to re-warm the dark and rediscover why that failed.
- Anything that hardcodes a warm neutral instead of reading a token will now be visibly wrong in dark mode. Nothing did at the time of writing; the theme tokens are the only source of colour.
