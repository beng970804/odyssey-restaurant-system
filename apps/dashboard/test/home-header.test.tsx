import { ThemeProvider } from '@repo/ui'
import { act, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NavToggleProvider } from '../src/components/NavToggle'
import { HomeHeader } from '../src/features/home/HomeHeader'

const wrap = (ui: ReactElement) =>
  render(
    <ThemeProvider>
      <NavToggleProvider open onOpenChange={vi.fn()}>
        {ui}
      </NavToggleProvider>
    </ThemeProvider>,
  )

/** 2026-08-14T02:30:00Z — 10:30 in Singapore, 22:30 the previous day in New York. */
const START = Date.parse('2026-08-14T02:30:00Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
})

afterEach(() => vi.useRealTimers())

describe('HomeHeader', () => {
  it('greets by name', () => {
    wrap(<HomeHeader timezone="Asia/Singapore" />)
    expect(screen.getByText(/Welcome back, /)).toBeTruthy()
  })

  it('reads the clock from the restaurant timezone, never the server', () => {
    // A Worker runs in UTC and the restaurant does not. The same instant has to
    // render as two different local times.
    const { unmount } = wrap(<HomeHeader timezone="Asia/Singapore" />)
    expect(screen.getByText(/14 August 2026/)).toBeTruthy()
    expect(screen.getByText(/10:30/)).toBeTruthy()
    unmount()

    wrap(<HomeHeader timezone="America/New_York" />)
    expect(screen.getByText(/13 August 2026/)).toBeTruthy()
    expect(screen.getByText(/22:30/)).toBeTruthy()
  })

  it('keeps running rather than freezing at first render', () => {
    wrap(<HomeHeader timezone="Asia/Singapore" />)
    expect(screen.getByText(/10:30/)).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByText(/10:31/)).toBeTruthy()
    expect(screen.queryByText(/10:30/)).toBeNull()
  })

  it('rolls the date over at midnight', () => {
    // Formatting the date once and only ticking the time would show yesterday's
    // date for the whole of the night shift.
    wrap(<HomeHeader timezone="Asia/Singapore" />)

    act(() => {
      vi.advanceTimersByTime(14 * 60 * 60 * 1000)
    })

    expect(screen.getByText(/15 August 2026/)).toBeTruthy()
  })

  it('carries the navigation toggle on its own row', () => {
    // The toggle belongs beside the greeting rather than stacked above it.
    wrap(<HomeHeader timezone="Asia/Singapore" />)
    expect(screen.getByTestId('nav-drawer-toggle')).toBeTruthy()
  })
})
