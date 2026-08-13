import { Stack, Text, useTheme } from '@repo/ui'

/**
 * Home's own header, not a variant of the shared PageHeader — only one screen
 * greets you, and a one-caller variant on a component every other screen uses
 * would be an abstraction paying for itself nowhere.
 *
 * It greets without a name because there is no auth in this product and no
 * operator record to read one from. "Last updated" is the fetch time rather
 * than a wall clock: it answers "how stale is this board", which is the
 * question an operations screen is actually asked.
 */
export function HomeHeader({ updatedAt, timezone }: { updatedAt: number; timezone: string }) {
  const theme = useTheme()

  return (
    <Stack gap="xs" style={{ marginBottom: theme.space.xl }}>
      <Text variant="display">Welcome back 👋</Text>
      {updatedAt > 0 ? (
        <Text variant="body" color="muted">
          {`Last updated, ${formatUpdatedAt(updatedAt, timezone)}`}
        </Text>
      ) : null}
    </Stack>
  )
}

/** The restaurant's clock, never the server's — a Worker runs in UTC. */
function formatUpdatedAt(updatedAt: number, timeZone: string): string {
  const date = new Intl.DateTimeFormat('en-SG', {
    timeZone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(updatedAt)

  const time = new Intl.DateTimeFormat('en-SG', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(updatedAt)

  return `${date} – ${time}`
}
