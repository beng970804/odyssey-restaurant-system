import { ThemeProvider } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import { Text } from 'react-native'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from '../src/components/AppShell'
import { PageHeader } from '../src/components/PageHeader'
import { ScreenFooter } from '../src/components/ScreenFooter'

vi.mock('expo-router', () => ({
  usePathname: () => '/orders',
  useRouter: () => ({ push: vi.fn() }),
}))

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

/**
 * The shell reads the viewport for its padding, so the tests drive the real
 * window rather than stubbing useBreakpoint.
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

/**
 * A screen, not a bare node: the drawer toggle lives on the screen's header row
 * now, so a shell wrapped around nothing has no toggle to press — which is what
 * these tests drive.
 */
const shell = () => (
  <AppShell>
    <PageHeader title="Orders" />
    <Text>Today's orders</Text>
  </AppShell>
)

beforeEach(() => setViewport(1440))

describe('AppShell', () => {
  it('starts with the drawer open on a wide viewport', () => {
    wrap(shell())

    expect(screen.getByTestId('nav-drawer-menu')).not.toHaveAttribute('aria-hidden')
    expect(screen.getByTestId('nav-drawer-toggle')).toBeTruthy()
  })

  it('keeps the drawer open after navigating on a wide viewport', () => {
    wrap(shell())

    fireEvent.click(screen.getByTestId('nav-item-menu'))
    expect(screen.getByTestId('nav-drawer-menu')).not.toHaveAttribute('aria-hidden')
  })

  it('closes on a wide viewport only from the toggle', () => {
    wrap(shell())

    fireEvent.click(screen.getByTestId('nav-drawer-toggle'))
    expect(screen.getByTestId('nav-drawer-menu')).toHaveAttribute('aria-hidden', 'true')
  })

  it('closes after navigating below the wide breakpoint', () => {
    setViewport(1000)
    wrap(shell())

    fireEvent.click(screen.getByTestId('nav-drawer-toggle'))
    fireEvent.click(screen.getByTestId('nav-item-menu'))

    expect(screen.getByTestId('nav-drawer-menu')).toHaveAttribute('aria-hidden', 'true')
  })

  it('starts with the drawer closed on a narrow viewport', () => {
    setViewport(600)
    wrap(shell())

    expect(screen.getByTestId('nav-drawer-menu')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('nav-drawer-toggle')).toBeTruthy()
  })

  it('opens from the toggle on a narrow viewport', () => {
    setViewport(600)
    wrap(shell())

    fireEvent.click(screen.getByTestId('nav-drawer-toggle'))
    expect(screen.getByTestId('nav-drawer-menu')).not.toHaveAttribute('aria-hidden')
  })

  it('renders its content', () => {
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

  it('docks a screen footer under the scroller, exactly once', () => {
    // The New Order recap bar rides this slot. Inside the shell the bar must
    // render in the dock and not also inline — the inline form is only the
    // fallback for a screen rendered with no shell around it.
    const { unmount } = wrap(
      <AppShell>
        <Text>Menu grid</Text>
        <ScreenFooter>
          <Text>2 items · S$25.07</Text>
        </ScreenFooter>
      </AppShell>,
    )

    expect(screen.getAllByText('2 items · S$25.07')).toHaveLength(1)
    unmount()

    // No shell, no dock: the bar still exists, in place.
    wrap(
      <ScreenFooter>
        <Text>2 items · S$25.07</Text>
      </ScreenFooter>,
    )
    expect(screen.getAllByText('2 items · S$25.07')).toHaveLength(1)
  })
})
