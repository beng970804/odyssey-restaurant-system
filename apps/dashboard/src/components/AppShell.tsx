import { IconButton, Inline, Text, useBreakpoint, useTheme } from '@repo/ui'
import { type ReactNode, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Sidebar } from './Sidebar'

/**
 * Navigation plus scrolling content. Every dimension comes from the layout
 * tokens and the drawer/pinned decision from useBreakpoint — no raw pixel
 * comparison here.
 *
 * Narrow viewports get the swipe-out drawer; wide ones keep the nav in the row
 * with a toggle to collapse it to icons, since a dashboard the user is reading
 * all shift should not hide its navigation by default.
 */
export function AppShell({
  children,
  pendingCount,
}: {
  children: ReactNode
  pendingCount?: number
}) {
  const theme = useTheme()
  const { isCompact } = useBreakpoint()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.bg.canvas }}>
      <Sidebar
        mode={isCompact ? 'drawer' : 'pinned'}
        open={open}
        onOpenChange={setOpen}
        collapsed={collapsed}
        pendingCount={pendingCount}
      >
        <Inline style={{ paddingHorizontal: theme.space.lg, paddingTop: theme.space.lg }}>
          {isCompact ? (
            <IconButton
              testID="nav-drawer-toggle"
              label={open ? 'Close navigation' : 'Open navigation'}
              onPress={() => setOpen(!open)}
            >
              {/* A bare string here is a text node inside a View, which React
                  Native rejects — every glyph has to be wrapped. */}
              <Text>☰</Text>
            </IconButton>
          ) : (
            <IconButton
              testID="sidebar-pin-toggle"
              label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              onPress={() => setCollapsed(!collapsed)}
            >
              <Text>{collapsed ? '»' : '«'}</Text>
            </IconButton>
          )}
        </Inline>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: isCompact ? theme.space.lg : theme.space.xl,
            maxWidth: theme.layout.contentMaxWidth,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          {children}
        </ScrollView>
      </Sidebar>
    </View>
  )
}
