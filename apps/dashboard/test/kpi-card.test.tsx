import { ThemeProvider, lightTheme } from '@repo/ui'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { KpiCard } from '../src/features/home/KpiCard'
import { PendingCard } from '../src/features/home/PendingCard'

vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

describe('KpiCard', () => {
  it('leads with the number, at display size', () => {
    wrap(<KpiCard kpi={{ label: 'Total orders', amount: 60, format: String, hint: 'All time' }} />)

    expect(screen.getByLabelText('60')).toHaveStyle({
      fontSize: `${lightTheme.typography.display.fontSize}px`,
    })
    expect(screen.getByText('All time')).toHaveStyle({ color: lightTheme.color.text.muted })
  })

  it('tints an icon from the design system rather than the caller', () => {
    // The icon *set* is the app's choice; the icon *colour* is the tile's, which
    // is what keeps a saturated fill from creeping in card by card (ADR 0006).
    const seen: string[] = []
    wrap(
      <KpiCard
        kpi={{
          label: 'Revenue',
          amount: 100,
          format: () => 'S$1.00',
          icon: ({ color }) => {
            seen.push(color)
            return null
          },
        }}
      />,
    )

    expect(seen).toEqual([lightTheme.color.brand.default])
  })

  it('fills its grid cell so cards in a row share a height', () => {
    const { container } = wrap(
      <KpiCard kpi={{ label: 'Revenue', amount: 100, format: () => 'S$1.00' }} />,
    )

    expect(container.firstElementChild).toHaveStyle({ flexGrow: 1 })
  })
})

describe('PendingCard', () => {
  const pending = {
    value: '5',
    count: 5,
    total: 60,
    caption: 'of 60 orders all time',
    tone: 'warning' as const,
  }

  it('shows the count as a share of the book, not just a number', () => {
    wrap(<PendingCard pending={pending} />)

    const meter = screen.getByRole('progressbar')
    expect(meter).toHaveAttribute('aria-valuemax', '60')
    expect(meter).toHaveAttribute('aria-label', '5 of 60 orders awaiting a decision')
    // The count-up owns the rendered digits; the label is the settled figure.
    expect(screen.getByLabelText('5')).toBeTruthy()
    expect(screen.getByText('of 60 orders all time')).toBeTruthy()
  })

  it('offers the way through to acting on it', () => {
    wrap(<PendingCard pending={pending} />)

    expect(screen.getByText('Awaiting a decision')).toBeTruthy()
    expect(screen.getByText('Review orders')).toBeTruthy()
  })

  it('says so plainly when nothing is waiting', () => {
    wrap(<PendingCard pending={{ ...pending, value: '0', count: 0, tone: 'success' }} />)

    expect(screen.getByText('Nothing waiting')).toBeTruthy()
  })
})
