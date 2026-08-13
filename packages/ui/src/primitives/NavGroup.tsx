import type { ReactNode } from 'react'
import { useTheme } from '../theme/ThemeProvider'
import { Stack } from './Stack'
import { Text } from './Text'

export type NavGroupProps = {
  title?: string
  children: ReactNode
  collapsed?: boolean
}

export function NavGroup({ title, children, collapsed = false }: NavGroupProps) {
  const theme = useTheme()

  return (
    <Stack gap="xs">
      {title && !collapsed ? (
        <Text
          variant="caption"
          color="muted"
          style={{ paddingHorizontal: theme.space.md, letterSpacing: 0.6 }}
        >
          {title.toUpperCase()}
        </Text>
      ) : null}
      {children}
    </Stack>
  )
}
