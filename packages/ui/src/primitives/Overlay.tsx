import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Modal as NativeModalHost, Platform, Pressable, View, type ViewStyle } from 'react-native'
import { createPortal } from 'react-dom'
import { prefersReducedMotion } from '../hooks/motion'
import { useScreenInsets } from '../hooks/useScreenInsets'
import { useTheme } from '../theme/ThemeProvider'

/**
 * Positions and transitions react-native-web understands and React Native's own
 * style types do not, asserted here rather than inline at each use.
 */
const VIEWPORT_FIXED = 'fixed' as ViewStyle['position']

/**
 * Out is quicker than in: a dismissal should feel like it obeyed at once.
 *
 * These are the defaults, for a dialog that barely moves. A panel with real
 * distance to cover overrides them — the same milliseconds that read as calm
 * across twelve pixels read as a flick across four hundred and eighty.
 */
export const OVERLAY_ENTER_MS = 220
export const OVERLAY_EXIT_MS = 150

/** Decelerating, so the panel arrives rather than stops. */
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * Only the transition properties, not the whole of `ViewStyle` — consumers in
 * other packages type against their own copy of react-native, and two copies'
 * `ViewStyle`s are not assignable to each other (see `FocusRing`). On native
 * the properties are unknown and ignored: the styles land settled.
 */
export type OverlayTransition = {
  /**
   * Never set here. `ViewStyle` is all-optional, and TypeScript's weak-type
   * rule rejects a type that overlaps it in nothing — this one property is the
   * overlap that lets the transition sit in any style array.
   */
  opacity?: number
  transitionProperty: string
  transitionDuration: string
  transitionTimingFunction: string
}

/**
 * The motion is a CSS transition rather than a Reanimated worklet, which is a
 * deliberate departure from the nav drawer beside it.
 *
 * Reanimated advances on the frame clock and paints from its own loop, so
 * anywhere that loop does not run — a tab that has never been foregrounded, a
 * headless browser — every animated style freezes at the value it started
 * from. For a gesture-driven drawer that means no animation. For a dialog whose
 * entrance begins at `opacity: 0` it means an invisible dialog, which is a
 * broken screen rather than a still one. A CSS transition is declarative: the
 * browser owns it, and where it is unsupported the element simply lands on its
 * final style.
 */
export const overlayTransition = (property: string, ms: number): OverlayTransition => ({
  transitionProperty: property,
  transitionDuration: `${ms}ms`,
  transitionTimingFunction: EASING,
})

export type OverlayMotion = {
  /** False while closed and for the first frame of opening, true once at rest. */
  shown: boolean
  enterMs: number
  exitMs: number
}

/**
 * Published so the panel inside moves with the backdrop rather than running a
 * second clock beside it: same state, same durations, one arrival.
 */
const OverlayMotionContext = createContext<OverlayMotion>({
  shown: false,
  enterMs: OVERLAY_ENTER_MS,
  exitMs: OVERLAY_EXIT_MS,
})

export const useOverlayMotion = () => useContext(OverlayMotionContext)

export type OverlayProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  align?: 'center' | 'right'
  /** How long the whole overlay takes, panel included. */
  enterMs?: number
  exitMs?: number
}

/**
 * The shared half of Modal and Drawer: a backdrop that closes on click, and
 * Escape-to-close wired once. Both behaviours are easy to forget per component
 * and jarring to miss.
 *
 * On the web it renders through a portal to the document body. An overlay must
 * cover the viewport wherever it is *written*, and an absolutely positioned one
 * only covers its nearest positioned ancestor — a modal opened from inside a
 * card was laid out inside that card, clipped and half off it. `position:
 * fixed` alone would not do it either: the nav drawer's surface carries a
 * transform, and any transform makes an ancestor the containing block for the
 * fixed descendants inside it. The portal escapes both.
 *
 * It also owns its own unmounting, because a component removed the instant it
 * closes has no chance to animate out.
 */
export function Overlay({
  open,
  onClose,
  children,
  align = 'center',
  enterMs = OVERLAY_ENTER_MS,
  exitMs = OVERLAY_EXIT_MS,
}: OverlayProps) {
  const theme = useTheme()
  const insets = useScreenInsets()
  // Mounted covers the exit as well as the visit: it trails `open` by the
  // length of the closing animation.
  const [mounted, setMounted] = useState(open)
  // Always starts false, even when this mounts already open, so the closed
  // styles paint once and the transition has somewhere to run from.
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const frame = setTimeout(() => setShown(true), 0)
      return () => clearTimeout(frame)
    }

    setShown(false)
    const exit = setTimeout(() => setMounted(false), prefersReducedMotion() ? 0 : exitMs)
    return () => clearTimeout(exit)
  }, [open, exitMs])

  useEffect(() => {
    if (!open || typeof document === 'undefined') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!mounted) return null

  const overlay = (
    <View
      style={[
        {
          // On native the host below owns the screen, and absolute-fill fills
          // it; on the web this is viewport-fixed inside the body portal.
          position: Platform.OS === 'web' ? VIEWPORT_FIXED : 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          flexDirection: 'row',
          alignItems: align === 'center' ? 'center' : 'stretch',
          justifyContent: align === 'center' ? 'center' : 'flex-end',
          // A centred panel must not reach under the notch or the home
          // indicator; zero everywhere else. The right-aligned drawer spans
          // full height on purpose and pads its own content instead.
          paddingTop: align === 'center' ? insets.top : 0,
          paddingBottom: align === 'center' ? insets.bottom : 0,
          opacity: shown ? 1 : 0,
        },
        overlayTransition('opacity', shown ? enterMs : exitMs),
      ]}
    >
      <Pressable
        aria-label="Close"
        onPress={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(15,23,42,0.35)',
        }}
      />
      <OverlayMotionContext.Provider value={{ shown, enterMs, exitMs }}>
        {children}
      </OverlayMotionContext.Provider>
    </View>
  )

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return createPortal(overlay, document.body)
  }

  // The native equivalent of the portal. Rendered in place, an "overlay" only
  // covers its nearest ancestor — the pending-orders dialog painted *inside*
  // the card that opened it, clipped and scrolling with the page. React
  // Native's Modal hoists its children to the window the way the body portal
  // does on the web; the fade stays ours, so `animationType` is none.
  return (
    <NativeModalHost
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {overlay}
    </NativeModalHost>
  )
}
