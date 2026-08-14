import { lightTheme } from './tokens'
import type { Theme } from './types'

/**
 * Not an inversion of light. Four rules separate the two:
 *
 * 1. Surfaces raise by *lightening* — canvas is the darkest thing on screen and
 *    each layer above it is a step lighter, which is how depth reads without
 *    shadows.
 * 2. Shadows soften, because a dark shadow on a dark surface is invisible; the
 *    border tokens carry the separation instead.
 * 3. Status tones desaturate — the light-mode pastels would glare — while the
 *    brand keeps its hue, so it stays recognisable in both modes.
 * 4. The dark is *cool*, where the light is warm — the one rule that reversed.
 *    A warm dark is the tidier theory, but below about 10% lightness a warm
 *    tint has nowhere to go: too little and the canvas is a plain black, enough
 *    to read as brown and it reads as a black that got dirty. A blue-slate has
 *    room to be tinted and still look intentional. See ADR 0006.
 *
 * Continuity across the toggle is carried by the brand instead of the
 * neutrals, and orange on blue-slate is a complementary pair rather than an
 * accident — the accent is louder here than it ever was on brown.
 *
 * The brand inverts its label colour rather than its hue. Light mode darkens
 * the orange until white text clears AA on it; dark mode brightens it until it
 * clears 3:1 against the canvas, and at that lightness white text no longer
 * clears 4.5:1 — so `onBrand` goes dark. Same brand, opposite label.
 *
 * Everything dimensional (space, radius, typography, layout) is shared: a theme
 * swap changes colour and depth, never the grid.
 */
export const darkTheme: Theme = {
  ...lightTheme,
  mode: 'dark',
  color: {
    bg: {
      // An even ramp: each step adds roughly 12 per channel, holding the blue
      // lead constant so the tint never drifts as surfaces stack. The canvas
      // stays genuinely dark while the steps land at 1.13:1 and 1.17:1 — far
      // enough apart that a card reads as raised before its border is noticed.
      canvas: '#121420',
      surface: '#1E202C',
      raised: '#2A2C37',
      overlay: '#2A2C37',
      inset: '#0D0F19',
    },
    text: {
      // Cool grey, tracking the surfaces. A warm ramp on these would be the
      // same mismatch the light theme avoids, pointing the other way.
      primary: '#E9EBF2',
      secondary: '#C4C8D6',
      muted: '#8F94A6',
      inverse: '#121420',
      onBrand: '#121420',
    },
    border: {
      subtle: '#262834',
      default: '#333543',
      strong: '#454857',
      focus: '#FF8A4C',
    },
    brand: {
      // Brightened, unlike the slate original: a burnt orange dark enough to
      // carry white text in light mode disappears into a near-black canvas, so
      // dark mode trades the white label for a dark one and takes the lift.
      default: '#FF8A4C',
      hover: '#FFA06B',
      active: '#FFB88C',
      // The nav pill: the brand mixed down into the canvas rather than a brown
      // picked by hand, so it reads as tinted canvas and not as a third neutral.
      subtle: '#3D2928',
      onBrand: '#121420',
    },
    status: {
      success: { bg: '#12301E', fg: '#86EFAC', border: '#1C5334' },
      warning: { bg: '#33280A', fg: '#FCD34D', border: '#7A5E10' },
      danger: { bg: '#3A1512', fg: '#FCA5A5', border: '#7F2420' },
      info: { bg: '#0E2A3A', fg: '#7DD3FC', border: '#10557C' },
      neutral: { bg: '#2A2C37', fg: '#C4C8D6', border: '#333543' },
    },
  },
  elevation: {
    flat: { ...lightTheme.elevation.flat, shadowColor: '#000000' },
    raised: { ...lightTheme.elevation.raised, shadowColor: '#000000', shadowOpacity: 0.03 },
    overlay: { ...lightTheme.elevation.overlay, shadowColor: '#000000', shadowOpacity: 0.05 },
    modal: { ...lightTheme.elevation.modal, shadowColor: '#000000', shadowOpacity: 0.08 },
  },
}
