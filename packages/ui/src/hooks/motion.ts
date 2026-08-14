/**
 * What the environment will and will not animate.
 *
 * Both are runtime questions rather than build-time ones, and both are asked by
 * components that have nothing else in common — a count-up, an overlay, a chart
 * — so they live here rather than inside whichever one happened to need them
 * first.
 */

/**
 * Motion is a preference, not a given. Read at each call rather than once, so a
 * mid-session change to the system setting is honoured.
 */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)

/**
 * Whether a frame has ever arrived.
 *
 * Anything that animates by interpolating over frames — Reanimated, a chart's
 * spring, a hand-rolled `requestAnimationFrame` loop — advances only where that
 * clock runs, and in a tab that has never been foregrounded or a headless
 * browser it does not. A component that begins its entrance from nothing needs
 * to know that before it hides itself to animate in.
 *
 * The probe is fired once, at import. Callers get `false` until the first frame
 * lands, which is the safe answer: paint the settled state.
 */
let seenFrame = false

if (typeof requestAnimationFrame === 'function') {
  requestAnimationFrame(() => {
    seenFrame = true
  })
}

export const frameClockRuns = () => seenFrame
