import {
  Avatar,
  type ButtonIcon,
  Divider,
  Inline,
  NavDrawer,
  type NavItemIcon,
  SearchInput,
  Text,
  type ThemeMode,
  useTheme,
  useThemeSwitchAnimation,
  Button,
  IconButton,
  Stack,
} from '@repo/ui'
import IconLayoutDashboard from '@tabler/icons-react-native/IconLayoutDashboard'
import IconMoon from '@tabler/icons-react-native/IconMoon'
import IconPalette from '@tabler/icons-react-native/IconPalette'
import IconReceipt2 from '@tabler/icons-react-native/IconReceipt2'
import IconSettings from '@tabler/icons-react-native/IconSettings'
import IconSun from '@tabler/icons-react-native/IconSun'
import IconToolsKitchen2 from '@tabler/icons-react-native/IconToolsKitchen2'
import IconUsers from '@tabler/icons-react-native/IconUsers'
import { usePathname, useRouter } from 'expo-router'
import { type ReactNode, useState } from 'react'
import { View } from 'react-native'
import { ACCOUNT } from '../account'
import { useGuardedNavigation } from './NavigationGuard'

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
  { href: '/ui-library', label: 'UI Library', icon: (props) => <IconPalette {...props} /> },
]

/**
 * Reachable from the footer rather than the list, because it is a place you
 * visit occasionally and not part of the daily round. It stays searchable all
 * the same — a destination you cannot type the name of is a destination you
 * have to remember the location of.
 */
const SETTINGS = {
  href: '/settings',
  label: 'Settings',
  icon: (props: { color: string; size: number }) => <IconSettings {...props} />,
} satisfies { href: string; label: string; icon: NavItemIcon }

const SEARCHABLE = [...ROUTES, SETTINGS]

/**
 * Keyed by the mode you are *in*, but drawing the mode you are switching *to* —
 * the same thing the label says. A sun beside "Light mode" reads as one
 * statement; a moon beside it reads as two contradictory ones.
 *
 * Module scope because an icon defined during render is a fresh component on
 * every frame, which is both a remount and a lint error.
 */
const THEME_ICON = {
  light: (props: { color: string; size: number }) => <IconMoon {...props} />,
  dark: (props: { color: string; size: number }) => <IconSun {...props} />,
} satisfies Record<ThemeMode, ButtonIcon>

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
  // The ref goes on the wrapper rather than the Button because the reveal
  // needs a measurable box, and Button owns its own Pressable.
  const { mode, toggle, ref: themeToggleRef } = useThemeSwitchAnimation()
  const [query, setQuery] = useState('')

  const trimmed = query.trim().toLowerCase()
  // An empty box means "show me everything", so the search only ever subtracts.
  const matches = trimmed
    ? SEARCHABLE.filter((route) => route.label.toLowerCase().includes(trimmed))
    : ROUTES

  const items = matches.map((route) =>
    route.href === '/orders' ? { ...route, badge: pendingCount } : route,
  )

  const guarded = useGuardedNavigation()

  // Typing then pressing Enter is the whole point of the box, so leaving the
  // query behind would filter the list you have just navigated into. Guarded,
  // so a screen holding unsaved work can ask before it is left.
  const go = (href: string) => {
    guarded(() => {
      setQuery('')
      router.push(href as '/')
    })
  }

  return (
    <NavDrawer
      items={items}
      activeHref={pathname}
      open={open}
      onOpenChange={onOpenChange}
      persistent={persistent}
      onNavigate={go}
      header={
        /*
          No horizontal padding out here: the search box spans the same box as
          a nav row, which pads its own contents. Insetting the whole header
          would leave the field visibly narrower than the items below it.
        */
        <Stack gap="sm" style={{ paddingVertical: theme.space.sm }}>
          <Stack gap="xs" style={{ paddingHorizontal: theme.space.md }}>
            {/*
              A wordmark, not a label: set in the brand colour, tracked out and
              upper-cased so the top of the sidebar reads as an identity rather
              than as the first nav item.
            */}
            <Text variant="h2" color="brand" style={{ letterSpacing: 1.5, fontWeight: '700' }}>
              LE DÉLICIEUX
            </Text>
            <Text variant="caption" color="muted">
              Operations dashboard
            </Text>
          </Stack>
          <SearchInput
            testID="nav-search"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => {
              const first = matches[0]
              if (first) go(first.href)
            }}
            placeholder="Search pages"
            ariaLabel="Search pages"
          />
          {trimmed && matches.length === 0 ? (
            <Text variant="caption" color="muted" style={{ paddingHorizontal: theme.space.md }}>
              No pages match
            </Text>
          ) : null}
        </Stack>
      }
      footer={
        <Stack gap="sm">
          <Inline justify="space-between">
            <View ref={themeToggleRef}>
              <Button variant="ghost" size="sm" onPress={toggle} icon={THEME_ICON[mode]}>
                {mode === 'dark' ? 'Light mode' : 'Dark mode'}
              </Button>
            </View>
            <IconButton
              testID="nav-settings-button"
              label="Settings"
              size="sm"
              onPress={() => go(SETTINGS.href)}
            >
              <IconSettings color={theme.color.text.secondary} size={20} />
            </IconButton>
          </Inline>
          <Divider />
          {/* Who is signed in, at the foot of the menu — the one place in the
              shell that is about the person rather than the restaurant. */}
          <Inline gap="sm" style={{ paddingHorizontal: theme.space.xs }}>
            <Avatar
              name={ACCOUNT.name}
              size="lg"
              imageUri={ACCOUNT.avatarUri}
              testID="nav-user-avatar"
            />
            {/* A plain View, not a Stack: the two lines belong to one block and
                sit on their own line heights rather than on a space token. */}
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {ACCOUNT.name}
              </Text>
              <Text variant="caption" color="muted" numberOfLines={1}>
                {ACCOUNT.email}
              </Text>
            </View>
          </Inline>
        </Stack>
      }
    >
      {children}
    </NavDrawer>
  )
}
