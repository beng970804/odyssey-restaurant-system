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
  it('renders the nav and the content side by side when pinned', () => {
    wrap(
      <NavDrawer {...props} mode="pinned" open={false}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    expect(screen.getByTestId('nav-item-orders')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText("Today's orders")).toBeTruthy()
  })

  it('renders the nav underneath the content surface when a drawer', () => {
    wrap(
      <NavDrawer {...props} mode="drawer" open>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    expect(screen.getByTestId('nav-item-orders')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText("Today's orders")).toBeTruthy()
  })

  it('keeps a closed drawer out of the accessibility tree', () => {
    wrap(
      <NavDrawer {...props} mode="drawer" open={false}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    // Mounted underneath, but offscreen — reachable by tab order would put the
    // whole nav ahead of the visible content on a phone.
    expect(screen.getByTestId('nav-drawer-menu')).toHaveAttribute('aria-hidden', 'true')
  })

  it('exposes an open drawer to the accessibility tree', () => {
    wrap(
      <NavDrawer {...props} mode="drawer" open>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    expect(screen.getByTestId('nav-drawer-menu')).not.toHaveAttribute('aria-hidden')
  })

  it('never hides the nav when pinned, whatever open says', () => {
    wrap(
      <NavDrawer {...props} mode="pinned" open={false}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    expect(screen.getByTestId('nav-drawer-menu')).not.toHaveAttribute('aria-hidden')
  })

  it('closes when the content surface is tapped while open', () => {
    const onOpenChange = vi.fn()
    wrap(
      <NavDrawer {...props} mode="drawer" open onOpenChange={onOpenChange}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    fireEvent.click(screen.getByTestId('nav-drawer-scrim'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('leaves the content interactive when closed', () => {
    wrap(
      <NavDrawer {...props} mode="drawer" open={false}>
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
      <NavDrawer {...props} mode="drawer" open onNavigate={onNavigate}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    fireEvent.click(screen.getByTestId('nav-item-orders'))
    expect(onNavigate).toHaveBeenCalledWith('/orders')
  })

  it('closes the drawer after navigating, so the destination is visible', () => {
    const onOpenChange = vi.fn()
    wrap(
      <NavDrawer {...props} mode="drawer" open onOpenChange={onOpenChange}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    fireEvent.click(screen.getByTestId('nav-item-orders'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('stays put after navigating when pinned', () => {
    const onOpenChange = vi.fn()
    wrap(
      <NavDrawer {...props} mode="pinned" open={false} onOpenChange={onOpenChange}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    fireEvent.click(screen.getByTestId('nav-item-orders'))
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('sizes the pinned nav from the expanded width token', () => {
    wrap(
      <NavDrawer {...props} mode="pinned" open={false}>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    expect(screen.getByTestId('nav-drawer-menu')).toHaveStyle({
      width: `${lightTheme.layout.sidebarWidth}px`,
    })
  })

  it('sizes the pinned nav from the collapsed width token', () => {
    wrap(
      <NavDrawer {...props} mode="pinned" open={false} collapsed>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    // The width is what animates, so it has to be the drawer's to drive —
    // SideNav's own width would snap independently of the spring.
    expect(screen.getByTestId('nav-drawer-menu')).toHaveStyle({
      width: `${lightTheme.layout.sidebarCollapsedWidth}px`,
    })
  })

  it('collapses the pinned nav to icons when asked', () => {
    wrap(
      <NavDrawer {...props} mode="pinned" open={false} collapsed>
        <Text>Today's orders</Text>
      </NavDrawer>,
    )

    expect(screen.queryByText('Orders')).toBeNull()
    expect(screen.getByTestId('nav-item-orders')).toHaveAttribute('aria-label', 'Orders')
  })
})
