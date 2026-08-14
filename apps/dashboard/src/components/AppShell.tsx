import { useBreakpoint, useTheme } from '@repo/ui'
import { useContext, type ReactNode, useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import { NavToggleProvider } from './NavToggle'
import { Sidebar } from './Sidebar'

/** A browser gives the page the whole viewport; only a phone withholds edges. */
const NO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 }

/**
 * Navigation plus scrolling content. The drawer and its gesture are the same at
 * every width; what changes past the lg breakpoint is that there is room to
 * keep it open. There it sits beside the content and stays put — navigating
 * and clicking the dashboard leave it alone, and only the toggle or a
 * deliberate swipe closes it.
 */
export function AppShell({
  children,
  pendingCount,
}: {
  children: ReactNode
  pendingCount?: number
}) {
  const theme = useTheme()
  const { isCompact, isWide } = useBreakpoint()
  // Zero in a browser; the notch and home indicator on a phone. Added to the
  // shell's own padding so no screen thinks about the status bar itself. Read
  // through the context with a fallback rather than the hook, which throws
  // where no provider is mounted — the app gets one from expo-router, a test
  // rendering the shell alone does not, and both should mean "no insets".
  const insets = useContext(SafeAreaInsetsContext) ?? NO_INSETS
  const [open, setOpen] = useState(isWide)

  // Crossing the breakpoint changes whether the drawer costs anything to leave
  // open, so it follows. Resizing within a band leaves the choice alone.
  useEffect(() => setOpen(isWide), [isWide])

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.bg.canvas }}>
      <Sidebar open={open} onOpenChange={setOpen} persistent={isWide} pendingCount={pendingCount}>
        {/* The toggle is published rather than rendered here, so it sits on the
            screen's own header row instead of stacked above it. */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: isCompact ? theme.space.lg : theme.space.xl,
            paddingTop: (isCompact ? theme.space.lg : theme.space.xl) + insets.top,
            paddingBottom: (isCompact ? theme.space.lg : theme.space.xl) + insets.bottom,
            maxWidth: theme.layout.contentMaxWidth,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <NavToggleProvider open={open} onOpenChange={setOpen}>
            {children}
          </NavToggleProvider>
        </ScrollView>
      </Sidebar>
    </View>
  )
}
