import { Inline, Stack, Text, useBreakpoint, useTheme } from '@repo/ui'
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
  const { isCompact } = useBreakpoint()

  // Formatted inside the tick so the date rolls over at midnight too, rather
  // than showing yesterday for the whole of the night shift.
  const format = useCallback((now: number) => formatClock(now, timezone), [timezone])
  const clock = useNow(format)

  return (
    <Inline
      gap="md"
      align="center"
      style={{ marginBottom: isCompact ? theme.space.lg : theme.space.xl }}
    >
      <NavToggle />
      {/* The column that gives. A row child does not shrink by default under
          React Native, so at display size the greeting ran off the right edge
          of the phone rather than wrapping inside it. */}
      <Stack gap="xs" flex={1}>
        <Text variant={isCompact ? 'h1' : 'display'}>
          {`Welcome back, ${lastName(ACCOUNT.name)} 👋`}
        </Text>
        <Text variant="body" color="muted">
          {clock}
        </Text>
      </Stack>
    </Inline>
  )
}

/**
 * Built once per timezone and kept.
 *
 * `Intl.DateTimeFormat` is expensive to construct and cheap to reuse, and this
 * runs on every tick of a one-second clock — two new formatters a second, for
 * a string that changes once a minute. Constructing them per call is what made
 * the midnight-rollover test, which advances fourteen hours, run for longer
 * than its timeout.
 */
const CLOCK_FORMATS = new Map<string, { date: Intl.DateTimeFormat; time: Intl.DateTimeFormat }>()

function clockFormats(timeZone: string) {
  const cached = CLOCK_FORMATS.get(timeZone)
  if (cached) return cached

  const built = {
    date: new Intl.DateTimeFormat('en-SG', {
      timeZone,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    time: new Intl.DateTimeFormat('en-SG', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  }
  CLOCK_FORMATS.set(timeZone, built)
  return built
}

/** The restaurant's clock, never the server's — a Worker runs in UTC. */
function formatClock(now: number, timeZone: string): string {
  const { date, time } = clockFormats(timeZone)
  return `${date.format(now)} – ${time.format(now)}`
}
