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
 * 4. The dark is warm, because the light is. A blue-slate dark mode under a
 *    cream light mode makes the toggle feel like two different products, so the
 *    neutrals are a warm charcoal rather than a navy one. Warm, not brown: at
 *    this lightness a tint strong enough to read as brown reads as a dirty
 *    black instead, so every surface leans warm by only a few units.
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
      // Lifted off black on purpose. A canvas down at 0.6% luminance leaves the
      // three surface steps within 1.07:1 of each other — ordered, but too close
      // to resolve, so a card only reads as a card because of its border.
      // Starting at 1.1% buys perceptible steps without ever getting bright.
      canvas: '#1E1B19',
      surface: '#272321',
      raised: '#322C29',
      overlay: '#322C29',
      inset: '#161413',
    },
    text: {
      primary: '#F2E9E1',
      secondary: '#D9CCC1',
      muted: '#A89A8E',
      inverse: '#1C1917',
      onBrand: '#1C1917',
    },
    border: {
      subtle: '#322C29',
      default: '#423A35',
      strong: '#574C45',
      focus: '#FF8A4C',
    },
    brand: {
      // Brightened, unlike the slate original: a burnt orange dark enough to
      // carry white text in light mode disappears into a near-black canvas, so
      // dark mode trades the white label for a dark one and takes the lift.
      default: '#FF8A4C',
      hover: '#FFA06B',
      active: '#FFB88C',
      subtle: '#43271A',
      onBrand: '#1C1917',
    },
    status: {
      success: { bg: '#12301E', fg: '#86EFAC', border: '#1C5334' },
      warning: { bg: '#33280A', fg: '#FCD34D', border: '#7A5E10' },
      danger: { bg: '#3A1512', fg: '#FCA5A5', border: '#7F2420' },
      info: { bg: '#0E2A3A', fg: '#7DD3FC', border: '#10557C' },
      neutral: { bg: '#322C29', fg: '#D9CCC1', border: '#423A35' },
    },
  },
  elevation: {
    flat: { ...lightTheme.elevation.flat, shadowColor: '#000000' },
    raised: { ...lightTheme.elevation.raised, shadowColor: '#000000', shadowOpacity: 0.03 },
    overlay: { ...lightTheme.elevation.overlay, shadowColor: '#000000', shadowOpacity: 0.05 },
    modal: { ...lightTheme.elevation.modal, shadowColor: '#000000', shadowOpacity: 0.08 },
  },
}
