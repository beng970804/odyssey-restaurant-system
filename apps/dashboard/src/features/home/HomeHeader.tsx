import { Inline, Stack, Text, useTheme } from '@repo/ui'
import { useCallback } from 'react'
import { ACCOUNT, lastName } from '../../account'
import { NavToggle } from '../../components/NavToggle'
import { useNow } from '../../hooks/useNow'

/**
 * Home's own header, not a variant of the shared PageHeader — only one screen
 * greets you, and a one-caller variant on a component every other screen uses
 * would be an abstraction paying for itself nowhere.
 *
 * The greeting names the same account the sidebar shows, by family name: it is
 * how the pass addresses you mid-service, and it keeps the line short enough to
 * stay on one row beside the drawer toggle.
 */

export function HomeHeader({ timezone }: { timezone: string }) {
  const theme = useTheme()

  // Formatted inside the tick so the date rolls over at midnight too, rather
  // than showing yesterday for the whole of the night shift.
  const format = useCallback((now: number) => formatClock(now, timezone), [timezone])
  const clock = useNow(format)

  return (
    <Inline gap="md" align="center" style={{ marginBottom: theme.space.xl }}>
      <NavToggle />
      <Stack gap="xs">
        <Text variant="display">{`Welcome back, ${lastName(ACCOUNT.name)} 👋`}</Text>
        <Text variant="body" color="muted">
          {clock}
        </Text>
      </Stack>
    </Inline>
  )
}

/** The restaurant's clock, never the server's — a Worker runs in UTC. */
function formatClock(now: number, timeZone: string): string {
  const date = new Intl.DateTimeFormat('en-SG', {
    timeZone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)

  const time = new Intl.DateTimeFormat('en-SG', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)

  return `${date} – ${time}`
}
