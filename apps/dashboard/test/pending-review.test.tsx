import { ApiProvider } from '@repo/api-client'
import { ThemeProvider } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PendingCard } from '../src/features/home/PendingCard'

const push = vi.fn()
vi.mock('expo-router', () => ({ useRouter: () => ({ push }) }))

const wrap = (ui: ReactElement) =>
  render(
    <ThemeProvider>
      <ApiProvider>{ui}</ApiProvider>
    </ThemeProvider>,
  )

const pending = {
  value: '5',
  count: 5,
  total: 60,
  caption: 'of 60 orders all time',
  tone: 'warning' as const,
}

const card = () => <PendingCard pending={pending} currency="SGD" timezone="Asia/Singapore" />

describe('reviewing the pending queue', () => {
  it('keeps the dashboard and opens the queue over it', () => {
    // The question "what is waiting?" is worth answering without losing the
    // screen that asked it, so the button opens a dialog rather than navigating.
    wrap(card())
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(screen.getByText('Review orders'))

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Orders awaiting a decision')
    expect(push).not.toHaveBeenCalled()
  })

  it('closes again', () => {
    wrap(card())
    fireEvent.click(screen.getByText('Review orders'))

    // Two things close this: the modal's own button and the backdrop behind it.
    const [backdrop] = screen.getAllByLabelText('Close')
    fireEvent.click(backdrop!)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
