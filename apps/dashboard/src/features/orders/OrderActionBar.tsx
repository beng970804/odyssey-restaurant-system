import { ORDER_ACTION_LABELS, type OrderAction } from '@repo/types'
import { Button, Inline, Text } from '@repo/ui'
import { useState } from 'react'
import { CancelOrderModal } from './CancelOrderModal'
import { useOrderActions, type ActionableOrder } from './useOrderActions'

/**
 * Invalid actions are absent, not disabled: a disabled button invites the user
 * to wonder what they did wrong (spec §7.2).
 */
export function OrderActionBar({ order }: { order: ActionableOrder }) {
  const { availableActions, perform, isPending } = useOrderActions(order)
  const [cancelling, setCancelling] = useState(false)

  if (availableActions.length === 0) {
    return (
      <Text variant="caption" color="muted">
        This order is complete. There is nothing left to do.
      </Text>
    )
  }

  return (
    <>
      <Inline gap="sm" wrap>
        {availableActions.map((action: OrderAction) => (
          <Button
            key={action}
            variant={action === 'cancel' ? 'secondary' : 'primary'}
            loading={isPending}
            onPress={() => (action === 'cancel' ? setCancelling(true) : perform(action))}
          >
            {ORDER_ACTION_LABELS[action]}
          </Button>
        ))}
      </Inline>

      <CancelOrderModal
        open={cancelling}
        orderNumber={order.orderNumber}
        onClose={() => setCancelling(false)}
        onConfirm={(reason) => {
          perform('cancel', reason)
          setCancelling(false)
        }}
      />
    </>
  )
}
