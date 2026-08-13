import type { ReactNode } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { focusRingStyle } from '../hooks/useFocusRing'
import { useInteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { Skeleton } from './Skeleton'
import { Text } from './Text'

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  width?: number
  align?: 'left' | 'right'
}

export type TableProps<T> = {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  loading?: boolean
  error?: Error | null
  onRetry?: () => void
  emptyState?: ReactNode
  onRowPress?: (row: T) => void
}

/**
 * The highest-leverage primitive in the app: loading, error, empty and loaded
 * all live here, so no list screen writes a single state conditional.
 */
export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  error = null,
  onRetry,
  emptyState,
  onRowPress,
}: TableProps<T>) {
  const theme = useTheme()

  // Loading wins over empty: a slow list must never flash "nothing here".
  if (loading) return <TableSkeleton columns={columns} rows={6} />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (data.length === 0) return <>{emptyState ?? <EmptyState title="Nothing here yet" />}</>

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
          {columns.map((column) => (
            <View key={column.key} style={{ width: column.width, flex: column.width ? 0 : 1 }}>
              <Text variant="caption" color="secondary" align={column.align}>
                {column.header}
              </Text>
            </View>
          ))}
        </View>

        {data.map((row) => (
          <TableRow
            key={keyExtractor(row)}
            columns={columns}
            row={row}
            onPress={onRowPress ? () => onRowPress(row) : undefined}
          />
        ))}
      </View>
    </ScrollView>
  )
}

function TableRow<T>({
  columns,
  row,
  onPress,
}: {
  columns: Column<T>[]
  row: T
  onPress?: () => void
}) {
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
      {columns.map((column) => (
        <View
          key={column.key}
          style={{
            width: column.width,
            flex: column.width ? 0 : 1,
            alignItems: column.align === 'right' ? 'flex-end' : 'flex-start',
          }}
        >
          {column.render(row)}
        </View>
      ))}
    </Pressable>
  )
}

/** Skeleton cells in the real column widths, so nothing shifts on arrival. */
function TableSkeleton<T>({ columns, rows }: { columns: Column<T>[]; rows: number }) {
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
