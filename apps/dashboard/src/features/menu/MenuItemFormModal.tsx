import {
  getListMenuItemsQueryKey,
  unwrap,
  useCreateMenuItem,
  useListCategories,
  useUpdateMenuItem,
} from '@repo/api-client'
import { Button, Field, Input, Modal, Select, Switch, useToast } from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useMenuItemForm, type EditableItem, type MenuItemBody } from './useMenuItemForm'

export type { EditableItem }

/**
 * One component for create and edit. A create form and an edit form that start
 * as copies are how the two drift apart.
 *
 * Renders only: values, validation and the money boundary belong to
 * `useMenuItemForm`, and the request belongs to the generated mutations.
 */
export function MenuItemFormModal({
  open,
  item,
  onClose,
}: {
  open: boolean
  item: EditableItem | null
  onClose: () => void
}) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const categories = unwrap(useListCategories().data)

  const settled = () => {
    queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() })
    toast.show(item ? 'Item updated' : 'Item created', 'success')
    onClose()
  }

  const create = useCreateMenuItem({ mutation: { onSuccess: settled } })
  const update = useUpdateMenuItem({ mutation: { onSuccess: settled } })

  const submit = (body: MenuItemBody) =>
    item ? update.mutateAsync({ id: item.id, data: body }) : create.mutateAsync({ data: body })

  const { form, priceInput, setPriceInput, fieldErrors } = useMenuItemForm({
    item,
    onSubmit: submit,
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? `Edit ${item.name}` : 'New menu item'}
      footer={
        <>
          <Button variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          <Button
            onPress={() => form.handleSubmit()}
            loading={create.isPending || update.isPending}
          >
            {item ? 'Save changes' : 'Create item'}
          </Button>
        </>
      }
    >
      <form.Field name="name">
        {(field) => (
          <Field label="Name" required error={fieldErrors.name}>
            <Input
              value={field.state.value}
              onChangeText={field.handleChange}
              placeholder="Nasi Lemak"
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="categoryId">
        {(field) => (
          <Field label="Category" required error={fieldErrors.categoryId}>
            <Select
              options={(categories?.data ?? []).map((category) => ({
                value: category.id,
                label: category.name,
              }))}
              value={field.state.value || null}
              onChange={(value) => field.handleChange(value ?? '')}
              placeholder="Choose a category"
            />
          </Field>
        )}
      </form.Field>

      <Field
        label="Price"
        required
        hint="In dollars — stored as cents"
        error={fieldErrors.priceCents}
      >
        <Input
          value={priceInput}
          onChangeText={setPriceInput}
          placeholder="8.50"
          keyboardType="decimal-pad"
        />
      </Field>

      <form.Field name="description">
        {(field) => (
          <Field label="Description" error={fieldErrors.description}>
            <Input
              value={field.state.value ?? ''}
              onChangeText={field.handleChange}
              placeholder="Coconut rice, sambal, egg"
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="isAvailable">
        {(field) => (
          <Switch
            value={field.state.value ?? true}
            onValueChange={field.handleChange}
            label="Available to order"
          />
        )}
      </form.Field>
    </Modal>
  )
}
