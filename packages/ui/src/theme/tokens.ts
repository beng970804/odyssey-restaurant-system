import type { Theme } from './types'

/**
 * Warm cream neutrals with a single burnt-orange accent.
 *
 * One palette, one accent: the neutrals are uniformly warm, so nothing cool
 * creeps in later, and orange is the only saturated brand colour on screen.
 * That leaves the status tones as the loudest thing in the interface, which is
 * the point — on an operations board a Pending order should catch the eye
 * before the branding does.
 *
 * The orange is burnt (`#C2410C`) rather than the brighter orange it is drawn
 * from. A saturated `#F97316` carries white label text at 2.9:1, which fails
 * AA outright; darkening the brand until white clears 4.5:1 is what makes the
 * accent usable on a button rather than only on decoration.
 */

/** Warm on cream, black on slate — a shadow is a darker version of its ground. */
export const SHADOW_HUE = { light: '#42302B', dark: '#000000' } as const

/**
 * One shadow, as CSS.
 *
 * React Native's `shadow*` props are deprecated under React Native Web, which
 * warns on every render that carries them, so the tokens are authored in the
 * form both platforms now take. `x` is a parameter because one caller — the nav
 * drawer's sliding surface — casts its shadow sideways rather than down.
 */
export function boxShadow(hex: string, alpha: number, blur: number, y: number, x = 0): string {
  if (alpha === 0) return 'none'
  const [r, g, b] = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16))
  return `${x}px ${y}px ${blur}px rgba(${r}, ${g}, ${b}, ${alpha})`
}

const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48 } as const

/**
 * Softer than the slate original: `lg` carries cards and modals, and 16 is what
 * separates "a rounded rectangle" from a surface that looks deliberately drawn.
 * `sm` stays tight so dense things — table cells, badges — do not go pillowy.
 */
const radius = { none: 0, sm: 4, md: 10, lg: 16, full: 9999 } as const

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
      // Cream canvas, near-white surfaces. Cards lift off the page by being
      // *lighter* than it, which is why the canvas is the tinted one.
      canvas: '#FAF6F0',
      surface: '#FFFDFA',
      // Not pure white. It is the lightest surface in the theme, but a hard
      // #FFFFFF against a cream canvas reads as a hole punched in the page.
      raised: '#FFFEFC',
      overlay: '#FFFDFA',
      inset: '#F2EBE1',
    },
    text: {
      // A warm-grey ramp. Cool slate text on a cream canvas is the single most
      // obvious sign that two palettes were merged.
      primary: '#1C1917',
      secondary: '#57534E',
      muted: '#78716C',
      inverse: '#FAF6F0',
      onBrand: '#FFFFFF',
    },
    border: {
      subtle: '#F2EBE1',
      default: '#E7DED1',
      strong: '#D6C9B8',
      focus: '#C2410C',
    },
    brand: {
      default: '#C2410C',
      hover: '#9A3412',
      active: '#7C2D12',
      // The soft peach behind an active nav item. Brand text on it clears AA at
      // 4.6:1, so the pill is legible rather than merely decorative.
      subtle: '#FDF0E6',
      onBrand: '#FFFFFF',
    },
    status: {
      success: { bg: '#DFF3E4', fg: '#166534', border: '#BBE5C6' },
      // Gold, not amber. The old `#B45309` sat 6 degrees off the brand hue, so
      // once the brand turned orange a Pending badge read as a button.
      warning: { bg: '#FDF3D3', fg: '#854D0E', border: '#F7E3A8' },
      danger: { bg: '#FCE7E4', fg: '#B91C1C', border: '#F6C9C4' },
      // Sky rather than the brand orange: an Info badge that matched the brand
      // would read as a button.
      info: { bg: '#E2EFF6', fg: '#0369A1', border: '#C3DEEC' },
      neutral: { bg: '#F2EBE1', fg: '#57534E', border: '#E7DED1' },
    },
  },
  space,
  radius,
  typography,
  borderWidth,
  layout,
  // Diffuse and barely there, and now warm: a blue-black shadow on cream reads
  // as grime. Depth is shared between these and the border tokens — the borders
  // softened when the palette warmed, so the shadows pick up the difference.
  elevation: {
    flat: { boxShadow: 'none', elevation: 0 },
    raised: { boxShadow: boxShadow(SHADOW_HUE.light, 0.06, 12, 2), elevation: 1 },
    overlay: { boxShadow: boxShadow(SHADOW_HUE.light, 0.1, 24, 8), elevation: 4 },
    modal: { boxShadow: boxShadow(SHADOW_HUE.light, 0.14, 40, 16), elevation: 12 },
  },
}
