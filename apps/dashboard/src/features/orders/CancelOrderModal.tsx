import { Button, Field, Modal, Text, Textarea } from '@repo/ui'
import { useState } from 'react'

/** The API demands a reason, so the UI collects one rather than guessing. */
export function CancelOrderModal({
  open,
  orderNumber,
  onClose,
  onConfirm,
}: {
  open: boolean
  orderNumber: number
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Cancel order #${orderNumber}`}
      footer={
        <>
          <Button variant="secondary" onPress={onClose}>
            Keep order
          </Button>
          <Button
            variant="danger"
            disabled={reason.trim().length === 0}
            onPress={() => {
              onConfirm(reason.trim())
              setReason('')
            }}
          >
            Cancel order
          </Button>
        </>
      }
    >
      <Text color="muted">Cancelling is permanent — a cancelled order cannot be reopened.</Text>
      <Field label="Reason" required hint="Shown on the order for the rest of its life.">
        <Textarea value={reason} onChangeText={setReason} placeholder="Kitchen closed early" />
      </Field>
    </Modal>
  )
}
