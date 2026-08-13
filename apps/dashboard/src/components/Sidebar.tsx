import { NavDrawer, type NavItemIcon, Text, useTheme, useThemeMode, Button, Stack } from '@repo/ui'
import IconLayoutDashboard from '@tabler/icons-react-native/IconLayoutDashboard'
import IconPalette from '@tabler/icons-react-native/IconPalette'
import IconReceipt2 from '@tabler/icons-react-native/IconReceipt2'
import IconSettings from '@tabler/icons-react-native/IconSettings'
import IconToolsKitchen2 from '@tabler/icons-react-native/IconToolsKitchen2'
import IconUsers from '@tabler/icons-react-native/IconUsers'
import { usePathname, useRouter } from 'expo-router'
import type { ReactNode } from 'react'

/**
 * A thin adapter over the design system's NavDrawer: it supplies the route
 * list and the active path, and nothing else. All the styling and the motion
 * live in @repo/ui.
 *
 * The icons are functions rather than elements so NavItem can colour them for
 * the state they land in — the icon set is this app's choice, its colour is
 * not.
 */
const ROUTES: { href: string; label: string; icon: NavItemIcon }[] = [
  { href: '/', label: 'Home', icon: (props) => <IconLayoutDashboard {...props} /> },
  { href: '/orders', label: 'Orders', icon: (props) => <IconReceipt2 {...props} /> },
  { href: '/menu', label: 'Menu', icon: (props) => <IconToolsKitchen2 {...props} /> },
  { href: '/crm', label: 'Customers', icon: (props) => <IconUsers {...props} /> },
  { href: '/settings', label: 'Settings', icon: (props) => <IconSettings {...props} /> },
  { href: '/ui-library', label: 'UI Library', icon: (props) => <IconPalette {...props} /> },
]

export function Sidebar({
  open,
  onOpenChange,
  persistent,
  pendingCount,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  persistent: boolean
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
      persistent={persistent}
      onNavigate={(href) => router.push(href as '/')}
      header={
        <Stack
          gap="xs"
          style={{ paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm }}
        >
          {/*
            A wordmark, not a label: set in the brand colour, tracked out and
            upper-cased so the top of the sidebar reads as an identity rather
            than as the first nav item.
          */}
          <Text variant="h2" color="brand" style={{ letterSpacing: 1.5, fontWeight: '700' }}>
            RESTAURANT OPS
          </Text>
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
