import { Inline, Stack, Text, useTheme } from '@repo/ui'
import type { ReactNode } from 'react'
import { NavToggle } from './NavToggle'

export type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const theme = useTheme()

  return (
    <Inline justify="space-between" align="center" style={{ marginBottom: theme.space.xl }}>
      {/* The drawer toggle rides the header row rather than sitting above it,
          so every screen opens with one band of chrome instead of two. */}
      {/* The column that gives. A row child does not shrink by default under
          React Native, so on a phone a long description pushed the actions off
          the right edge rather than wrapping beside them. */}
      <Inline gap="md" align="center" flex={1}>
        <NavToggle />
        <Stack gap="xs" style={{ flexShrink: 1 }}>
          <Text variant="h1">{title}</Text>
          {description ? (
            <Text variant="body" color="muted">
              {description}
            </Text>
          ) : null}
        </Stack>
      </Inline>
      {actions ? <Inline gap="sm">{actions}</Inline> : null}
    </Inline>
  )
}
