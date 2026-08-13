import { useBreakpoint, useTheme } from '@repo/ui'
import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { Sidebar } from './Sidebar'

/**
 * Sidebar plus scrolling content. Every dimension comes from the layout tokens
 * and the collapse decision from useBreakpoint — no raw pixel comparison here.
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

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.color.bg.canvas }}>
      <Sidebar collapsed={isCompact} pendingCount={pendingCount} />
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
    </View>
  )
}
