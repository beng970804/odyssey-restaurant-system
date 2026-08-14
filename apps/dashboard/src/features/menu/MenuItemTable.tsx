import type { MenuItemWithCategory } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import {
  Button,
  EmptyState,
  ErrorState,
  Inline,
  Skeleton,
  Stack,
  Switch,
  Table,
  Text,
  useBreakpoint,
  useTheme,
  type Column,
} from '@repo/ui'
import { View } from 'react-native'

type MenuItemTableProps = {
  items: MenuItemWithCategory[]
  loading: boolean
  error: Error | null
  onRetry: () => void
  onToggleAvailability: (item: MenuItemWithCategory, isAvailable: boolean) => void
  onEdit: (item: MenuItemWithCategory) => void
  onArchive: (item: MenuItemWithCategory) => void
  currency: string
}

/**
 * The table reports intent — "this item, available or not" — and leaves the
 * mutation to the hook above it, so availability stays one code path.
 *
 * On a phone the five columns render as a two-line list instead: sideways
 * scrolling hid the switch and the actions, which are the controls this screen
 * exists for. Decided here so the screen does not write the branch.
 */
export function MenuItemTable(props: MenuItemTableProps) {
  const { isCompact } = useBreakpoint()
  return isCompact ? <MenuItemListCompact {...props} /> : <MenuItemTableWide {...props} />
}

function MenuItemTableWide({
  items,
  loading,
  error,
  onRetry,
  onToggleAvailability,
  onEdit,
  onArchive,
  currency,
}: MenuItemTableProps) {
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

/** The table's phone form: one item per row, two lines, same states. */
function MenuItemListCompact({
  items,
  loading,
  error,
  onRetry,
  onToggleAvailability,
  onEdit,
  onArchive,
  currency,
}: MenuItemTableProps) {
  const theme = useTheme()

  if (loading) return <MenuItemListSkeleton />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (items.length === 0) return <EmptyState title="Nothing here yet" />

  return (
    <View>
      {items.map((row) => (
        <Stack
          key={row.id}
          gap="xs"
          style={{
            paddingVertical: theme.space.md,
            borderBottomWidth: theme.borderWidth.thin,
            borderColor: theme.color.border.subtle,
          }}
        >
          <Inline justify="space-between" gap="md">
            <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
              {row.name}
            </Text>
            <Text variant="bodyStrong">{formatMoney(row.priceCents, currency)}</Text>
          </Inline>
          <Inline justify="space-between" gap="md">
            <Text variant="caption" color="muted" style={{ flexShrink: 1 }}>
              {row.categoryName}
            </Text>
            <Inline gap="xs">
              <Button variant="ghost" size="sm" onPress={() => onEdit(row)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" onPress={() => onArchive(row)}>
                Archive
              </Button>
              <Switch
                value={row.isAvailable}
                accessibilityLabel={`${row.name} available`}
                onValueChange={(isAvailable) => onToggleAvailability(row, isAvailable)}
              />
            </Inline>
          </Inline>
        </Stack>
      ))}
    </View>
  )
}

/** The loaded rows' shape, so nothing shifts when the menu arrives. */
function MenuItemListSkeleton() {
  const theme = useTheme()

  return (
    <View>
      {[0, 1, 2, 3].map((index) => (
        <Stack
          key={index}
          gap="xs"
          style={{
            paddingVertical: theme.space.md,
            borderBottomWidth: theme.borderWidth.thin,
            borderColor: theme.color.border.subtle,
          }}
        >
          <Inline justify="space-between">
            <Skeleton width={150} height={14} />
            <Skeleton width={60} height={14} />
          </Inline>
          <Inline justify="space-between">
            <Skeleton width={80} height={12} />
            <Skeleton width={160} height={24} />
          </Inline>
        </Stack>
      ))}
    </View>
  )
}
