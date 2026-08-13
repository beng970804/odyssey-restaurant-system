import {
  ApiError,
  getGetOrderQueryKey,
  getGetStatsSummaryQueryKey,
  getListOrdersQueryKey,
  useAcceptOrder,
  useCancelOrder,
  useCompleteOrder,
  useMarkOrderReady,
  useStartPreparingOrder,
  type Order,
} from '@repo/api-client'
import {
  getAvailableActions,
  ORDER_STATUS_LABELS,
  type OrderAction,
  type OrderStatus,
} from '@repo/types'
import { useToast } from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'

/** The three fields an action needs, taken from the generated `Order`. */
export type ActionableOrder = Pick<Order, 'id' | 'orderNumber' | 'status'>

/**
 * The buttons come from the same transition map the server enforces, so the UI
 * cannot offer an action the API will refuse.
 */
export function useOrderActions(order: ActionableOrder | undefined) {
  const toast = useToast()
  const queryClient = useQueryClient()

  const onSuccess = (response: { data: unknown }) => {
    const next = response.data as { orderNumber: number; status: OrderStatus }
    queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() })
    if (order) queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(order.id) })
    toast.show(`Order #${next.orderNumber} is now ${ORDER_STATUS_LABELS[next.status]}`, 'success')
  }

  const onError = (error: unknown) => {
    // Two staff working the same board will hit this. Refreshing and saying so
    // calmly is the correct behaviour, not a red error.
    if (error instanceof ApiError && error.code === 'INVALID_TRANSITION') {
      toast.show('This order has already moved on — refreshing', 'warning')
      if (order) queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(order.id) })
      return
    }
    toast.show(error instanceof ApiError ? error.message : 'Something went wrong', 'danger')
  }

  const mutation = { onSuccess, onError }

  const accept = useAcceptOrder({ mutation })
  const startPreparing = useStartPreparingOrder({ mutation })
  const markReady = useMarkOrderReady({ mutation })
  const complete = useCompleteOrder({ mutation })
  const cancel = useCancelOrder({ mutation })

  const availableActions: OrderAction[] = order ? getAvailableActions(order.status) : []

  const isPending =
    accept.isPending ||
    startPreparing.isPending ||
    markReady.isPending ||
    complete.isPending ||
    cancel.isPending

  const perform = (action: OrderAction, reason?: string) => {
    if (!order) return
    const id = order.id
    switch (action) {
      case 'accept':
        return accept.mutate({ id })
      case 'startPreparing':
        return startPreparing.mutate({ id })
      case 'markReady':
        return markReady.mutate({ id })
      case 'complete':
        return complete.mutate({ id })
      case 'cancel':
        return cancel.mutate({ id, data: { reason: reason ?? '' } })
    }
  }

  return { availableActions, perform, isPending }
}
