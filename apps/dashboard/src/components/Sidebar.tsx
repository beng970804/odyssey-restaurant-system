import { NavDrawer, Text, useTheme, useThemeMode, Button, Stack } from '@repo/ui'
import { usePathname, useRouter } from 'expo-router'
import type { ReactNode } from 'react'

/**
 * A thin adapter over the design system's NavDrawer: it supplies the route
 * list and the active path, and nothing else. All the styling and the motion
 * live in @repo/ui.
 */
const ROUTES = [
  { href: '/', label: 'Home' },
  { href: '/orders', label: 'Orders' },
  { href: '/menu', label: 'Menu' },
  { href: '/crm', label: 'Customers' },
  { href: '/settings', label: 'Settings' },
  { href: '/ui-library', label: 'UI Library' },
]

export function Sidebar({
  open,
  onOpenChange,
  pendingCount,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingCount?: number
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const { mode, setMode } = useThemeMode()

  const items = ROUTES.map((route) =>
    route.href === '/orders' ? { ...route, badge: pendingCount } : route,
  )

  return (
    <NavDrawer
      items={items}
      activeHref={pathname}
      open={open}
      onOpenChange={onOpenChange}
      onNavigate={(href) => router.push(href as '/')}
      header={
        <Stack
          gap="xs"
          style={{ paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm }}
        >
          <Text variant="bodyStrong">Restaurant Ops</Text>
          <Text variant="caption" color="muted">
            Operations dashboard
          </Text>
        </Stack>
      }
      footer={
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
        >
          {mode === 'dark' ? 'Light mode' : 'Dark mode'}
        </Button>
      }
    >
      {children}
    </NavDrawer>
  )
}
