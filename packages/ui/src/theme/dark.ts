import { lightTheme } from './tokens'
import type { Theme } from './types'

/**
 * Not an inversion of light. Three rules separate the two:
 *
 * 1. Surfaces raise by *lightening* — canvas is the darkest thing on screen and
 *    each layer above it is a step lighter, which is how depth reads without
 *    shadows.
 * 2. Shadows soften, because a dark shadow on a dark surface is invisible; the
 *    border tokens carry the separation instead.
 * 3. Status tones desaturate — the light-mode pastels would glare — while the
 *    brand keeps its hue, so it stays recognisable in both modes.
 *
 * Everything dimensional (space, radius, typography, layout) is shared: a theme
 * swap changes colour and depth, never the grid.
 */
export const darkTheme: Theme = {
  ...lightTheme,
  mode: 'dark',
  color: {
    bg: {
      canvas: '#020617',
      surface: '#0F172A',
      raised: '#1E293B',
      overlay: '#1E293B',
      inset: '#010409',
    },
    text: {
      primary: '#E2E8F0',
      secondary: '#CBD5E1',
      muted: '#94A3B8',
      inverse: '#0F172A',
      onBrand: '#FFFFFF',
    },
    border: {
      subtle: '#1E293B',
      default: '#334155',
      strong: '#475569',
      focus: '#60A5FA',
    },
    brand: {
      // The same hue as light. Against a near-black canvas it already pops, so
      // brightening it would only cost contrast against white label text.
      default: '#2563EB',
      hover: '#3B82F6',
      active: '#60A5FA',
      subtle: '#172554',
      onBrand: '#FFFFFF',
    },
    status: {
      success: { bg: '#14301F', fg: '#86EFAC', border: '#166534' },
      warning: { bg: '#37260A', fg: '#FCD34D', border: '#92400E' },
      danger: { bg: '#3B1113', fg: '#FCA5A5', border: '#991B1B' },
      info: { bg: '#0C2A3D', fg: '#7DD3FC', border: '#075985' },
      neutral: { bg: '#1E293B', fg: '#CBD5E1', border: '#334155' },
    },
  },
  elevation: {
    flat: { ...lightTheme.elevation.flat, shadowColor: '#000000' },
    raised: { ...lightTheme.elevation.raised, shadowColor: '#000000', shadowOpacity: 0.03 },
    overlay: { ...lightTheme.elevation.overlay, shadowColor: '#000000', shadowOpacity: 0.05 },
    modal: { ...lightTheme.elevation.modal, shadowColor: '#000000', shadowOpacity: 0.08 },
  },
}
