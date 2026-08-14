import { useCallback, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useThemeMode, type ThemeMode } from './ThemeProvider'

/**
 * The blur-circle theme reveal, ported from MinhOmega/react-theme-switch-animation
 * rather than depended on. The package drives an `html.dark` class and its own
 * localStorage copy of the mode; this app's mode lives in ThemeProvider's
 * context, so only the animation half is worth borrowing.
 *
 * The mechanism: `document.startViewTransition` snapshots the old and new
 * frames into `::view-transition-old(root)` / `::view-transition-new(root)`,
 * and an injected stylesheet animates a soft-edged circular *mask* over them,
 * grown from the toggle's centre. It is a mask and not `clip-path` on purpose —
 * WebKit computes clip-path on those pseudo-elements but never applies it, so a
 * clip-path reveal silently degrades to Safari's default cross-fade.
 *
 * Web only, by nature: `startViewTransition` is a DOM API. On native — and in
 * any browser without it, and for anyone who asked for reduced motion — the
 * mode still flips, just without the reveal.
 */

export type ThemeSwitchAnimationOptions = {
  /** Milliseconds the reveal runs for. */
  duration?: number
  /** `stdDeviation` of the mask's gaussian blur, in mask-viewBox units. */
  blurAmount?: number
  /** Easing applied to the mask growth. */
  easing?: string
}

export type ThemeSwitchAnimation = {
  /**
   * Attach to the element the reveal should grow out of. A React Native `View`
   * resolves this to its DOM node on web, which is what gets measured; the ref
   * is simply never read on native.
   *
   * A callback ref rather than a `RefObject` so the type does not have to name
   * a host instance — `View`'s instance type differs between the React Native
   * version this package builds against and the one an app installs, and a
   * `RefObject` of the wrong one will not go onto a `<View>`.
   */
  ref: (node: unknown) => void
  mode: ThemeMode
  toggle: () => void
}

const STYLE_ID = 'theme-switch-style'

/**
 * The package's easing for the transition *group*, kept verbatim: a `linear()`
 * approximation of a quart-out curve, which lands the reveal a good deal
 * earlier than `ease-in-out` would and stops the last third of the sweep from
 * crawling.
 */
const GROUP_EASING =
  'linear(' +
  '0 0%, 0.2342 12.49%, 0.4374 24.99%,' +
  '0.6093 37.49%, 0.6835 43.74%,' +
  '0.7499 49.99%, 0.8086 56.25%,' +
  '0.8593 62.5%, 0.9023 68.75%, 0.9375 75%,' +
  '0.9648 81.25%, 0.9844 87.5%,' +
  '0.9961 93.75%, 1 100%' +
  ')'

/**
 * Retina and 5K displays have far more pixels to composite per frame, so the
 * mask is kept smaller, the blur wider (it is scaled up with the mask, so a
 * fixed radius reads as a harder edge the bigger it gets), and the whole thing
 * is cut short.
 */
const isHighResolution = () => window.innerWidth >= 3000 || window.innerHeight >= 2000

/**
 * A white circle in a `-50 -50 100 100` viewBox, blurred. Sizing the mask
 * through `mask-size` scales this SVG, so the blurred edge stays proportional
 * at every point in the animation instead of sharpening as it grows.
 *
 * `%23` is a literal `#` — the data URL is parsed as a URL before it is parsed
 * as SVG, so an unescaped `#blur` would truncate it into a fragment.
 */
function blurCircleMask(blur: number, radius: number): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100">` +
    `<defs><filter id="blur"><feGaussianBlur stdDeviation="${blur}" /></filter></defs>` +
    `<circle cx="0" cy="0" r="${radius}" fill="white" filter="url(%23blur)"/>` +
    `</svg>`

  return `url('data:image/svg+xml,${svg}')`
}

function centreOf(node: unknown): { x: number; y: number } | null {
  if (typeof (node as Element | null)?.getBoundingClientRect !== 'function') return null

  const { top, left, width, height } = (node as Element).getBoundingClientRect()
  return { x: left + width / 2, y: top + height / 2 }
}

function buildStylesheet(x: number, y: number, options: Required<ThemeSwitchAnimationOptions>) {
  const highRes = isHighResolution()

  // The reveal has to reach whichever viewport corner is furthest from the
  // toggle, or it finishes with a wedge of the old theme still showing.
  const maxRadius = Math.max(
    Math.hypot(x, y),
    Math.hypot(window.innerWidth - x, y),
    Math.hypot(x, window.innerHeight - y),
    Math.hypot(window.innerWidth - x, window.innerHeight - y),
  )

  // Only the middle half of the mask SVG is opaque circle, and its edge is
  // blurred on top of that, so the mask has to overshoot the corner distance
  // by a wide margin for the last pixel to actually clear.
  const viewportSize = Math.max(window.innerWidth, window.innerHeight) + 200
  const headroom = highRes ? Math.min(viewportSize * 2.5, 5000) : viewportSize * 4
  const finalMaskSize = Math.round(Math.max(headroom, maxRadius * 2.5))

  const duration = highRes ? Math.max(options.duration * 0.8, 500) : options.duration
  const mask = blurCircleMask(options.blurAmount * (highRes ? 1.5 : 1.2), highRes ? 20 : 25)

  return `
    /*
      The UA stylesheet cross-fades the two snapshots and composites them with
      mix-blend-mode: plus-lighter, which washes the mask edge out to white.
      Both have to go before the mask reveal reads correctly.
    */
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation: none;
      mix-blend-mode: normal;
      ${highRes ? 'transform: translateZ(0);' : ''}
    }

    ::view-transition-group(root) {
      animation-duration: ${duration}ms;
      animation-timing-function: ${highRes ? 'cubic-bezier(0.2, 0, 0.2, 1)' : GROUP_EASING};
      will-change: transform;
    }

    ::view-transition-new(root) {
      mask: ${mask} 0 0 / 100% 100% no-repeat;
      mask-position: ${x}px ${y}px;
      animation: themeSwitchBlurCircle ${duration}ms ${options.easing};
      animation-fill-mode: both;
      transform-origin: ${x}px ${y}px;
      will-change: mask-size, mask-position;
    }

    /*
      The old frame runs the same animation behind the new one. Left static it
      would sit on top of the growing circle for the whole transition, since
      both snapshots are painted in the same layer.

      Both snapshots need animation-fill-mode: both, and it has to come after
      the shorthand, which resets it to none. Without it the final frame drops
      back to the base mask above — sized to the snapshot rather than grown, and
      offset to the toggle — for the frames between the animation ending and the
      pseudo-elements being torn down. That is a flash of the old theme around
      the edges, right at the end.
    */
    ::view-transition-old(root) {
      animation: themeSwitchBlurCircle ${duration}ms ${options.easing};
      animation-fill-mode: both;
      transform-origin: ${x}px ${y}px;
      z-index: -1;
      will-change: mask-size, mask-position;
    }

    /*
      mask-position is re-centred every frame alongside mask-size: the mask is
      anchored top-left, so growing it alone would sweep the circle down and to
      the right instead of expanding it in place.
    */
    @keyframes themeSwitchBlurCircle {
      0% {
        mask-size: 0px;
        mask-position: ${x}px ${y}px;
      }
      100% {
        mask-size: ${finalMaskSize}px;
        mask-position: ${x - finalMaskSize / 2}px ${y - finalMaskSize / 2}px;
      }
    }
  `
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void>; finished: Promise<void> }
}

export function useThemeSwitchAnimation(
  options: ThemeSwitchAnimationOptions = {},
): ThemeSwitchAnimation {
  const { duration = 750, blurAmount = 2, easing = 'ease-in-out' } = options
  const { mode, setMode } = useThemeMode()
  const anchor = useRef<unknown>(null)
  const ref = useCallback((node: unknown) => {
    anchor.current = node
  }, [])

  const toggle = useCallback(() => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark'
    const doc: ViewTransitionDocument | undefined =
      typeof document === 'undefined' ? undefined : document
    const origin = centreOf(anchor.current)

    if (
      !doc?.startViewTransition ||
      !origin ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      setMode(next)
      return
    }

    // A rapid second toggle interrupts the first, and two stylesheets both
    // defining themeSwitchBlurCircle would leave the later one animating to the
    // earlier one's origin.
    doc.getElementById(STYLE_ID)?.remove()

    const style = doc.createElement('style')
    style.id = STYLE_ID
    style.textContent = buildStylesheet(origin.x, origin.y, { duration, blurAmount, easing })
    doc.head.append(style)

    const transition = doc.startViewTransition(() => {
      // flushSync, because startViewTransition captures the "new" snapshot the
      // moment this callback returns. A deferred React commit means it captures
      // the old theme twice and the reveal animates nothing.
      flushSync(() => setMode(next))
    })

    const cleanup = () => doc.getElementById(STYLE_ID)?.remove()
    // `finished` rejects when a transition is skipped or superseded; the theme
    // is already applied either way, so both paths just drop the stylesheet.
    transition.finished.then(cleanup, cleanup)
  }, [mode, setMode, duration, blurAmount, easing])

  return { ref, mode, toggle }
}
