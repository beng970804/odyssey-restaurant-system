import { calcTaxCents, sumCents } from '@repo/shared'
import type { OrderChannel } from '@repo/types'
import { useMemo, useState } from 'react'

export type PickableItem = { id: string; name: string; priceCents: number }
export type OrderLine = { item: PickableItem; quantity: number; notes?: string }

export type NewOrderSettings = { taxRatePercent: number; deliveryFeeCents: number }

export function useNewOrderForm({ settings }: { settings: NewOrderSettings }) {
  const [channel, setChannel] = useState<OrderChannel>('takeaway')
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<OrderLine[]>([])

  const addItem = (item: PickableItem, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((line) => line.item.id === item.id)
      if (!existing) return [...current, { item, quantity }]
      return current.map((line) =>
        line.item.id === item.id ? { ...line, quantity: line.quantity + quantity } : line,
      )
    })
  }

  const setQuantity = (itemId: string, quantity: number) => {
    // Zero removes the line rather than leaving an order for nothing.
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => line.item.id !== itemId)
        : current.map((line) => (line.item.id === itemId ? { ...line, quantity } : line)),
    )
  }

  const setLineNotes = (itemId: string, lineNotes: string) => {
    setLines((current) =>
      current.map((line) => (line.item.id === itemId ? { ...line, notes: lineNotes } : line)),
    )
  }

  /**
   * Computed with the same functions the backend uses, which is the whole
   * reason @repo/shared exists: the estimate the user sees and the figure the
   * server stores cannot disagree.
   */
  const estimate = useMemo(() => {
    const subtotalCents = sumCents(lines.map((line) => line.item.priceCents * line.quantity))
    const taxCents = calcTaxCents(subtotalCents, settings.taxRatePercent)
    const deliveryFeeCents = channel === 'delivery' ? settings.deliveryFeeCents : 0
    return {
      subtotalCents,
      taxCents,
      deliveryFeeCents,
      totalCents: subtotalCents + taxCents + deliveryFeeCents,
    }
  }, [lines, channel, settings.taxRatePercent, settings.deliveryFeeCents])

  const reset = () => {
    setLines([])
    setNotes('')
    setCustomerId(null)
    setChannel('takeaway')
  }

  return {
    channel,
    setChannel,
    customerId,
    setCustomerId,
    notes,
    setNotes,
    lines,
    addItem,
    setQuantity,
    setLineNotes,
    estimate,
    reset,
    isValid: lines.length > 0,
    payload: {
      channel,
      customerId,
      notes: notes || null,
      items: lines.map((line) => ({
        menuItemId: line.item.id,
        quantity: line.quantity,
        notes: line.notes || null,
      })),
    },
  }
}
