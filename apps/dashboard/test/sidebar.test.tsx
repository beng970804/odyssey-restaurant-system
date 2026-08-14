import { ThemeProvider } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { Text } from 'react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ACCOUNT } from '../src/account'
import { Sidebar } from '../src/components/Sidebar'

const push = vi.fn()

vi.mock('expo-router', () => ({
  usePathname: () => '/orders',
  useRouter: () => ({ push }),
}))

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

const sidebar = () => (
  <Sidebar open onOpenChange={vi.fn()} persistent>
    <Text>Today's orders</Text>
  </Sidebar>
)

const search = () => screen.getByTestId('nav-search')

beforeEach(() => push.mockClear())

describe('Sidebar', () => {
  it('lists every destination before anything is typed', () => {
    wrap(sidebar())

    expect(screen.getByTestId('nav-item-menu')).toBeTruthy()
    expect(screen.getByTestId('nav-item-customers')).toBeTruthy()
  })

  it('narrows the list to what was typed', () => {
    wrap(sidebar())

    fireEvent.change(search(), { target: { value: 'cust' } })

    expect(screen.getByTestId('nav-item-customers')).toBeTruthy()
    expect(screen.queryByTestId('nav-item-menu')).toBeNull()
  })

  it('matches regardless of case', () => {
    wrap(sidebar())

    fireEvent.change(search(), { target: { value: 'MENU' } })

    expect(screen.getByTestId('nav-item-menu')).toBeTruthy()
  })

  it('goes straight to the first match on submit', () => {
    wrap(sidebar())

    fireEvent.change(search(), { target: { value: 'ord' } })
    fireEvent.keyDown(search(), { key: 'Enter' })

    expect(push).toHaveBeenCalledWith('/orders')
  })

  it('submits nothing when nothing matches', () => {
    wrap(sidebar())

    fireEvent.change(search(), { target: { value: 'zzz' } })
    fireEvent.keyDown(search(), { key: 'Enter' })

    expect(push).not.toHaveBeenCalled()
    expect(screen.getByText('No pages match')).toBeTruthy()
  })

  it('clears the query once it has taken you somewhere', () => {
    wrap(sidebar())

    fireEvent.change(search(), { target: { value: 'ord' } })
    fireEvent.keyDown(search(), { key: 'Enter' })

    expect(search()).toHaveValue('')
    expect(screen.getByTestId('nav-item-menu')).toBeTruthy()
  })

  it('finds settings from the search box even though it left the list', () => {
    wrap(sidebar())

    expect(screen.queryByTestId('nav-item-settings')).toBeNull()

    fireEvent.change(search(), { target: { value: 'sett' } })
    expect(screen.getByTestId('nav-item-settings')).toBeTruthy()
  })

  it('reaches settings from the footer beside the theme toggle', () => {
    wrap(sidebar())

    fireEvent.click(screen.getByTestId('nav-settings-button'))
    expect(push).toHaveBeenCalledWith('/settings')
  })

  it('names who is signed in', () => {
    wrap(sidebar())

    expect(screen.getByText(ACCOUNT.name)).toBeTruthy()
    expect(screen.getByText(ACCOUNT.email)).toBeTruthy()
    expect(screen.getByTestId('nav-user-avatar')).toBeTruthy()
  })

  it('closes the drawer after the footer buttons, like the nav items do', () => {
    // On a phone every press in the drawer is a decision to be somewhere else:
    // the nav items already close it on the way, and the two footer controls
    // were the odd ones out — the drawer stayed over the page they had just
    // acted on.
    const onOpenChange = vi.fn()
    wrap(
      <Sidebar open onOpenChange={onOpenChange} persistent={false}>
        <Text>Today's orders</Text>
      </Sidebar>,
    )

    fireEvent.click(screen.getByTestId('nav-settings-button'))
    expect(push).toHaveBeenCalledWith('/settings')
    expect(onOpenChange).toHaveBeenCalledWith(false)

    onOpenChange.mockClear()
    fireEvent.click(screen.getByText(/mode$/))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('leaves the pinned drawer open, where closing costs nothing to undo', () => {
    const onOpenChange = vi.fn()
    wrap(
      <Sidebar open onOpenChange={onOpenChange} persistent>
        <Text>Today's orders</Text>
      </Sidebar>,
    )

    fireEvent.click(screen.getByTestId('nav-settings-button'))
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
