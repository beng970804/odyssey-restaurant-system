import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  NavigationGuardProvider,
  useGuardedNavigation,
  useNavigationGuard,
} from '../src/components/NavigationGuard'

/** Lets history traversals queued by unmounting guards land before the next test. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 20))

/** Stands in for the Sidebar: something that wants to navigate. */
function Trigger({ action }: { action: () => void }) {
  const guarded = useGuardedNavigation()
  return (
    <button type="button" onClick={() => guarded(action)}>
      Go
    </button>
  )
}

/** Stands in for a dirty screen: it holds the leave decision. */
function DirtyScreen({ dirty }: { dirty: boolean }) {
  const [pending, setPending] = useState<(() => void) | null>(null)
  useNavigationGuard(dirty ? (proceed) => setPending(() => proceed) : null)
  return pending ? (
    <button type="button" onClick={() => pending()}>
      Leave anyway
    </button>
  ) : null
}

describe('NavigationGuard', () => {
  it('lets navigation through when no guard is registered', () => {
    const action = vi.fn()
    render(
      <NavigationGuardProvider>
        <Trigger action={action} />
        <DirtyScreen dirty={false} />
      </NavigationGuardProvider>,
    )

    fireEvent.click(screen.getByText('Go'))
    expect(action).toHaveBeenCalledOnce()
  })

  it('hands navigation to the guard, which can release it later', async () => {
    const action = vi.fn()
    render(
      <NavigationGuardProvider>
        <Trigger action={action} />
        <DirtyScreen dirty />
      </NavigationGuardProvider>,
    )

    fireEvent.click(screen.getByText('Go'))
    // The guard intercepted: nothing navigated, the screen is asking instead.
    expect(action).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Leave anyway'))
    // Released — after the sentinel history entry has been collapsed.
    await waitFor(() => expect(action).toHaveBeenCalledOnce())
  })

  it('unregisters with the screen that owns it', () => {
    const action = vi.fn()
    const { rerender } = render(
      <NavigationGuardProvider>
        <Trigger action={action} />
        <DirtyScreen dirty />
      </NavigationGuardProvider>,
    )

    rerender(
      <NavigationGuardProvider>
        <Trigger action={action} />
      </NavigationGuardProvider>,
    )

    fireEvent.click(screen.getByText('Go'))
    expect(action).toHaveBeenCalledOnce()
  })

  it('navigates plainly when rendered without a provider', () => {
    const action = vi.fn()
    render(<Trigger action={action} />)

    fireEvent.click(screen.getByText('Go'))
    expect(action).toHaveBeenCalledOnce()
  })

  it('intercepts the browser back button and releases it on request', async () => {
    // Let any history traversal queued by earlier tests land first.
    await settle()
    // Arrived at /settings from somewhere — the entry a back press would reach.
    window.history.pushState({}, '', '/before')
    window.history.pushState({}, '', '/settings')
    render(
      <NavigationGuardProvider>
        <DirtyScreen dirty />
      </NavigationGuardProvider>,
    )

    window.history.back()

    // The sentinel absorbed the back press: still here, the guard asking.
    const leave = await screen.findByText('Leave anyway')
    expect(window.location.pathname).toBe('/settings')

    const popped = vi.fn()
    window.addEventListener('popstate', popped)
    fireEvent.click(leave)
    await waitFor(() => expect(popped).toHaveBeenCalled())
    window.removeEventListener('popstate', popped)
    // Past the sentinel and the page both: where the back press was headed.
    expect(window.location.pathname).toBe('/before')
  })

  it('lets the browser back button pass when no guard is registered', async () => {
    await settle()
    window.history.pushState({}, '', '/before')
    window.history.pushState({}, '', '/settings')
    render(
      <NavigationGuardProvider>
        <DirtyScreen dirty={false} />
      </NavigationGuardProvider>,
    )

    const popped = vi.fn()
    window.addEventListener('popstate', popped)
    window.history.back()
    await waitFor(() => expect(popped).toHaveBeenCalled())
    window.removeEventListener('popstate', popped)

    expect(window.location.pathname).toBe('/before')
    expect(screen.queryByText('Leave anyway')).toBeNull()
  })

  it('blocks tab close while guarded, and only then', () => {
    const { rerender } = render(
      <NavigationGuardProvider>
        <DirtyScreen dirty />
      </NavigationGuardProvider>,
    )

    const guardedClose = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(guardedClose)
    expect(guardedClose.defaultPrevented).toBe(true)

    rerender(
      <NavigationGuardProvider>
        <DirtyScreen dirty={false} />
      </NavigationGuardProvider>,
    )
    const freeClose = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(freeClose)
    expect(freeClose.defaultPrevented).toBe(false)
  })
})
