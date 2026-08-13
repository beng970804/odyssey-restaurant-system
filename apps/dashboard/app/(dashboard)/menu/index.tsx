import { unwrap, useGetSettings, useListCategories, useListMenuItems } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { Button, Inline, Stack, Switch, Table, Tabs, Text, type Column } from '@repo/ui'
import { useState } from 'react'
import { PageHeader } from '../../../src/components/PageHeader'
import { ArchiveItemModal } from '../../../src/features/menu/ArchiveItemModal'
import { MenuItemFormModal, type EditableItem } from '../../../src/features/menu/MenuItemFormModal'
import { useToggleAvailability } from '../../../src/features/menu/useToggleAvailability'

type MenuRow = EditableItem & { categoryName: string }

export default function MenuScreen() {
  const [category, setCategory] = useState('all')
  const [editing, setEditing] = useState<EditableItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [archiving, setArchiving] = useState<{ id: string; name: string } | null>(null)

  const categories = unwrap(useListCategories().data)
  const currency = unwrap(useGetSettings().data)?.currency ?? 'SGD'
  const { data, isLoading, error, refetch } = useListMenuItems({
    ...(category !== 'all' && { categoryId: category }),
    pageSize: 100,
  })
  const toggle = useToggleAvailability()

  const rows = (unwrap(data)?.data ?? []) as MenuRow[]

  const columns: Column<MenuRow>[] = [
    { key: 'name', header: 'Item', render: (row) => <Text variant="bodyStrong">{row.name}</Text> },
    {
      key: 'category',
      header: 'Category',
      width: 160,
      render: (row) => <Text color="muted">{row.categoryName}</Text>,
    },
    {
      key: 'price',
      header: 'Price',
      width: 110,
      align: 'right',
      render: (row) => <Text>{formatMoney(row.priceCents, currency)}</Text>,
    },
    {
      key: 'available',
      header: 'Available',
      width: 120,
      render: (row) => (
        <Switch
          value={row.isAvailable}
          label={`${row.name} available`}
          onValueChange={(isAvailable) => toggle.mutate({ id: row.id, data: { isAvailable } })}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 170,
      render: (row) => (
        <Inline gap="xs">
          <Button variant="ghost" size="sm" onPress={() => setEditing(row)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onPress={() => setArchiving(row)}>
            Archive
          </Button>
        </Inline>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Menu"
        description="What the kitchen is selling today."
        actions={<Button onPress={() => setCreating(true)}>Add item</Button>}
      />

      <Stack gap="lg">
        <Tabs
          tabs={[
            { value: 'all', label: 'All' },
            ...(categories?.data ?? []).map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={category}
          onChange={setCategory}
        />

        <Table
          columns={columns}
          data={rows}
          keyExtractor={(row) => row.id}
          loading={isLoading}
          error={error as unknown as Error | null}
          onRetry={refetch}
        />
      </Stack>

      <MenuItemFormModal open={creating} item={null} onClose={() => setCreating(false)} />
      <MenuItemFormModal open={Boolean(editing)} item={editing} onClose={() => setEditing(null)} />
      <ArchiveItemModal item={archiving} onClose={() => setArchiving(null)} />
    </>
  )
}
