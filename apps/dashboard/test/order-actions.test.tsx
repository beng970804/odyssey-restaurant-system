import { ApiProvider } from '@repo/api-client'
import { ORDER_STATUSES, type OrderStatus } from '@repo/types'
import { ThemeProvider, ToastProvider } from '@repo/ui'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { OrderActionBar } from '../src/features/orders/OrderActionBar'

const wrap = (ui: ReactElement) =>
  render(
    <ThemeProvider>
      <ApiProvider>
        <ToastProvider>{ui}</ToastProvider>
      </ApiProvider>
    </ThemeProvider>,
  )

const order = (status: OrderStatus) => ({ id: 'order-1', orderNumber: 42, status })

describe('OrderActionBar', () => {
  it('offers accept and cancel on a pending order', () => {
    wrap(<OrderActionBar order={order('pending')} />)

    expect(screen.getByText('Accept')).toBeTruthy()
    expect(screen.getByText('Cancel')).toBeTruthy()
    expect(screen.queryByText('Complete')).toBeNull()
  })

  it('renders only the actions the transition map allows', () => {
    wrap(<OrderActionBar order={order('ready')} />)

    expect(screen.getByText('Complete')).toBeTruthy()
    // A ready order cannot be cancelled — the food is made.
    expect(screen.queryByText('Cancel')).toBeNull()
    expect(screen.queryByText('Accept')).toBeNull()
  })

  it('renders no actions for a terminal order', () => {
    wrap(<OrderActionBar order={order('completed')} />)

    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText(/nothing left to do/i)).toBeTruthy()
  })

  it.each(ORDER_STATUSES)('never offers an action the server would refuse from %s', (status) => {
    wrap(<OrderActionBar order={order(status)} />)

    // Buttons and the shared map are the same source, checked here per status
    // so a change to ORDER_TRANSITIONS is caught by the UI suite too.
    const labels = ['Accept', 'Start preparing', 'Mark ready', 'Complete', 'Cancel']
    const rendered = labels.filter((label) => screen.queryByText(label) !== null)

    const expected = {
      pending: ['Accept', 'Cancel'],
      accepted: ['Start preparing', 'Cancel'],
      preparing: ['Mark ready', 'Cancel'],
      ready: ['Complete'],
      completed: [],
      cancelled: [],
    }[status]

    expect(rendered.toSorted()).toEqual(expected.toSorted())
  })
})
