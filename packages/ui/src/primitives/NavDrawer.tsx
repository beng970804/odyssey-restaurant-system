import { type ReactNode, useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useTheme } from '../theme/ThemeProvider'
import { SideNav, type SideNavItem } from './SideNav'

export type NavDrawerMode = 'drawer' | 'pinned'

export type NavDrawerProps = {
  items: SideNavItem[]
  activeHref: string
  onNavigate: (href: string) => void
  /** `pinned` keeps the nav in the row; `drawer` hides it under the content. */
  mode: NavDrawerMode
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Icons-only nav. Only meaningful when pinned. */
  collapsed?: boolean
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

/**
 * Interaction constants rather than layout tokens: they describe how much
 * finger travel counts as a swipe, not how big anything is on screen.
 */
const HORIZONTAL_ACTIVATION = 15
const VERTICAL_BAILOUT = 15
/** A flick this fast decides the direction regardless of how far it travelled. */
const FLICK_VELOCITY = 500
const SPRING = { damping: 20, stiffness: 200 } as const

/**
 * The nav sits mounted underneath a single moving surface: opening slides the
 * content to the right rather than covering it, and the surface keeps its
 * corner radius the whole way across instead of animating it. The app's
 * Sidebar stays a thin adapter — this is where the motion lives.
 */
export function NavDrawer({
  items,
  activeHref,
  onNavigate,
  mode,
  open,
  onOpenChange,
  collapsed = false,
  header,
  footer,
  children,
}: NavDrawerProps) {
  const theme = useTheme()
  const isDrawer = mode === 'drawer'
  const openWidth = theme.layout.sidebarWidth

  const translateX = useSharedValue(0)

  useEffect(() => {
    translateX.value = withSpring(isDrawer && open ? openWidth : 0, SPRING)
  }, [isDrawer, open, openWidth, translateX])

  const pan = Gesture.Pan()
    .enabled(isDrawer)
    // Let a vertical scroll through untouched; only claim clear sideways drags.
    .activeOffsetX([-HORIZONTAL_ACTIVATION, HORIZONTAL_ACTIVATION])
    .failOffsetY([-VERTICAL_BAILOUT, VERTICAL_BAILOUT])
    .onUpdate((event) => {
      const from = open ? openWidth : 0
      translateX.value = Math.min(openWidth, Math.max(0, from + event.translationX))
    })
    .onEnd((event) => {
      const shouldOpen =
        event.velocityX > FLICK_VELOCITY ||
        (event.velocityX > -FLICK_VELOCITY && translateX.value > openWidth / 2)

      translateX.value = withSpring(shouldOpen ? openWidth : 0, SPRING)
      if (shouldOpen !== open) runOnJS(onOpenChange)(shouldOpen)
    })

  const surfaceStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const nav = (
    <SideNav
      items={items}
      activeHref={activeHref}
      onNavigate={(href) => {
        onNavigate(href)
        // A drawer that stays open hides the screen it just navigated to.
        if (isDrawer) onOpenChange(false)
      }}
      collapsed={isDrawer ? false : collapsed}
      header={header}
      footer={footer}
    />
  )

  if (!isDrawer) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View testID="nav-drawer-menu">{nav}</View>
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: theme.color.bg.surface }}>
      <View
        testID="nav-drawer-menu"
        // Offscreen is not the same as unreachable: without this the whole nav
        // sits ahead of the visible content in tab order.
        aria-hidden={open ? undefined : true}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: openWidth }}
      >
        {nav}
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            {
              flex: 1,
              backgroundColor: theme.color.bg.canvas,
              borderRadius: theme.radius.lg,
              overflow: 'hidden',
            },
            surfaceStyle,
          ]}
        >
          {children}
          {open ? (
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
