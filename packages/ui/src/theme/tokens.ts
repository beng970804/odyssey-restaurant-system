import type { Theme } from './types'

/**
 * Slate neutrals with a single electric-blue accent.
 *
 * One palette, one accent: the neutrals are uniformly cool, so nothing warm
 * creeps in later, and blue is the only saturated brand colour on screen. That
 * leaves the status tones as the loudest thing in the interface, which is the
 * point — on an operations board a Pending order should catch the eye before
 * the branding does.
 */

const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48 } as const

const radius = { none: 0, sm: 4, md: 8, lg: 12, full: 9999 } as const

const borderWidth = { thin: 1, medium: 2, thick: 4 } as const

/**
 * A dashboard is read, not skimmed: 14px body with a tight scale above it keeps
 * an orders table dense enough to be useful on a laptop.
 */
const typography = {
  display: { fontSize: 32, fontWeight: '700', lineHeight: 40, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '600', lineHeight: 32, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '600', lineHeight: 28, letterSpacing: -0.2 },
  h3: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodyStrong: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  mono: { fontSize: 13, fontWeight: '400', lineHeight: 20, fontFamily: 'ui-monospace, monospace' },
} as const satisfies Theme['typography']

const layout = {
  breakpoints: { sm: 640, md: 900, lg: 1280, xl: 1600 },
  sidebarWidth: 240,
  sidebarCollapsedWidth: 72,
  contentMaxWidth: 1280,
  gridColumns: 12,
  gutter: space.lg,
} as const

export const lightTheme: Theme = {
  mode: 'light',
  color: {
    bg: {
      canvas: '#F8FAFC',
      surface: '#FFFFFF',
      raised: '#FFFFFF',
      overlay: '#FFFFFF',
      inset: '#F1F5F9',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#64748B',
      inverse: '#F8FAFC',
      onBrand: '#FFFFFF',
    },
    border: {
      subtle: '#F1F5F9',
      default: '#E2E8F0',
      strong: '#CBD5E1',
      focus: '#2563EB',
    },
    brand: {
      default: '#2563EB',
      hover: '#1D4ED8',
      active: '#1E40AF',
      subtle: '#EFF6FF',
      onBrand: '#FFFFFF',
    },
    status: {
      success: { bg: '#DCFCE7', fg: '#15803D', border: '#BBF7D0' },
      warning: { bg: '#FEF3C7', fg: '#B45309', border: '#FDE68A' },
      danger: { bg: '#FEE2E2', fg: '#B91C1C', border: '#FECACA' },
      // Sky rather than the brand blue: an Info badge that matched the brand
      // would read as a button.
      info: { bg: '#E0F2FE', fg: '#0369A1', border: '#BAE6FD' },
      neutral: { bg: '#F1F5F9', fg: '#475569', border: '#E2E8F0' },
    },
  },
  space,
  radius,
  typography,
  borderWidth,
  layout,
  // Diffuse and barely there. A hard drop shadow is the fastest way to make an
  // interface look cheap, so depth comes mostly from the border tokens.
  elevation: {
    flat: {
      shadowColor: '#0F172A',
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
    raised: {
      shadowColor: '#0F172A',
      shadowOpacity: 0.04,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    overlay: {
      shadowColor: '#0F172A',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    modal: {
      shadowColor: '#0F172A',
      shadowOpacity: 0.12,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
  },
}
