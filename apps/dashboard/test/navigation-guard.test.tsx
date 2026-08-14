import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  NavigationGuardProvider,
  useGuardedNavigation,
  useNavigationGuard,
} from '../src/components/NavigationGuard'

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

  it('hands navigation to the guard, which can release it later', () => {
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
    expect(action).toHaveBeenCalledOnce()
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
})
