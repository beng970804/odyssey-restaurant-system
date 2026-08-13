import type { MenuItemWithCategory } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { Button, Inline, Switch, Table, Text, type Column } from '@repo/ui'

/**
 * The table reports intent — "this item, available or not" — and leaves the
 * mutation to the hook above it, so availability stays one code path.
 */
export function MenuItemTable({
  items,
  loading,
  error,
  onRetry,
  onToggleAvailability,
  onEdit,
  onArchive,
  currency,
}: {
  items: MenuItemWithCategory[]
  loading: boolean
  error: Error | null
  onRetry: () => void
  onToggleAvailability: (item: MenuItemWithCategory, isAvailable: boolean) => void
  onEdit: (item: MenuItemWithCategory) => void
  onArchive: (item: MenuItemWithCategory) => void
  currency: string
}) {
  const columns: Column<MenuItemWithCategory>[] = [
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
          onValueChange={(isAvailable) => onToggleAvailability(row, isAvailable)}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 170,
      render: (row) => (
        <Inline gap="xs">
          <Button variant="ghost" size="sm" onPress={() => onEdit(row)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onPress={() => onArchive(row)}>
            Archive
          </Button>
        </Inline>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={items}
      keyExtractor={(row) => row.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
    />
  )
}
