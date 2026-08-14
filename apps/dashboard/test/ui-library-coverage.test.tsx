import * as ui from '@repo/ui'
import { ThemeProvider } from '@repo/ui'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ComponentGallery } from '../src/features/ui-library/sections'

/**
 * The gallery is the one section of the UI library page that cannot derive
 * itself from the theme — a component has to be written out by hand. So this
 * test is the thing that keeps it honest: add a primitive to `@repo/ui` and the
 * page has to grow an example of it, or this fails.
 */
// Read from the project root rather than `import.meta.url`: under jsdom that
// URL is an http one, which `readFileSync` refuses.
const source = readFileSync('src/features/ui-library/sections.tsx', 'utf8')

/**
 * Primitives that reach the page through another component rather than on their
 * own. Each is still visible to a reader — just not as its own example.
 */
const SHOWN_INDIRECTLY: Record<string, string> = {
  Calendar: 'the panel DateRangePicker opens',
  Popover: 'the panel Select opens',
  EmptyState: "the Table's empty state",
  ErrorState: "the Table's error state",
  Overlay: 'the scrim under Modal, Drawer and OverlayPanel',
  ThemeProvider: 'mounted at the app root',
  ToastProvider: 'mounted at the app root',
}

/**
 * A JSX opening tag for exactly this component: the delimiter matters, or
 * `<OverlayPanel` counts as a use of `Overlay`.
 */
const isRendered = (name: string) => new RegExp(String.raw`<${name}[\s/>]`).test(source)

/** PascalCase runtime exports are the components; hooks, tokens and utils are not. */
const components = Object.keys(ui)
  .filter((name) => /^[A-Z][a-z]/.test(name))
  .toSorted()

describe('UI library gallery', () => {
  it('has an example of every primitive the library exports', () => {
    const missing = components.filter((name) => !(name in SHOWN_INDIRECTLY) && !isRendered(name))

    expect(missing).toEqual([])
  })

  it('does not excuse a primitive that is on the page after all', () => {
    // Keeps the allowlist from outliving its reason: once something gets its
    // own example, its entry here is stale and should go.
    const excused = Object.keys(SHOWN_INDIRECTLY).filter(isRendered)

    expect(excused).toEqual([])
  })

  it('gives the chip rail more chips than fit, so its scrolling is visible', () => {
    // ChipGroup's drag- and wheel-to-scroll only exist when the row overflows.
    // A demo of four chips renders a rail that never scrolls, which reads as
    // the feature being broken.
    render(
      <ThemeProvider>
        <ComponentGallery />
      </ThemeProvider>,
    )

    // The category rail is the first of the two the gallery renders.
    const rail = screen.getAllByTestId('chip-scroller').at(0)
    const chips = rail?.querySelectorAll('[data-testid^="chip-"]') ?? []

    expect(chips.length).toBeGreaterThanOrEqual(10)
  })
})
