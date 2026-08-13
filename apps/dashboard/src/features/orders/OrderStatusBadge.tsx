import { ORDER_STATUS_LABELS, type OrderStatus } from '@repo/types'
import { Badge } from '@repo/ui'
import { toneForStatus } from './formatting'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={toneForStatus(status)}>{ORDER_STATUS_LABELS[status]}</Badge>
}
