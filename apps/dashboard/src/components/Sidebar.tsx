import { SideNav, Text, useTheme, useThemeMode, Button, Stack } from '@repo/ui'
import { usePathname, useRouter } from 'expo-router'

/**
 * A thin adapter over the design system's SideNav: it supplies the route list
 * and the active path, and nothing else. All the styling lives in @repo/ui.
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
  collapsed,
  pendingCount,
}: {
  collapsed: boolean
  pendingCount?: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const { mode, setMode } = useThemeMode()

  const items = ROUTES.map((route) =>
    route.href === '/orders' ? { ...route, badge: pendingCount } : route,
  )

  return (
    <SideNav
      items={items}
      activeHref={pathname}
      collapsed={collapsed}
      onNavigate={(href) => router.push(href as '/')}
      header={
        <Stack
          gap="xs"
          style={{ paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm }}
        >
          <Text variant="bodyStrong">{collapsed ? 'RO' : 'Restaurant Ops'}</Text>
          {collapsed ? null : (
            <Text variant="caption" color="muted">
              Operations dashboard
            </Text>
          )}
        </Stack>
      }
      footer={
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
        >
          {collapsed ? (mode === 'dark' ? '☀' : '☾') : mode === 'dark' ? 'Light mode' : 'Dark mode'}
        </Button>
      }
    />
  )
}
