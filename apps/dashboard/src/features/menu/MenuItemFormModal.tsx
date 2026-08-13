import {
  getListMenuItemsQueryKey,
  unwrap,
  useCreateMenuItem,
  useListCategories,
  useUpdateMenuItem,
  type MenuItem,
} from '@repo/api-client'
import { Button, Field, Input, Modal, Select, Switch, useToast } from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

/**
 * Derived from the generated `MenuItem`, not redeclared: the form edits the
 * fields the API accepts, and a renamed column breaks the build here.
 */
export type EditableItem = Pick<
  MenuItem,
  'id' | 'name' | 'categoryId' | 'description' | 'priceCents' | 'isAvailable'
>

/**
 * One component for create and edit. A create form and an edit form that start
 * as copies are how the two drift apart.
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

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)

  useEffect(() => {
    setName(item?.name ?? '')
    setCategoryId(item?.categoryId ?? null)
    // Cents in the model, dollars at the boundary — the one place it converts.
    setPrice(item ? (item.priceCents / 100).toFixed(2) : '')
    setDescription(item?.description ?? '')
    setIsAvailable(item?.isAvailable ?? true)
  }, [item, open])

  const settled = () => {
    queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() })
    toast.show(item ? 'Item updated' : 'Item created', 'success')
    onClose()
  }

  const create = useCreateMenuItem({ mutation: { onSuccess: settled } })
  const update = useUpdateMenuItem({ mutation: { onSuccess: settled } })

  const priceCents = Math.round(Number(price) * 100)
  const isValid =
    name.trim().length > 0 && categoryId !== null && Number.isFinite(priceCents) && priceCents >= 0

  const submit = () => {
    if (!categoryId) return
    const data = {
      name: name.trim(),
      categoryId,
      description: description.trim() || null,
      priceCents,
      isAvailable,
    }
    if (item) update.mutate({ id: item.id, data })
    else create.mutate({ data })
  }

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
            onPress={submit}
            disabled={!isValid}
            loading={create.isPending || update.isPending}
          >
            {item ? 'Save changes' : 'Create item'}
          </Button>
        </>
      }
    >
      <Field label="Name" required>
        <Input value={name} onChangeText={setName} placeholder="Nasi Lemak" />
      </Field>
      <Field label="Category" required>
        <Select
          options={(categories?.data ?? []).map((category) => ({
            value: category.id,
            label: category.name,
          }))}
          value={categoryId}
          onChange={setCategoryId}
          placeholder="Choose a category"
        />
      </Field>
      <Field label="Price" required hint="In dollars — stored as cents">
        <Input
          value={price}
          onChangeText={setPrice}
          placeholder="8.50"
          keyboardType="decimal-pad"
        />
      </Field>
      <Field label="Description">
        <Input
          value={description}
          onChangeText={setDescription}
          placeholder="Coconut rice, sambal, egg"
        />
      </Field>
      <Switch value={isAvailable} onValueChange={setIsAvailable} label="Available to order" />
    </Modal>
  )
}
