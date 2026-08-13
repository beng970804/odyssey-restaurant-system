import type { ReactNode } from 'react'
import { useTheme } from '../theme/ThemeProvider'
import { NavItem, type NavItemIcon } from './NavItem'
import { Stack } from './Stack'

export type SideNavItem = {
  href: string
  label: string
  icon?: NavItemIcon
  badge?: number
}

export type SideNavProps = {
  items: SideNavItem[]
  activeHref: string
  onNavigate: (href: string) => void
  collapsed?: boolean
  header?: ReactNode
  footer?: ReactNode
  /**
   * Defaults to the width token matching `collapsed`. Pass `'100%'` when a
   * parent is animating the width, so the two do not fight over it.
   */
  width?: number | '100%'
}

/**
 * The styling of navigation is design-system work, so it lives here. The app's
 * Sidebar is a thin adapter that supplies the route list and the active path.
 */
export function SideNav({
  items,
  activeHref,
  onNavigate,
  collapsed = false,
  header,
  footer,
  width,
}: SideNavProps) {
  const theme = useTheme()

  return (
    <Stack
      gap="md"
      style={{
        width:
          width ?? (collapsed ? theme.layout.sidebarCollapsedWidth : theme.layout.sidebarWidth),
        padding: theme.space.md,
        backgroundColor: theme.color.bg.surface,
        borderRightWidth: theme.borderWidth.thin,
        borderColor: theme.color.border.default,
        height: '100%',
      }}
    >
      {header}
      <Stack gap="xs" flex={1}>
        {items.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            badge={item.badge}
            collapsed={collapsed}
            // Exact match, or a section prefix — so /orders/42 keeps Orders lit.
            active={
              item.href === '/'
                ? activeHref === '/'
                : activeHref === item.href || activeHref.startsWith(`${item.href}/`)
            }
            onPress={onNavigate}
          />
        ))}
      </Stack>
      {footer}
    </Stack>
  )
}
