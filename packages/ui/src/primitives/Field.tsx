import type { ReactNode } from 'react'
import { useTheme } from '../theme/ThemeProvider'
import { Stack } from './Stack'
import { Text } from './Text'

export type FieldProps = {
  children: ReactNode
  label?: string
  /** Shown only while there is no error — the two never stack. */
  hint?: string
  error?: string
  required?: boolean
}

/** The label/hint/error scaffolding, so no form screen lays this out by hand. */
export function Field({ children, label, hint, error, required }: FieldProps) {
  const theme = useTheme()

  return (
    <Stack gap="xs">
      {label ? (
        <Text variant="caption" color="secondary">
          {label}
          {required ? ' *' : ''}
        </Text>
      ) : null}
      {children}
      {error ? (
        <Text variant="caption" style={{ color: theme.color.status.danger.fg }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="muted">
          {hint}
        </Text>
      ) : null}
    </Stack>
  )
}
