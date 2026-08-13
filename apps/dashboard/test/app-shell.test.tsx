import { ThemeProvider } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import { Text } from 'react-native'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from '../src/components/AppShell'

vi.mock('expo-router', () => ({
  usePathname: () => '/orders',
  useRouter: () => ({ push: vi.fn() }),
}))

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

/**
 * The shell's whole job is picking a mode from the viewport, so the tests drive
 * the real window rather than stubbing useBreakpoint — otherwise they would be
 * asserting on the mock instead of on the breakpoint.
 */
function setViewport(width: number) {
  // React Native Web measures documentElement.clientWidth, which jsdom reports
  // as 0 — so without this every render would look like a phone.
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: width,
    configurable: true,
  })
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: 900,
    configurable: true,
  })
  window.dispatchEvent(new Event('resize'))
}

const shell = () => (
  <AppShell>
    <Text>Today's orders</Text>
  </AppShell>
)

beforeEach(() => setViewport(1440))

describe('AppShell', () => {
  it('pins the sidebar on a wide viewport', () => {
    wrap(shell())

    expect(screen.getByTestId('nav-drawer-menu')).not.toHaveAttribute('aria-hidden')
    expect(screen.queryByTestId('nav-drawer-toggle')).toBeNull()
  })

  it('turns the sidebar into a closed drawer below the md breakpoint', () => {
    setViewport(600)
    wrap(shell())

    expect(screen.getByTestId('nav-drawer-menu')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('nav-drawer-toggle')).toBeTruthy()
  })

  it('opens the drawer from the toggle on a narrow viewport', () => {
    setViewport(600)
    wrap(shell())

    fireEvent.click(screen.getByTestId('nav-drawer-toggle'))
    expect(screen.getByTestId('nav-drawer-menu')).not.toHaveAttribute('aria-hidden')
  })

  it('collapses the pinned sidebar to icons from the pin toggle', () => {
    wrap(shell())
    expect(screen.getByText('Orders')).toBeTruthy()

    fireEvent.click(screen.getByTestId('sidebar-pin-toggle'))

    expect(screen.queryByText('Orders')).toBeNull()
    expect(screen.getByTestId('nav-item-orders')).toHaveAttribute('aria-label', 'Orders')
  })

  it('renders its content in both modes', () => {
    wrap(shell())
    expect(screen.getByText("Today's orders")).toBeTruthy()
  })

  it('badges the orders item with the pending count', () => {
    wrap(
      <AppShell pendingCount={7}>
        <Text>Today's orders</Text>
      </AppShell>,
    )

    expect(screen.getByText('7')).toBeTruthy()
  })
})
