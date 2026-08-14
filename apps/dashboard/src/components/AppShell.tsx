import { useBreakpoint, useScreenInsets, useTheme } from '@repo/ui'
import { type ReactNode, useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { NavToggleProvider } from './NavToggle'
import { ScreenFooterHost, ScreenFooterProvider, createFooterStore } from './ScreenFooter'
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
  // Zero in a browser; the notch and home indicator on a phone. Added to the
  // shell's own padding so no screen thinks about the status bar itself.
  const insets = useScreenInsets()
  const [open, setOpen] = useState(isWide)
  // One store per mounted shell, same as the query client: the slot a screen
  // publishes its footer into (ScreenFooter.tsx has the why).
  const [footerStore] = useState(createFooterStore)

  // Crossing the breakpoint changes whether the drawer costs anything to leave
  // open, so it follows. Resizing within a band leaves the choice alone.
  useEffect(() => setOpen(isWide), [isWide])

  const pad = isCompact ? theme.space.lg : theme.space.xl

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.bg.canvas }}>
      <Sidebar open={open} onOpenChange={setOpen} persistent={isWide} pendingCount={pendingCount}>
        <ScreenFooterProvider value={footerStore}>
          {/* The toggle is published rather than rendered here, so it sits on
              the screen's own header row instead of stacked above it. */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: pad,
              paddingTop: pad + insets.top,
              paddingBottom: pad + insets.bottom,
              maxWidth: theme.layout.contentMaxWidth,
              width: '100%',
              alignSelf: 'center',
            }}
          >
            <NavToggleProvider open={open} onOpenChange={setOpen}>
              {children}
            </NavToggleProvider>
          </ScrollView>
          {/* Below the scroller, so what a screen docks here stays on the
              device's edge while the menu scrolls behind it. */}
          <ScreenFooterHost
            style={{
              paddingHorizontal: pad,
              paddingTop: theme.space.sm,
              paddingBottom: theme.space.md + insets.bottom,
              maxWidth: theme.layout.contentMaxWidth,
              width: '100%',
              alignSelf: 'center',
            }}
          />
        </ScreenFooterProvider>
      </Sidebar>
    </View>
  )
}
