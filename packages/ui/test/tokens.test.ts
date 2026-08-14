import { describe, expect, it } from 'vitest'
import { darkTheme } from '../src/theme/dark'
import { lightTheme } from '../src/theme/tokens'
import type { Theme } from '../src/theme/types'

function keyPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k))
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].toSorted((x, y) => y - x)
  return (lighter! + 0.05) / (darker! + 0.05)
}

function rgb(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
  return [r!, g!, b!]
}

/** Degrees on the colour wheel: 0 is red, 60 yellow, 240 blue. */
function hue(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => c / 255) as [number, number, number]
  const max = Math.max(r, g, b)
  const chroma = max - Math.min(r, g, b)
  if (chroma === 0) return 0
  const sixth =
    max === r ? ((g - b) / chroma + 6) % 6 : max === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4
  return sixth * 60
}

/** How far a colour leans warm. Positive is warm, negative is cool. */
function warmth(hex: string): number {
  const [r, , b] = rgb(hex)
  return r - b
}

const THEMES: [string, Theme][] = [
  ['light', lightTheme],
  ['dark', darkTheme],
]

describe('token structure', () => {
  it('light and dark expose identical token paths', () => {
    // The guarantee that dark mode can never be half-finished: a missing dark
    // token fails here rather than showing up as an invisible label.
    expect(keyPaths(darkTheme).toSorted()).toEqual(keyPaths(lightTheme).toSorted())
  })

  it('spacing follows a 4px grid', () => {
    for (const value of Object.values(lightTheme.space)) expect(value % 4).toBe(0)
  })

  it('breakpoints ascend', () => {
    const { sm, md, lg, xl } = lightTheme.layout.breakpoints
    expect([sm, md, lg, xl]).toEqual([sm, md, lg, xl].toSorted((a, b) => a - b))
  })

  it('the content area cannot be wider than the widest breakpoint minus the sidebar', () => {
    const { contentMaxWidth, sidebarWidth, breakpoints } = lightTheme.layout
    expect(contentMaxWidth + sidebarWidth).toBeLessThanOrEqual(breakpoints.xl)
  })

  it('every colour token is a six-digit hex', () => {
    for (const [name, theme] of THEMES) {
      for (const path of keyPaths(theme.color)) {
        const value = path
          .split('.')
          .reduce<Record<string, unknown>>(
            (obj, key) => obj[key] as Record<string, unknown>,
            theme.color as unknown as Record<string, unknown>,
          )
        expect(String(value), `${name}.${path}`).toMatch(/^#[0-9A-F]{6}$/)
      }
    }
  })
})

describe('contrast', () => {
  // Body text must clear WCAG AA (4.5:1). Muted text is deliberately quieter,
  // so it is held to the 3:1 large-text floor instead of being exempted.
  it.each(THEMES)('%s: primary and secondary text clear AA on every surface', (_name, theme) => {
    for (const surface of [theme.color.bg.canvas, theme.color.bg.surface, theme.color.bg.raised]) {
      expect(contrast(theme.color.text.primary, surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(theme.color.text.secondary, surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(theme.color.text.muted, surface)).toBeGreaterThanOrEqual(3)
    }
  })

  it.each(THEMES)('%s: text on the brand colour clears AA', (_name, theme) => {
    expect(contrast(theme.color.brand.onBrand, theme.color.brand.default)).toBeGreaterThanOrEqual(
      4.5,
    )
  })

  it.each(THEMES)('%s: every status pair clears AA', (_name, theme) => {
    for (const [tone, tokens] of Object.entries(theme.color.status)) {
      expect(contrast(tokens.fg, tokens.bg), tone).toBeGreaterThanOrEqual(4.5)
    }
  })

  it.each(THEMES)('%s: the focus ring is visible against the canvas', (_name, theme) => {
    expect(contrast(theme.color.border.focus, theme.color.bg.canvas)).toBeGreaterThanOrEqual(3)
  })
})

describe('palette discipline', () => {
  it('never reaches for pure black or pure white text', () => {
    // Pure values flatten depth, so the ramp stops short at both ends.
    expect(lightTheme.color.text.primary).not.toBe('#000000')
    expect(darkTheme.color.text.primary).not.toBe('#FFFFFF')
  })

  it('keeps the brand recognisable in dark mode', () => {
    // Hierarchy parity: if the brand pops in light it pops in dark, rather than
    // being desaturated into the background.
    expect(
      contrast(darkTheme.color.brand.default, darkTheme.color.bg.canvas),
    ).toBeGreaterThanOrEqual(3)
  })

  it('raises surfaces by lightening in dark mode, rather than inverting light', () => {
    const { canvas, surface, raised } = darkTheme.color.bg
    expect(luminance(surface)).toBeGreaterThan(luminance(canvas))
    expect(luminance(raised)).toBeGreaterThan(luminance(surface))
  })

  it('spaces the dark surface steps far enough apart to see', () => {
    // Ordering alone is not depth. Dark mode carries separation on the surfaces
    // rather than the shadows, so a step the eye cannot resolve is a card that
    // does not look like a card. 1.08:1 is about where the boundary stops
    // needing a border to be found.
    const { canvas, surface, raised } = darkTheme.color.bg
    expect(contrast(canvas, surface)).toBeGreaterThanOrEqual(1.08)
    expect(contrast(surface, raised)).toBeGreaterThanOrEqual(1.08)
  })

  it('softens shadows in dark mode, where they read poorly', () => {
    for (const level of ['raised', 'overlay', 'modal'] as const) {
      expect(darkTheme.elevation[level].shadowOpacity).toBeLessThanOrEqual(
        lightTheme.elevation[level].shadowOpacity,
      )
    }
  })
})

describe('warmth', () => {
  // The palette is warm on purpose, and warmth is the kind of decision that
  // erodes one well-meaning hex at a time. These tests are what stop a cool
  // slate grey being pasted back in six commits from now.

  it.each(THEMES)('%s: every surface leans warm', (_name, theme) => {
    for (const [role, value] of Object.entries(theme.color.bg)) {
      expect(warmth(value), `bg.${role}`).toBeGreaterThan(0)
    }
  })

  it.each(THEMES)('%s: the text ramp is warm grey, never cool grey', (_name, theme) => {
    for (const role of ['primary', 'secondary', 'muted'] as const) {
      expect(warmth(theme.color.text[role]), `text.${role}`).toBeGreaterThan(0)
    }
  })

  it.each(THEMES)('%s: the brand is an orange', (_name, theme) => {
    // Narrow on purpose: at 45 degrees it has become yellow and stops reading
    // as a brand, and below 15 it is a red and starts reading as danger.
    for (const role of ['default', 'hover', 'active'] as const) {
      expect(hue(theme.color.brand[role]), `brand.${role}`).toBeGreaterThanOrEqual(15)
      expect(hue(theme.color.brand[role]), `brand.${role}`).toBeLessThanOrEqual(45)
    }
  })

  it.each(THEMES)('%s: the neutral status tone sits on the canvas, not against it', (_n, theme) => {
    // A cool grey chip on a cream canvas is the loudest possible tell that two
    // palettes were merged, and neutral is on screen more than any other tone.
    expect(warmth(theme.color.status.neutral.bg)).toBeGreaterThan(0)
    expect(warmth(theme.color.status.neutral.fg)).toBeGreaterThan(0)
  })

  it.each(THEMES)('%s: warning stays clear of the brand hue', (_name, theme) => {
    // Once the brand is orange, an amber Pending badge reads as a button. The
    // gap is what keeps "needs attention" and "press me" telling apart.
    const gap = Math.abs(hue(theme.color.status.warning.fg) - hue(theme.color.brand.default))
    expect(gap).toBeGreaterThanOrEqual(12)
  })
})
