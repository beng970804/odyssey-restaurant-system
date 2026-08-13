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
 *    canvas is a near-black brown rather than a near-black navy.
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
      canvas: '#16110E',
      surface: '#1F1815',
      raised: '#2A211C',
      overlay: '#2A211C',
      inset: '#100C0A',
    },
    text: {
      primary: '#F2E9E1',
      secondary: '#D9CCC1',
      muted: '#A89A8E',
      inverse: '#1C1917',
      onBrand: '#1C1917',
    },
    border: {
      subtle: '#2A211C',
      default: '#3B302A',
      strong: '#52443B',
      focus: '#FF8A4C',
    },
    brand: {
      // Brightened, unlike the slate original: a burnt orange dark enough to
      // carry white text in light mode disappears into a near-black canvas, so
      // dark mode trades the white label for a dark one and takes the lift.
      default: '#FF8A4C',
      hover: '#FFA06B',
      active: '#FFB88C',
      subtle: '#3A2116',
      onBrand: '#1C1917',
    },
    status: {
      success: { bg: '#12301E', fg: '#86EFAC', border: '#1C5334' },
      warning: { bg: '#33280A', fg: '#FCD34D', border: '#7A5E10' },
      danger: { bg: '#3A1512', fg: '#FCA5A5', border: '#7F2420' },
      info: { bg: '#0E2A3A', fg: '#7DD3FC', border: '#10557C' },
      neutral: { bg: '#2A211C', fg: '#D9CCC1', border: '#3B302A' },
    },
  },
  elevation: {
    flat: { ...lightTheme.elevation.flat, shadowColor: '#000000' },
    raised: { ...lightTheme.elevation.raised, shadowColor: '#000000', shadowOpacity: 0.03 },
    overlay: { ...lightTheme.elevation.overlay, shadowColor: '#000000', shadowOpacity: 0.05 },
    modal: { ...lightTheme.elevation.modal, shadowColor: '#000000', shadowOpacity: 0.08 },
  },
}
