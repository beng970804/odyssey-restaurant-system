import type { MenuItemWithCategory } from '@repo/api-client'
import { Button, Stack } from '@repo/ui'
import { useState } from 'react'
import { PageHeader } from '../../../src/components/PageHeader'
import { ArchiveItemModal } from '../../../src/features/menu/ArchiveItemModal'
import { CategoryFilter } from '../../../src/features/menu/CategoryFilter'
import { MenuItemFormModal, type EditableItem } from '../../../src/features/menu/MenuItemFormModal'
import { MenuItemTable } from '../../../src/features/menu/MenuItemTable'
import { useMenuItems } from '../../../src/features/menu/useMenuItems'
import { useCurrency } from '../../../src/hooks/useCurrency'

export default function MenuScreen() {
  const [editing, setEditing] = useState<EditableItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [archiving, setArchiving] = useState<MenuItemWithCategory | null>(null)

  const currency = useCurrency()
  const {
    category,
    setCategory,
    categories,
    items,
    isLoading,
    refreshing,
    error,
    refetch,
    toggleAvailability,
  } = useMenuItems()

  return (
    <>
      <PageHeader
        title="Menu"
        description="What the kitchen is selling today."
        actions={<Button onPress={() => setCreating(true)}>Add item</Button>}
      />

      <Stack gap="lg">
        <CategoryFilter categories={categories} value={category} onChange={setCategory} />

        <MenuItemTable
          items={items}
          loading={isLoading}
          refreshing={refreshing}
          error={error}
          onRetry={refetch}
          onToggleAvailability={toggleAvailability}
          onEdit={setEditing}
          onArchive={setArchiving}
          currency={currency}
        />
      </Stack>

      <MenuItemFormModal open={creating} item={null} onClose={() => setCreating(false)} />
      <MenuItemFormModal open={Boolean(editing)} item={editing} onClose={() => setEditing(null)} />
      <ArchiveItemModal item={archiving} onClose={() => setArchiving(null)} />
    </>
  )
}
