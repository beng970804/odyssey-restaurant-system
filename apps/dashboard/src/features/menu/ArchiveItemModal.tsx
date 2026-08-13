import { getListMenuItemsQueryKey, useArchiveMenuItem } from '@repo/api-client'
import { Button, Modal, Text, useToast } from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'

/** ADR 0001, surfaced to the user rather than left as a surprise. */
export function ArchiveItemModal({
  item,
  onClose,
}: {
  item: { id: string; name: string } | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const toast = useToast()

  const archive = useArchiveMenuItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() })
        toast.show('Item archived', 'success')
        onClose()
      },
      onError: () => toast.show('Could not archive the item', 'danger'),
    },
  })

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title={`Archive ${item?.name ?? ''}`}
      footer={
        <>
          <Button variant="secondary" onPress={onClose}>
            Keep on menu
          </Button>
          <Button
            variant="danger"
            loading={archive.isPending}
            onPress={() => item && archive.mutate({ id: item.id })}
          >
            Archive
          </Button>
        </>
      }
    >
      <Text color="muted">
        Archiving hides the item from the menu and from new orders. It is kept, not deleted, so past
        orders still show what was actually sold.
      </Text>
    </Modal>
  )
}
