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
  type OrderRow,
} from '@repo/api-client'
import {
  getAvailableActions,
  ORDER_STATUS_LABELS,
  resolveTransition,
  type OrderAction,
  type OrderStatus,
} from '@repo/types'
import { useToast } from '@repo/ui'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'

/** The three fields an action needs, taken from the generated `Order`. */
export type ActionableOrder = Pick<Order, 'id' | 'orderNumber' | 'status'>

/** What the caches hold: Orval's `{ status, data }` envelope around each body. */
type ListEnvelope = { status: number; data: { data: OrderRow[]; meta: unknown } }
type DetailEnvelope = { status: number; data: { status: OrderStatus } }

/** Everything the optimistic write touched, exactly as it was. */
type Snapshot = { key: QueryKey; data: unknown }[]

/**
 * The buttons come from the same transition map the server enforces, so the UI
 * cannot offer an action the API will refuse.
 *
 * Actions land optimistically. The pass acts on an order and looks straight
 * back at the board, so the cached lists and the open drawer move to the new
 * status before the server answers; success reconciles with the server's copy,
 * and failure puts the snapshot back. The transition map makes this safe — the
 * next status is knowledge the client already has, not a guess.
 */
export function useOrderActions(order: ActionableOrder | undefined) {
  const toast = useToast()
  const queryClient = useQueryClient()

  const onMutate = (action: OrderAction) => async (): Promise<{ snapshot: Snapshot }> => {
    if (!order) return { snapshot: [] }
    const next = resolveTransition(order.status, action)
    if (next === null) return { snapshot: [] }

    const listKey = getListOrdersQueryKey()
    const detailKey = getGetOrderQueryKey(order.id)
    // In-flight refetches would overwrite the optimistic write with stale data.
    await queryClient.cancelQueries({ queryKey: listKey })
    await queryClient.cancelQueries({ queryKey: detailKey })

    const snapshot: Snapshot = [
      ...queryClient.getQueriesData({ queryKey: listKey }),
      ...queryClient.getQueriesData({ queryKey: detailKey }),
    ].map(([key, data]) => ({ key, data }))

    // Every cached page of every filter, since any of them may hold the row.
    queryClient.setQueriesData({ queryKey: listKey }, (cached: ListEnvelope | undefined) =>
      cached?.status === 200
        ? {
            ...cached,
            data: {
              ...cached.data,
              data: cached.data.data.map((cachedRow) =>
                cachedRow.id === order.id ? { ...cachedRow, status: next } : cachedRow,
              ),
            },
          }
        : cached,
    )
    queryClient.setQueryData(detailKey, (cached: DetailEnvelope | undefined) =>
      cached?.status === 200 ? { ...cached, data: { ...cached.data, status: next } } : cached,
    )

    return { snapshot }
  }

  const onSuccess = (response: { data: unknown }) => {
    const next = response.data as { orderNumber: number; status: OrderStatus }
    queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() })
    if (order) queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(order.id) })
    toast.show(`Order #${next.orderNumber} is now ${ORDER_STATUS_LABELS[next.status]}`, 'success')
  }

  const onError = (error: unknown, _variables: unknown, context?: { snapshot: Snapshot }) => {
    // The optimistic write is undone before anything is said about why.
    for (const { key, data } of context?.snapshot ?? []) {
      queryClient.setQueryData(key, data)
    }
    // Two staff working the same board will hit this. Refreshing and saying so
    // calmly is the correct behaviour, not a red error.
    if (error instanceof ApiError && error.code === 'INVALID_TRANSITION') {
      toast.show('This order has already moved on — refreshing', 'warning')
      if (order) queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(order.id) })
      return
    }
    toast.show(error instanceof ApiError ? error.message : 'Something went wrong', 'danger')
  }

  const mutationFor = (action: OrderAction) => ({
    mutation: { onMutate: onMutate(action), onSuccess, onError },
  })

  const accept = useAcceptOrder(mutationFor('accept'))
  const startPreparing = useStartPreparingOrder(mutationFor('startPreparing'))
  const markReady = useMarkOrderReady(mutationFor('markReady'))
  const complete = useCompleteOrder(mutationFor('complete'))
  const cancel = useCancelOrder(mutationFor('cancel'))

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
