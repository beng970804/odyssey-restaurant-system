import { ThemeProvider } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import { useEffect, type ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { OrderChannel } from '@repo/types'
import { OrderSummaryPanel } from '../src/features/orders/OrderSummaryPanel'
import { useNewOrderForm, type PickableItem } from '../src/features/orders/useNewOrderForm'

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

const laksa: PickableItem = { id: 'item-1', name: 'Laksa', priceCents: 850 }
const teh: PickableItem = { id: 'item-2', name: 'Teh Tarik', priceCents: 240 }

/**
 * The panel is driven by the real form hook, not a stub of it: the seam under
 * test is "what the operator sees and presses", and the money in it must come
 * out of the same estimate the screen will submit.
 */
const ALL_CHANNEL_OPTIONS = [
  { value: 'dine_in', label: 'Dine in' },
  { value: 'takeaway', label: 'Takeaway' },
  { value: 'delivery', label: 'Delivery' },
]

function Harness({
  preload = [],
  onSubmit = vi.fn(),
  rejectedItemIds = [],
  channelOptions = ALL_CHANNEL_OPTIONS,
}: {
  preload?: PickableItem[]
  onSubmit?: () => void
  rejectedItemIds?: string[]
  channelOptions?: { value: string; label: string }[]
}) {
  const form = useNewOrderForm({
    settings: { taxRatePercent: 9, deliveryFeeCents: 500 },
    enabledChannels: channelOptions.map((option) => option.value as OrderChannel),
  })

  useEffect(() => {
    for (const item of preload) form.addItem(item)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preload once
  }, [])

  return (
    <OrderSummaryPanel
      form={form}
      currency="SGD"
      channelOptions={channelOptions}
      customerOptions={[{ value: 'cust-1', label: 'Aisha Rahman' }]}
      rejectedItemIds={rejectedItemIds}
      channelError={null}
      submitting={false}
      onSubmit={onSubmit}
    />
  )
}

describe('OrderSummaryPanel', () => {
  it('shows the empty order as empty, with the submit disabled', () => {
    wrap(<Harness />)

    expect(screen.getByText('Nothing added yet.')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Place order/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('prices the order through the shared money math', () => {
    wrap(<Harness preload={[laksa, teh]} />)

    // 850 + 240 = 1090 subtotal; 9% tax = 98 (rounded); no delivery fee on dine-in.
    expect(screen.getByText('S$10.90')).toBeTruthy()
    expect(screen.getByText('S$0.98')).toBeTruthy()
    expect(screen.getByText(/Place order · S\$11\.88/)).toBeTruthy()
  })

  it('adjusts a line from its stepper', () => {
    wrap(<Harness preload={[laksa]} />)

    fireEvent.click(screen.getByLabelText('Add one Laksa'))
    expect(screen.getByText('2')).toBeTruthy()
    // 1700 + 9% tax (153) — the whole estimate moved, not just the line.
    expect(screen.getByText(/Place order · S\$18\.53/)).toBeTruthy()
  })

  it('removes a line outright with its remove button', () => {
    wrap(<Harness preload={[laksa, teh]} />)

    fireEvent.click(screen.getByLabelText('Remove Laksa'))

    expect(screen.queryByText('Laksa')).toBeNull()
    expect(screen.getByText('Teh Tarik')).toBeTruthy()
  })

  it('clears the whole order', () => {
    wrap(<Harness preload={[laksa, teh]} />)

    fireEvent.click(screen.getByText('Clear'))
    expect(screen.getByText('Nothing added yet.')).toBeTruthy()
  })

  it('flags the lines the server rejected', () => {
    wrap(<Harness preload={[laksa, teh]} rejectedItemIds={['item-1']} />)
    expect(screen.getByText('No longer available')).toBeTruthy()
  })

  it('adds the delivery fee only when the channel is delivery', () => {
    wrap(<Harness preload={[laksa]} />)

    expect(screen.queryByText('Delivery fee')).toBeNull()
    expect(screen.queryByText('S$5.00')).toBeNull()

    // The form defaults to the first enabled channel (dine-in); switch the
    // channel select to delivery.
    fireEvent.click(screen.getByText('Dine in'))
    fireEvent.click(screen.getByText('Delivery'))

    expect(screen.getByText('Delivery fee')).toBeTruthy()
    expect(screen.getByText('S$5.00')).toBeTruthy()
  })

  it('says so when every channel is switched off, with the submit disabled', () => {
    wrap(<Harness preload={[laksa]} channelOptions={[]} />)

    expect(screen.getByText('All channels are switched off in Settings.')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Place order/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('submits through the button', () => {
    const onSubmit = vi.fn()
    wrap(<Harness preload={[laksa]} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: /Place order/ }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })
})
