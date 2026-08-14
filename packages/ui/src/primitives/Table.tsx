import {
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
  type SortingState,
} from '@tanstack/react-table'
import { useMemo, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { focusRingStyle } from '../hooks/useFocusRing'
import { useInteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { Skeleton } from './Skeleton'
import { Text } from './Text'

/**
 * Rows are objects. Stated because TanStack Table's row model needs to know it,
 * and every caller already passes a generated record type.
 */
// oxlint-disable-next-line no-explicit-any -- an interface is assignable to
// Record<string, any> but not to Record<string, unknown>.
type Row = Record<string, any>

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  width?: number
  align?: 'left' | 'right'
  /** Opt in per column: a header that cannot sort must not look like it can. */
  sortable?: boolean
  /**
   * The value to sort by, when it is not what the cell displays. A money column
   * renders "S$120.00" and sorts on 12000 — comparing the rendered strings puts
   * S$120.00 before S$30.00.
   */
  sortValue?: (row: T) => string | number
  /**
   * Which way the first press sorts. Left unset, a numeric column descends
   * first and a text column ascends first — "sort by lifetime spend" means
   * "who spends the most", and "sort by name" means A first.
   */
  sortDescFirst?: boolean
}

export type TableProps<T extends Row> = {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  loading?: boolean
  error?: Error | null
  onRetry?: () => void
  emptyState?: ReactNode
  onRowPress?: (row: T) => void
  defaultSort?: { key: string; desc: boolean }
}

/**
 * The highest-leverage primitive in the app: loading, error, empty and loaded
 * all live here, so no list screen writes a single state conditional.
 *
 * Row modelling is TanStack Table's — headless, so it contributes sorting and
 * nothing else. Every pixel is still this file's tokens, which is what keeps
 * the primitive renderer-agnostic enough to run under React Native Web.
 */
export function Table<T extends Row>({
  columns,
  data,
  keyExtractor,
  loading = false,
  error = null,
  onRetry,
  emptyState,
  onRowPress,
  defaultSort,
}: TableProps<T>) {
  const theme = useTheme()
  const [sorting, setSorting] = useState<SortingState>(
    defaultSort ? [{ id: defaultSort.key, desc: defaultSort.desc }] : [],
  )

  const tableColumns = useMemo(
    () =>
      columns.map((column) => ({
        id: column.key,
        header: column.header,
        enableSorting: column.sortable ?? false,
        ...(column.sortDescFirst === undefined ? {} : { sortDescFirst: column.sortDescFirst }),
        // `key` doubles as the field name when a column sorts on what it shows;
        // `sortValue` is for the columns where it does not.
        accessorFn: (row: T) => column.sortValue?.(row) ?? row[column.key],
      })),
    [columns],
  )

  // Sorting is the only feature opted into, and only the two comparators the
  // app's columns actually resolve to are registered: v9 ships nothing it is
  // not asked for, which is what keeps this primitive's bundle cost near zero.
  const table = useTable({
    features: tableFeatures({
      rowSortingFeature,
      sortedRowModel: createSortedRowModel(),
      sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
    }),
    data,
    columns: tableColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: (row: T) => keyExtractor(row),
  })

  // Loading wins over empty: a slow list must never flash "nothing here".
  if (loading) return <TableSkeleton columns={columns} rows={6} />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (data.length === 0) return <>{emptyState ?? <EmptyState title="Nothing here yet" />}</>

  const headers = table.getHeaderGroups()[0]?.headers ?? []

  return (
    <ScrollView horizontal contentContainerStyle={{ minWidth: '100%' }}>
      <View style={{ flex: 1, minWidth: '100%' }}>
        <View
          role="row"
          style={{
            flexDirection: 'row',
            paddingHorizontal: theme.space.lg,
            paddingVertical: theme.space.md,
            borderBottomWidth: theme.borderWidth.thin,
            borderColor: theme.color.border.default,
            backgroundColor: theme.color.bg.inset,
          }}
        >
          {headers.map((header, index) => {
            const column = columns[index]
            return (
              <HeaderCell
                key={header.id}
                label={column?.header ?? ''}
                width={column?.width}
                align={column?.align}
                sortable={header.column.getCanSort()}
                direction={header.column.getIsSorted()}
                onPress={header.column.getToggleSortingHandler()}
              />
            )
          })}
        </View>

        {table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            // Cells render straight from `Column.render`. TanStack Table is
            // here to model rows, not to own the markup — the moment it did,
            // this primitive would stop being renderer-agnostic.
            cells={columns.map((column) => ({
              key: column.key,
              width: column.width,
              align: column.align,
              content: column.render(row.original),
            }))}
            onPress={onRowPress ? () => onRowPress(row.original) : undefined}
          />
        ))}
      </View>
    </ScrollView>
  )
}

function HeaderCell({
  label,
  width,
  align,
  sortable,
  direction,
  onPress,
}: {
  label: string
  width?: number
  align?: 'left' | 'right'
  sortable: boolean
  direction: false | 'asc' | 'desc'
  onPress?: (event: unknown) => void
}) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()

  const caption = (
    <Text variant="caption" color={direction ? 'primary' : 'secondary'} align={align}>
      {label}
      {direction ? (direction === 'asc' ? ' ↑' : ' ↓') : ''}
    </Text>
  )

  if (!sortable) {
    return <View style={{ width, flex: width ? 0 : 1 }}>{caption}</View>
  }

  return (
    <Pressable
      role="columnheader"
      accessibilityLabel={`Sort by ${label}`}
      focusable
      {...handlers}
      onPress={onPress}
      style={[
        {
          width,
          flex: width ? 0 : 1,
          opacity: state.hovered ? 0.7 : 1,
        },
        focusRingStyle(theme, state),
      ]}
    >
      {caption}
    </Pressable>
  )
}

type Cell = { key: string; width?: number; align?: 'left' | 'right'; content: ReactNode }

function TableRow({ cells, onPress }: { cells: Cell[]; onPress?: () => void }) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()

  return (
    <Pressable
      role="row"
      focusable={Boolean(onPress)}
      disabled={!onPress}
      {...handlers}
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.space.lg,
          paddingVertical: theme.space.md,
          borderBottomWidth: theme.borderWidth.thin,
          borderColor: theme.color.border.subtle,
          backgroundColor: state.hovered && onPress ? theme.color.bg.inset : 'transparent',
        },
        focusRingStyle(theme, state),
      ]}
    >
      {cells.map((cell) => (
        <View
          key={cell.key}
          style={{
            width: cell.width,
            flex: cell.width ? 0 : 1,
            alignItems: cell.align === 'right' ? 'flex-end' : 'flex-start',
          }}
        >
          {cell.content}
        </View>
      ))}
    </Pressable>
  )
}

/** Skeleton cells in the real column widths, so nothing shifts on arrival. */
function TableSkeleton<T extends Row>({ columns, rows }: { columns: Column<T>[]; rows: number }) {
  const theme = useTheme()

  return (
    <View>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: 'row',
            gap: theme.space.lg,
            paddingHorizontal: theme.space.lg,
            paddingVertical: theme.space.md,
            borderBottomWidth: theme.borderWidth.thin,
            borderColor: theme.color.border.subtle,
          }}
        >
          {columns.map((column) => (
            <View key={column.key} style={{ width: column.width, flex: column.width ? 0 : 1 }}>
              <Skeleton height={14} />
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}
