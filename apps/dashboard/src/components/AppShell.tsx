import { IconButton, Inline, Text, useBreakpoint, useTheme } from '@repo/ui'
import { type ReactNode, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Sidebar } from './Sidebar'

/**
 * Navigation plus scrolling content. The drawer behaves the same at every
 * width — swipe the surface sideways or use the toggle — so there is one
 * interface to learn rather than one per breakpoint. useBreakpoint is left
 * deciding only how much padding the content gets.
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.bg.canvas }}>
      <Sidebar open={open} onOpenChange={setOpen} pendingCount={pendingCount}>
        <Inline style={{ paddingHorizontal: theme.space.lg, paddingTop: theme.space.lg }}>
          <IconButton
            testID="nav-drawer-toggle"
            label={open ? 'Close navigation' : 'Open navigation'}
            onPress={() => setOpen(!open)}
          >
            {/* A bare string here is a text node inside a View, which React
                Native rejects — every glyph has to be wrapped. */}
            <Text>☰</Text>
          </IconButton>
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
