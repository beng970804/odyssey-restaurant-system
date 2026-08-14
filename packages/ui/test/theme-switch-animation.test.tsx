import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { Pressable, Text, View } from 'react-native'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useThemeMode } from '../src/theme/ThemeProvider'
import { useThemeSwitchAnimation } from '../src/theme/useThemeSwitchAnimation'

const STYLE_ID = 'theme-switch-style'

function Harness() {
  const { mode } = useThemeMode()
  const { ref, toggle } = useThemeSwitchAnimation()

  return (
    <View ref={ref}>
      <Pressable role="button" onPress={toggle}>
        <Text>{mode}</Text>
      </Pressable>
    </View>
  )
}

const renderHarness = () =>
  render(
    <ThemeProvider>
      <Harness />
    </ThemeProvider>,
  )

const press = async () => {
  await act(async () => {
    screen.getByRole('button').click()
  })
}

const sheet = () => document.getElementById(STYLE_ID)?.textContent ?? ''

/**
 * The declaration block for a selector, so rules can be asserted in isolation.
 * The last block wins the cascade, and both snapshots are named twice — once by
 * the shared reset at the top of the sheet, once by their own rule.
 */
const ruleFor = (selector: string) => {
  const escaped = selector.replaceAll(/[()]/g, String.raw`\$&`)
  const blocks = [...sheet().matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g'))]
  return blocks.at(-1)?.[1] ?? ''
}

/**
 * jsdom has no View Transition API, so every test that wants the animation
 * stands one in. `finished` stays pending until a test settles it, which is
 * what leaves the injected stylesheet around long enough to assert on — the
 * hook drops it the moment the transition ends.
 */
function stubViewTransition() {
  let settleFinished!: (value: void) => void
  let rejectFinished!: (reason: Error) => void
  const finished = new Promise<void>((resolve, reject) => {
    settleFinished = resolve
    rejectFinished = reject
  })

  const startViewTransition = vi.fn((callback: () => void) => {
    callback()
    return { ready: Promise.resolve(), finished }
  })
  Object.assign(document, { startViewTransition })

  const finish = async (rejected?: boolean) => {
    await act(async () => {
      if (rejected) rejectFinished(new Error('skipped'))
      else settleFinished()
      await finished.catch(() => {})
    })
  }

  return { startViewTransition, finish }
}

afterEach(() => {
  vi.unstubAllGlobals()
  document.getElementById(STYLE_ID)?.remove()
  delete (document as { startViewTransition?: unknown }).startViewTransition
})

describe('useThemeSwitchAnimation', () => {
  it('flips the mode without a transition when the browser has none', async () => {
    renderHarness()
    expect(screen.getByText('light')).toBeInTheDocument()

    await press()

    expect(screen.getByText('dark')).toBeInTheDocument()
    expect(document.getElementById(STYLE_ID)).toBeNull()
  })

  it('flips the mode inside the view transition when the browser has one', async () => {
    const { startViewTransition } = stubViewTransition()
    renderHarness()

    await press()

    expect(startViewTransition).toHaveBeenCalledOnce()
    expect(screen.getByText('dark')).toBeInTheDocument()
  })

  it('reveals through a gaussian-blurred circle mask', async () => {
    stubViewTransition()
    renderHarness()

    await press()

    // The soft edge is the whole point of blur-circle over circle: a hard
    // SVG circle mask would pass every other assertion here.
    expect(sheet()).toContain('feGaussianBlur')
    expect(sheet()).toContain('::view-transition-new(root)')
    expect(sheet()).toContain('@keyframes themeSwitchBlurCircle')
  })

  it('grows the mask from nothing to past the far corner of the viewport', async () => {
    stubViewTransition()
    renderHarness()

    await press()

    expect(sheet()).toMatch(/mask-size:\s*0px/)
    const [, grown] = sheet().match(/mask-size:\s*(\d+(?:\.\d+)?)px/g) ?? []
    expect(Number.parseFloat(grown?.replace(/\D+/g, '') ?? '0')).toBeGreaterThan(window.innerWidth)
  })

  it('drops the animation for readers who asked for reduced motion', async () => {
    const { startViewTransition } = stubViewTransition()
    // jsdom ships no matchMedia at all, so this is a definition and not a spy.
    vi.stubGlobal('matchMedia', () => ({ matches: true }))

    renderHarness()
    await press()

    expect(startViewTransition).not.toHaveBeenCalled()
    expect(screen.getByText('dark')).toBeInTheDocument()
  })

  it('replaces the previous stylesheet rather than stacking a second one', async () => {
    stubViewTransition()
    renderHarness()

    await press()
    await press()

    expect(document.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1)
  })

  /**
   * Without a fill mode the mask reverts to the base rule on the final frame —
   * a circle sized to the snapshot, offset to the toggle — while both snapshots
   * are still on screen, which reads as a flash of the old theme at the end.
   */
  it.each(['::view-transition-new(root)', '::view-transition-old(root)'])(
    'holds the grown mask on %s instead of snapping back',
    async (selector) => {
      stubViewTransition()
      renderHarness()

      await press()

      // The longhand has to follow the shorthand, which resets it to `none`.
      expect(ruleFor(selector)).toMatch(/animation:[^;]+;\s*animation-fill-mode:\s*both/)
    },
  )

  it('drops the stylesheet once the transition ends', async () => {
    const { finish } = stubViewTransition()
    renderHarness()

    await press()
    expect(document.getElementById(STYLE_ID)).not.toBeNull()

    await finish()
    expect(document.getElementById(STYLE_ID)).toBeNull()
  })

  it('drops the stylesheet when the transition is skipped', async () => {
    const { finish } = stubViewTransition()
    renderHarness()

    await press()
    await finish(true)

    expect(document.getElementById(STYLE_ID)).toBeNull()
    expect(screen.getByText('dark')).toBeInTheDocument()
  })
})
