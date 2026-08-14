import { ThemeProvider } from '@repo/ui'
import { act, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OrderStatusBadge } from '../src/features/orders/OrderStatusBadge'

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('OrderStatusBadge', () => {
  it('does not flash on first render — arriving is not changing', () => {
    wrap(<OrderStatusBadge status="pending" />)

    expect(screen.getByText('Pending')).toBeTruthy()
    expect(screen.getByTestId('status-badge').style.transform).not.toContain('1.08')
  })

  it('flashes when the status changes, then settles', () => {
    // An optimistic action swaps the status before the server answers. The
    // swap is the confirmation — it should be seen, not just eventually
    // noticed.
    const { rerender } = wrap(<OrderStatusBadge status="pending" />)

    rerender(
      <ThemeProvider>
        <OrderStatusBadge status="accepted" />
      </ThemeProvider>,
    )

    expect(screen.getByText('Accepted')).toBeTruthy()
    expect(screen.getByTestId('status-badge').style.transform).toContain('1.08')

    advance(1000)
    expect(screen.getByTestId('status-badge').style.transform).not.toContain('1.08')
  })
})
