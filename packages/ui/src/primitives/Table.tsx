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
import { Pressable, ScrollView, View, type ViewStyle } from 'react-native'
import { focusRingStyle } from '../hooks/useFocusRing'
import { useInteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { overlayTransition } from './Overlay'
import { Skeleton } from './Skeleton'
import { Text } from './Text'

/**
 * Rows are objects. Stated because TanStack Table's row model needs to know it,
 * and every caller already passes a generated record type.
 */
// oxlint-disable-next-line no-explicit-any -- an interface is assignable to
// Record<string, any> but not to Record<string, unknown>.
type Row = Record<string, any>

export type Align = 'left' | 'center' | 'right'

/** One mapping from column alignment to the row axis, shared by cell and header. */
const alignItems = (align: Align = 'left'): ViewStyle['alignItems'] =>
  align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start'

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  width?: number
  align?: Align
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

/**
 * `flex: 0` beside a `width` is a trap under React Native Web: it expands to
 * `flex: 0 1 0%`, and a zero basis beats the width sitting next to it, so every
 * fixed column collapsed to nothing and its text piled onto the neighbour's.
 * Spelling the three longhands out makes the basis *be* the width.
 */
const cellWidth = (width?: number): ViewStyle =>
  width === undefined
    ? { flexGrow: 1, flexShrink: 1, flexBasis: '0%' }
    : { width, flexGrow: 0, flexShrink: 0, flexBasis: width }

export type TableProps<T extends Row> = {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  loading?: boolean
  /**
   * A refetch running under rows worth keeping — a filter or page change with
   * the old page still in hand. Dims the body rather than blanking it: the
   * skeleton is for the first load, when there is genuinely nothing to show.
   */
  refreshing?: boolean
  error?: Error | null
  onRetry?: () => void
  emptyState?: ReactNode
  onRowPress?: (row: T) => void
  defaultSort?: { key: string; desc: boolean }
}

/** How far the kept rows recede while their replacements are fetched. */
const REFRESH_DIM = 0.6

const REFRESH_DIM_MS = 150

/**
 * Only the properties the dim actually sets, not the whole of `ViewStyle` —
 * consumers in other packages type against their own copy of react-native, and
 * two copies' `ViewStyle`s are not assignable to each other (see `FocusRing`).
 * The transition strings are web-only and ignored on native, like the overlay's.
 */
export type RefreshingStyle = {
  opacity: number
  transitionProperty?: string
  transitionDuration?: string
  transitionTimingFunction?: string
}

/**
 * Shared with the compact lists, which are the same tables in their phone form:
 * one answer to "what does a list look like mid-refetch", wherever it renders.
 */
export const refreshingStyle = (refreshing: boolean): RefreshingStyle => ({
  opacity: refreshing ? REFRESH_DIM : 1,
  ...(overlayTransition('opacity', REFRESH_DIM_MS) as Omit<RefreshingStyle, 'opacity'>),
})

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
  refreshing = false,
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
            columnGap: theme.space.lg,
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

        <View testID="table-body" aria-busy={refreshing} style={refreshingStyle(refreshing)}>
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
  align?: Align
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
    return <View style={cellWidth(width)}>{caption}</View>
  }

  return (
    <Pressable
      role="columnheader"
      accessibilityLabel={`Sort by ${label}`}
      focusable
      {...handlers}
      onPress={onPress}
      style={[cellWidth(width), { opacity: state.hovered ? 0.7 : 1 }, focusRingStyle(theme, state)]}
    >
      {caption}
    </Pressable>
  )
}

type Cell = { key: string; width?: number; align?: Align; content: ReactNode }

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
          columnGap: theme.space.lg,
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
          style={[cellWidth(cell.width), { alignItems: alignItems(cell.align) }]}
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
            <View key={column.key} style={cellWidth(column.width)}>
              <Skeleton height={14} />
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}
