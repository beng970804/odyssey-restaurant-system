import type { ReactNode } from 'react'
import { useTheme } from '../theme/ThemeProvider'
import { Stack } from './Stack'
import { Text } from './Text'

export type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  const theme = useTheme()

  return (
    <Stack gap="sm" align="center" style={{ paddingVertical: theme.space['3xl'] }}>
      <Text variant="h3">{title}</Text>
      {description ? (
        <Text variant="body" color="muted" align="center">
          {description}
        </Text>
      ) : null}
      {action}
    </Stack>
  )
}
