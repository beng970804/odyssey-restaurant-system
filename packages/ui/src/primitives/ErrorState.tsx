import { useTheme } from '../theme/ThemeProvider'
import { Button } from './Button'
import { Stack } from './Stack'
import { Text } from './Text'

export type ErrorStateProps = {
  error: Error | { message: string }
  onRetry?: () => void
  title?: string
}

/**
 * Every failure surfaces the same way. The message comes from the API's error
 * envelope, so the user reads "Ordering is currently unavailable for delivery"
 * rather than a status code.
 */
export function ErrorState({ error, onRetry, title = 'Something went wrong' }: ErrorStateProps) {
  const theme = useTheme()

  return (
    <Stack gap="sm" align="center" style={{ paddingVertical: theme.space['3xl'] }}>
      <Text variant="h3" style={{ color: theme.color.status.danger.fg }}>
        {title}
      </Text>
      <Text variant="body" color="muted" align="center">
        {error.message}
      </Text>
      {onRetry ? (
        <Button variant="secondary" size="sm" onPress={onRetry}>
          Try again
        </Button>
      ) : null}
    </Stack>
  )
}
