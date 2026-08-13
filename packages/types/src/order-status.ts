export const ORDER_STATUSES = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'completed',
  'cancelled',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_ACTIONS = [
  'accept',
  'startPreparing',
  'markReady',
  'complete',
  'cancel',
] as const
export type OrderAction = (typeof ORDER_ACTIONS)[number]

/**
 * The whole state machine, defined once. Only the moves listed here exist;
 * anything else is not a discouraged path, it is impossible. Both the backend's
 * Action endpoints and the dashboard's action buttons read this map, so they
 * cannot disagree about what a member of staff is allowed to do.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, Partial<Record<OrderAction, OrderStatus>>> = {
  pending: { accept: 'accepted', cancel: 'cancelled' },
  accepted: { startPreparing: 'preparing', cancel: 'cancelled' },
  preparing: { markReady: 'ready', cancel: 'cancelled' },
  ready: { complete: 'completed' },
  completed: {},
  cancelled: {},
}

export function getAvailableActions(status: OrderStatus): OrderAction[] {
  return Object.keys(ORDER_TRANSITIONS[status]) as OrderAction[]
}

export function canPerform(status: OrderStatus, action: OrderAction): boolean {
  return action in ORDER_TRANSITIONS[status]
}

export function resolveTransition(status: OrderStatus, action: OrderAction): OrderStatus | null {
  return ORDER_TRANSITIONS[status][action] ?? null
}

export const ORDER_ACTION_LABELS: Record<OrderAction, string> = {
  accept: 'Accept',
  startPreparing: 'Start preparing',
  markReady: 'Mark ready',
  complete: 'Complete',
  cancel: 'Cancel',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

/**
 * Maps a domain concept to a *design system* concept, not to a colour. The
 * Badge takes a tone; the theme decides what a tone looks like. That is what
 * keeps the primitive free of business knowledge.
 */
export const ORDER_STATUS_TONE: Record<
  OrderStatus,
  'neutral' | 'info' | 'warning' | 'success' | 'danger'
> = {
  pending: 'warning',
  accepted: 'info',
  preparing: 'info',
  ready: 'success',
  completed: 'neutral',
  cancelled: 'danger',
}

export const TERMINAL_STATUSES = [
  'completed',
  'cancelled',
] as const satisfies readonly OrderStatus[]

export function isTerminal(status: OrderStatus): boolean {
  return getAvailableActions(status).length === 0
}
