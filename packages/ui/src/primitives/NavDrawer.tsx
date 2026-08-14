import { type ReactNode, useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useTheme } from '../theme/ThemeProvider'
import { SideNav, type SideNavItem } from './SideNav'

export type NavDrawerProps = {
  items: SideNavItem[]
  activeHref: string
  onNavigate: (href: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Keep the menu alongside the content rather than over it: the surface
   * shrinks instead of sliding, nothing dismisses the menu automatically, and
   * only a deliberate toggle or swipe closes it.
   */
  persistent?: boolean
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

/**
 * Gesture and motion constants rather than layout tokens: they describe how
 * much finger travel counts as a swipe and how the surface settles, not how big
 * anything is on screen.
 */
const GESTURE = {
  /** Sideways travel that claims the gesture from a vertical scroll. */
  activationDistance: 8,
  verticalTolerance: 18,
  /** Below this much travel and speed, position alone decides. */
  directionDistanceThreshold: 12,
  velocityThreshold: 160,
  /** Velocity counts as this many milliseconds of extra travel. */
  velocityInfluence: 0.05,
  /** Released past this fraction of the width with no clear intent: open. */
  openPositionThreshold: 0.18,
} as const

const SPRING = { damping: 26, mass: 0.8, stiffness: 220, overshootClamping: true } as const

/**
 * The menu emerges rather than sitting fully painted behind the surface: it
 * fades in over the first half of the travel while rising and scaling up. This
 * is most of what gives the slide its depth — without it the surface just
 * uncovers a static panel.
 */
const REVEAL = {
  fadeStartProgress: 0.08,
  fadeEndProgress: 0.5,
  startScale: 0.975,
  startVerticalOffset: 8,
} as const

/** Cast leftward, so the surface reads as lifted above the menu it uncovers. */
const SURFACE_SHADOW = {
  shadowOpacity: 0.14,
  shadowRadius: 40,
  shadowOffset: { width: -8, height: 0 },
} as const

/**
 * The nav sits mounted underneath a single moving surface: opening slides the
 * content to the right rather than covering it. The app's Sidebar stays a thin
 * adapter — this is where the motion lives.
 *
 * The gesture is the same at every width. What changes with `persistent` is
 * only what the open state costs: over the content and dismissed on the next
 * tap, or beside it and left alone until you say otherwise.
 */
export function NavDrawer({
  items,
  activeHref,
  onNavigate,
  open,
  onOpenChange,
  persistent = false,
  header,
  footer,
  children,
}: NavDrawerProps) {
  const theme = useTheme()
  const openWidth = theme.layout.sidebarWidth

  // Initialised from the current props so the first paint is already settled;
  // the effect below only animates later changes.
  const translateX = useSharedValue(open ? openWidth : 0)
  /**
   * Where the surface was when the finger landed, so a mid-flight grab picks
   * the animation up instead of snapping to one end of it.
   */
  const gestureStartX = useSharedValue(0)

  useEffect(() => {
    translateX.value = withSpring(open ? openWidth : 0, SPRING)
  }, [open, openWidth, translateX])

  const pan = Gesture.Pan()
    // Let a vertical scroll through untouched; only claim clear sideways drags.
    .activeOffsetX([-GESTURE.activationDistance, GESTURE.activationDistance])
    .failOffsetY([-GESTURE.verticalTolerance, GESTURE.verticalTolerance])
    .onBegin(() => {
      gestureStartX.value = translateX.value
    })
    .onUpdate((event) => {
      translateX.value = Math.min(openWidth, Math.max(0, gestureStartX.value + event.translationX))
    })
    .onEnd((event) => {
      // A deliberate flick decides by direction; a hesitant drag by where it
      // was let go. Projecting velocity forward is what makes a short fast
      // swipe open the menu rather than snapping it back.
      const decisive =
        Math.abs(event.translationX) > GESTURE.directionDistanceThreshold ||
        Math.abs(event.velocityX) > GESTURE.velocityThreshold

      const shouldOpen = decisive
        ? event.translationX + event.velocityX * GESTURE.velocityInfluence > 0
        : translateX.value > openWidth * GESTURE.openPositionThreshold

      translateX.value = withSpring(shouldOpen ? openWidth : 0, SPRING)
      runOnJS(onOpenChange)(shouldOpen)
    })

  const surfaceStyle = useAnimatedStyle(() => ({
    // Both read the same shared value, so the gesture drives either one — and
    // both are always written, with the unused one pinned at zero.
    //
    // Returning only the active property would leave the other applied at its
    // last value: Reanimated writes what the style function returns and never
    // clears what it stops returning. Crossing the wide breakpoint downward
    // would strand marginLeft at 240px, leaving an empty gutter beside content
    // that is no longer being pushed.
    marginLeft: persistent ? translateX.value : 0,
    transform: [{ translateX: persistent ? 0 : translateX.value }],
  }))

  const revealStyle = useAnimatedStyle(() => {
    const progress = translateX.value / openWidth

    return {
      opacity: interpolate(
        progress,
        [0, REVEAL.fadeStartProgress, REVEAL.fadeEndProgress],
        [0, 0, 1],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            progress,
            [0, 1],
            [REVEAL.startVerticalOffset, 0],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(progress, [0, 1], [REVEAL.startScale, 1], Extrapolation.CLAMP),
        },
      ],
    }
  })

  return (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: theme.color.bg.surface }}>
      <View
        testID="nav-drawer-menu"
        // Offscreen is not the same as unreachable: without this the whole nav
        // sits ahead of the visible content in tab order.
        aria-hidden={open ? undefined : true}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: openWidth }}
      >
        <Animated.View testID="nav-drawer-reveal" style={[{ flex: 1 }, revealStyle]}>
          <SideNav
            items={items}
            activeHref={activeHref}
            onNavigate={(href) => {
              onNavigate(href)
              // A drawer sitting over the content hides the screen it just
              // navigated to; one sitting beside it does not.
              if (!persistent) onOpenChange(false)
            }}
            header={header}
            footer={footer}
            // The wrapper owns the width, so SideNav must not also set one.
            width="100%"
          />
        </Animated.View>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View
          testID="nav-drawer-surface"
          style={[
            {
              flex: 1,
              backgroundColor: theme.color.bg.canvas,
              shadowColor: theme.elevation.modal.shadowColor,
              ...SURFACE_SHADOW,
            },
            surfaceStyle,
          ]}
        >
          {children}
          {open && !persistent ? (
            <Pressable
              testID="nav-drawer-scrim"
              aria-label="Close navigation"
              onPress={() => onOpenChange(false)}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </Animated.View>
      </GestureDetector>
    </View>
  )
}
