import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from '../src/primitives/ToastProvider'
import { ThemeProvider } from '../src/theme/ThemeProvider'

/** The control captured from context, so tests fire toasts without UI. */
let control: ReturnType<typeof useToast>

function Capture() {
  control = useToast()
  return null
}

const setup = () =>
  render(
    <ThemeProvider>
      <ToastProvider>
        <Capture />
      </ToastProvider>
    </ThemeProvider>,
  )

const show = (message: string) => act(() => control.show(message))

/**
 * Two flushes, not one: the countdown fires in the first, and the exit timer
 * the resulting effect schedules fires in the second. A browser has no such
 * seam — this is fake-timer bookkeeping, not component behaviour.
 */
const advance = (ms: number) => {
  act(() => void vi.advanceTimersByTime(ms))
  act(() => void vi.advanceTimersByTime(ms))
}

/** Generous: the auto-dismiss plus any exit animation a toast plays. */
const LONG_ENOUGH = 10_000

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('ToastProvider', () => {
  it('shows a toast and dismisses it after its time', () => {
    setup()
    show('Order #42 placed')

    expect(screen.getByText('Order #42 placed')).toBeTruthy()

    advance(LONG_ENOUGH)
    expect(screen.queryByText('Order #42 placed')).toBeNull()
  })

  it('dismisses on press, without waiting out the timer', () => {
    setup()
    show('Order #42 placed')

    fireEvent.click(screen.getByText('Order #42 placed'))

    // The exit animation may hold the node briefly; it must not hold it 4s.
    advance(1000)
    expect(screen.queryByText('Order #42 placed')).toBeNull()
  })

  it('holds the toast open while the pointer is over it', () => {
    // Hovering is reading. A toast that vanishes mid-read at its usual pace
    // punishes exactly the person who cared what it said.
    setup()
    show('Order #42 placed')

    fireEvent.pointerEnter(screen.getByRole('status'))
    advance(LONG_ENOUGH)
    expect(screen.getByText('Order #42 placed')).toBeTruthy()

    fireEvent.pointerLeave(screen.getByRole('status'))
    advance(LONG_ENOUGH)
    expect(screen.queryByText('Order #42 placed')).toBeNull()
  })

  it('arrives with an entrance rather than teleporting', () => {
    // Every mutation reports through this channel; the least it can do is not
    // pop. The card starts translated and transparent, and transitions in.
    setup()
    show('Order #42 placed')

    const card = screen.getByRole('status')
    expect(card).toHaveStyle({ opacity: 0 })

    advance(50)
    expect(card).toHaveStyle({ opacity: 1 })
  })
})
