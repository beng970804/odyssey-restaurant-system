import { fireEvent, screen } from '@testing-library/react'
import { Text } from 'react-native'
import { describe, expect, it, vi } from 'vitest'
import { wrap } from './helpers'
import { NavDrawer } from '../src/primitives/NavDrawer'
import { lightTheme } from '../src/theme/tokens'

const items = [
  { href: '/', label: 'Home' },
  { href: '/orders', label: 'Orders', badge: 2 },
]

const props = {
  items,
  activeHref: '/orders',
  onNavigate: vi.fn(),
  onOpenChange: vi.fn(),
}

describe('NavDrawer', () => {
  it('renders the nav underneath the content surface', () => {
    wrap(
      <NavDrawer {...props} open>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    expect(screen.getByTestId('nav-item-orders')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText("Today's orders")).toBeTruthy()
  })

  it('keeps a closed drawer out of the accessibility tree', () => {
    wrap(
      <NavDrawer {...props} open={false}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    // Mounted underneath, but offscreen — reachable by tab order would put the
    // whole nav ahead of the visible content.
    expect(screen.getByTestId('nav-drawer-menu')).toHaveAttribute('aria-hidden', 'true')
  })

  it('exposes an open drawer to the accessibility tree', () => {
    wrap(
      <NavDrawer {...props} open>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    expect(screen.getByTestId('nav-drawer-menu')).not.toHaveAttribute('aria-hidden')
  })

  it('closes when the content surface is tapped while open', () => {
    const onOpenChange = vi.fn()
    wrap(
      <NavDrawer {...props} open onOpenChange={onOpenChange}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    fireEvent.click(screen.getByTestId('nav-drawer-scrim'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('leaves the content interactive when closed', () => {
    wrap(
      <NavDrawer {...props} open={false}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    // The scrim only exists while the drawer is open; otherwise it would eat
    // every press on the dashboard behind it.
    expect(screen.queryByTestId('nav-drawer-scrim')).toBeNull()
  })

  it('reports navigation without knowing about routing', () => {
    const onNavigate = vi.fn()
    wrap(
      <NavDrawer {...props} open onNavigate={onNavigate}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    fireEvent.click(screen.getByTestId('nav-item-orders'))
    expect(onNavigate).toHaveBeenCalledWith('/orders')
  })

  it('closes after navigating, so the destination is visible', () => {
    const onOpenChange = vi.fn()
    wrap(
      <NavDrawer {...props} open onOpenChange={onOpenChange}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    fireEvent.click(screen.getByTestId('nav-item-orders'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('hides the menu content behind a closed drawer', () => {
    wrap(
      <NavDrawer {...props} open={false}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    // The menu emerges as the surface travels rather than sitting there fully
    // painted behind it — that reveal is what gives the slide its depth.
    expect(screen.getByTestId('nav-drawer-reveal')).toHaveStyle({ opacity: '0' })
  })

  it('fully reveals the menu content once open', () => {
    wrap(
      <NavDrawer {...props} open>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    expect(screen.getByTestId('nav-drawer-reveal')).toHaveStyle({ opacity: '1' })
  })

  it('leaves the sliding surface square', () => {
    wrap(
      <NavDrawer {...props} open>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    // Absence, not zero: with no radius set React Native Web emits no
    // border-radius property at all, so there is nothing to compare against.
    expect(screen.getByTestId('nav-drawer-surface').getAttribute('style')).not.toMatch(/radius/i)
  })

  it('slides the surface over the menu by default', () => {
    wrap(
      <NavDrawer {...props} open>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    expect(screen.getByTestId('nav-drawer-surface')).toHaveStyle({
      transform: `translateX(${lightTheme.layout.sidebarWidth}px)`,
    })
  })

  it('shrinks the surface beside the menu when persistent', () => {
    wrap(
      <NavDrawer {...props} open persistent>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    // Sliding would push the right-hand side of the dashboard off screen and
    // leave it there, which is fine for a drawer you dismiss and not for one
    // you work alongside.
    expect(screen.getByTestId('nav-drawer-surface')).toHaveStyle({
      marginLeft: `${lightTheme.layout.sidebarWidth}px`,
    })
  })

  it('drops the scrim when persistent, so the content stays clickable', () => {
    wrap(
      <NavDrawer {...props} open persistent>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    expect(screen.queryByTestId('nav-drawer-scrim')).toBeNull()
  })

  it('stays open after navigating when persistent', () => {
    const onOpenChange = vi.fn()
    wrap(
      <NavDrawer {...props} open persistent onOpenChange={onOpenChange}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    fireEvent.click(screen.getByTestId('nav-item-orders'))
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('sizes the menu from the sidebar width token', () => {
    wrap(
      <NavDrawer {...props} open>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    expect(screen.getByTestId('nav-drawer-menu')).toHaveStyle({
      width: `${lightTheme.layout.sidebarWidth}px`,
    })
  })
})
