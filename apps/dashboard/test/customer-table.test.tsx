import type { CustomerWithStats } from '@repo/api-client'
import { ThemeProvider } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { CustomerTable } from '../src/features/crm/CustomerTable'

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

const customer = (overrides: Partial<CustomerWithStats> = {}): CustomerWithStats => ({
  id: 'customer-1',
  name: 'Aisha Rahman',
  phone: '+65 9123 4567',
  email: null,
  notes: null,
  createdAt: '2026-08-01T02:00:00.000Z',
  orderCount: 3,
  lifetimeSpendCents: 12_345,
  ...overrides,
})

describe('CustomerTable', () => {
  it('renders lifetime spend through the money boundary', () => {
    wrap(
      <CustomerTable
        customers={[customer()]}
        loading={false}
        error={null}
        onRetry={() => {}}
        onRowPress={() => {}}
        onAddCustomer={() => {}}
        currency="SGD"
        searching={false}
      />,
    )

    // Cents divided by 100 exactly once, at the display boundary.
    expect(screen.getByText('S$123.45')).toBeTruthy()
    expect(screen.getByText('Aisha Rahman')).toBeTruthy()
  })

  it('shows a dash rather than an empty cell for a customer with no phone', () => {
    wrap(
      <CustomerTable
        customers={[customer({ phone: null })]}
        loading={false}
        error={null}
        onRetry={() => {}}
        onRowPress={() => {}}
        onAddCustomer={() => {}}
        currency="SGD"
        searching={false}
      />,
    )

    expect(screen.getByText('—')).toBeTruthy()
  })

  it('distinguishes an empty search from an empty customer list', () => {
    const { rerender } = wrap(
      <CustomerTable
        customers={[]}
        loading={false}
        error={null}
        onRetry={() => {}}
        onRowPress={() => {}}
        onAddCustomer={() => {}}
        currency="SGD"
        searching={false}
      />,
    )

    expect(screen.getByText('No customers yet')).toBeTruthy()
    // Walk-ins belong to nobody, which is why this list can be empty.
    expect(screen.getByText(/Walk-ins do not create customers/)).toBeTruthy()

    rerender(
      <ThemeProvider>
        <CustomerTable
          customers={[]}
          loading={false}
          error={null}
          onRetry={() => {}}
          onRowPress={() => {}}
          onAddCustomer={() => {}}
          currency="SGD"
          searching
        />
      </ThemeProvider>,
    )

    expect(screen.getByText('No customers match that search')).toBeTruthy()
  })

  it('reports the pressed customer to its caller', () => {
    const onRowPress = vi.fn()
    wrap(
      <CustomerTable
        customers={[customer()]}
        loading={false}
        error={null}
        onRetry={() => {}}
        onRowPress={onRowPress}
        onAddCustomer={() => {}}
        currency="SGD"
        searching={false}
      />,
    )

    fireEvent.click(screen.getByText('Aisha Rahman'))

    expect(onRowPress).toHaveBeenCalledWith(expect.objectContaining({ id: 'customer-1' }))
  })
})
