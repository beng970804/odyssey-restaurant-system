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
      // Flexible rather than fixed: sharing the slack with the name column puts
      // the category beside the item it belongs to instead of a screen away.
      key: 'category',
      header: 'Category',
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
      // The row already says which item this is, so the switch is named for
      // screen readers only — printing "Ngoh Hiang available" beside it both
      // repeats the row and wraps to three lines.
      key: 'available',
      header: 'Available',
      width: 110,
      align: 'center',
      render: (row) => (
        <Switch
          value={row.isAvailable}
          accessibilityLabel={`${row.name} available`}
          onValueChange={(isAvailable) => onToggleAvailability(row, isAvailable)}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 150,
      align: 'right',
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
