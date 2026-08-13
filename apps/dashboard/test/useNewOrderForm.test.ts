import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useNewOrderForm } from '../src/features/orders/useNewOrderForm'

const settings = { taxRatePercent: 9, deliveryFeeCents: 400 }
const nasiLemak = { id: 'a', name: 'Nasi Lemak', priceCents: 850 }
const tehTarik = { id: 'b', name: 'Teh Tarik', priceCents: 320 }

describe('useNewOrderForm', () => {
  it('estimates the total the same way the server does', () => {
    const { result } = renderHook(() => useNewOrderForm({ settings }))

    act(() => {
      result.current.setChannel('delivery')
    })
    act(() => {
      result.current.addItem(nasiLemak, 2)
      result.current.addItem(tehTarik, 1)
    })

    // The spec's worked example, computed with the backend's own functions.
    expect(result.current.estimate).toEqual({
      subtotalCents: 2020,
      taxCents: 182,
      deliveryFeeCents: 400,
      totalCents: 2602,
    })
  })

  it('drops the delivery fee when the channel changes', () => {
    const { result } = renderHook(() => useNewOrderForm({ settings }))

    act(() => {
      result.current.setChannel('delivery')
      result.current.addItem(tehTarik, 1)
    })
    expect(result.current.estimate.deliveryFeeCents).toBe(400)

    act(() => {
      result.current.setChannel('dine_in')
    })
    expect(result.current.estimate.deliveryFeeCents).toBe(0)
    expect(result.current.estimate.totalCents).toBe(320 + 29)
  })

  it('merges a repeated item rather than adding a second line', () => {
    const { result } = renderHook(() => useNewOrderForm({ settings }))

    act(() => {
      result.current.addItem(nasiLemak, 1)
    })
    act(() => {
      result.current.addItem(nasiLemak, 2)
    })

    expect(result.current.lines).toHaveLength(1)
    expect(result.current.lines[0]!.quantity).toBe(3)
  })

  it('removes a line when quantity reaches zero', () => {
    const { result } = renderHook(() => useNewOrderForm({ settings }))

    act(() => {
      result.current.addItem(nasiLemak, 1)
    })
    act(() => {
      result.current.setQuantity('a', 0)
    })

    expect(result.current.lines).toHaveLength(0)
    expect(result.current.isValid).toBe(false)
    expect(result.current.estimate.totalCents).toBe(0)
  })

  it('sends no prices to the server', () => {
    const { result } = renderHook(() => useNewOrderForm({ settings }))

    act(() => {
      result.current.addItem(nasiLemak, 2)
    })

    expect(result.current.payload.items).toEqual([{ menuItemId: 'a', quantity: 2, notes: null }])
  })
})
