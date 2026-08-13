import { ORDER_STATUS_TONE, type OrderStatus } from '@repo/types'
import type { StatusTone } from '@repo/ui'

export const CHANNEL_LABELS: Record<string, string> = {
  dine_in: 'Dine in',
  takeaway: 'Takeaway',
  delivery: 'Delivery',
}

/** The domain's tone map, widened to the design system's vocabulary. */
export const toneForStatus = (status: OrderStatus): StatusTone => ORDER_STATUS_TONE[status]

/** Local time, short form — the list is scanned, not read. */
export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-SG', {
    timeZone,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}
