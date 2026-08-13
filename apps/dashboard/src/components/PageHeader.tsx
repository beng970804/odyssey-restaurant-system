import { Inline, Stack, Text, useTheme } from '@repo/ui'
import type { ReactNode } from 'react'

export type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const theme = useTheme()

  return (
    <Inline justify="space-between" align="flex-start" style={{ marginBottom: theme.space.xl }}>
      <Stack gap="xs">
        <Text variant="h1">{title}</Text>
        {description ? (
          <Text variant="body" color="muted">
            {description}
          </Text>
        ) : null}
      </Stack>
      {actions ? <Inline gap="sm">{actions}</Inline> : null}
    </Inline>
  )
}
