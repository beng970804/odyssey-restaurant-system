import { useBreakpoint, useTheme } from '@repo/ui'
import { type ReactNode, useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { NavToggleProvider } from './NavToggle'
import { Sidebar } from './Sidebar'

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
