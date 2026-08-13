import { useTheme } from '../theme/ThemeProvider'
import { Button } from './Button'
import { Inline } from './Inline'
import { Text } from './Text'

export type PaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const theme = useTheme()
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <Inline justify="space-between" style={{ paddingVertical: theme.space.md }}>
      <Text variant="caption" color="muted">
        {`${first}–${last} of ${total}`}
      </Text>
      <Inline gap="sm">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onPress={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= lastPage}
          onPress={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </Inline>
    </Inline>
  )
}
