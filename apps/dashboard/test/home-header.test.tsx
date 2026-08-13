import { ThemeProvider } from '@repo/ui'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { HomeHeader } from '../src/features/home/HomeHeader'

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

/** 2026-08-14T02:30:00Z — 10:30 in Singapore, 22:30 the previous day in New York. */
const UPDATED_AT = Date.parse('2026-08-14T02:30:00Z')

describe('HomeHeader', () => {
  it('greets without inventing a name', () => {
    // There is no auth in this product, so there is nobody to greet by name.
    // The header says what is true rather than hardcoding a person.
    wrap(<HomeHeader updatedAt={UPDATED_AT} timezone="Asia/Singapore" />)

    expect(screen.getByText(/Welcome back/)).toBeTruthy()
  })

  it('reads the clock from the restaurant timezone, never the server', () => {
    // A Worker runs in UTC and the restaurant does not. The same instant has to
    // render as two different local times.
    const { unmount } = wrap(<HomeHeader updatedAt={UPDATED_AT} timezone="Asia/Singapore" />)
    expect(screen.getByText(/14 August 2026/)).toBeTruthy()
    expect(screen.getByText(/10:30/)).toBeTruthy()
    unmount()

    wrap(<HomeHeader updatedAt={UPDATED_AT} timezone="America/New_York" />)
    expect(screen.getByText(/13 August 2026/)).toBeTruthy()
    expect(screen.getByText(/22:30/)).toBeTruthy()
  })

  it('says nothing about freshness before the first fetch lands', () => {
    // React Query reports 0 until data arrives. Rendering that as a date would
    // claim the board was last updated in 1970.
    wrap(<HomeHeader updatedAt={0} timezone="Asia/Singapore" />)

    expect(screen.getByText(/Welcome back/)).toBeTruthy()
    expect(screen.queryByText(/Last updated/)).toBeNull()
  })
})
