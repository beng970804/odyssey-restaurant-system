export const ORDER_CHANNELS = ['dine_in', 'takeaway', 'delivery'] as const
export type OrderChannel = (typeof ORDER_CHANNELS)[number]

export const ORDER_CHANNEL_LABELS: Record<OrderChannel, string> = {
  dine_in: 'Dine-in',
  takeaway: 'Takeaway',
  delivery: 'Delivery',
}
