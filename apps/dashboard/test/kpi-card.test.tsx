import { ApiProvider } from '@repo/api-client'
import { ThemeProvider, lightTheme } from '@repo/ui'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { countFigure, moneyFigure } from '../src/features/home/kpiFigure'
import { KpiCard } from '../src/features/home/KpiCard'
import { PendingCard } from '../src/features/home/PendingCard'

vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

// jsdom's window is 0×0, which every breakpoint reads as compact — and the
// compact card is a different card. This file is about the laptop one; the
// phone one is `home-compact.test.tsx`.
vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  return {
    ...actual,
    useWindowDimensions: () => ({ width: 1440, height: 900, scale: 1, fontScale: 1 }),
  }
})

// The pending card carries the queue modal, which holds a query.
const wrap = (ui: ReactElement) =>
  render(
    <ThemeProvider>
      <ApiProvider>{ui}</ApiProvider>
    </ThemeProvider>,
  )

describe('KpiCard', () => {
  it('leads with the number, at display size', () => {
    wrap(<KpiCard kpi={{ label: 'Total orders', figure: countFigure(60), hint: 'All time' }} />)

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
          figure: moneyFigure(100),
          icon: ({ color }) => {
            seen.push(color)
            return null
          },
        }}
      />,
    )

    expect(seen).toEqual([lightTheme.color.brand.default])
  })

  it('carries the week behind the figure as a sparkline', () => {
    wrap(
      <KpiCard
        kpi={{
          label: 'Revenue',
          figure: moneyFigure(100),
          hint: 'Cancelled orders excluded',
          trend: [0, 100, 250, 0, 80, 120, 300],
        }}
      />,
    )

    expect(screen.getByLabelText('Last 7 days')).toBeTruthy()
  })

  it('fills its grid cell so cards in a row share a height', () => {
    const { container } = wrap(<KpiCard kpi={{ label: 'Revenue', figure: moneyFigure(100) }} />)

    expect(container.firstElementChild).toHaveStyle({ flexGrow: 1 })
  })
})

describe('PendingCard', () => {
  const pending = {
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
    wrap(<PendingCard pending={{ ...pending, count: 0, tone: 'success' }} />)

    expect(screen.getByText('Nothing waiting')).toBeTruthy()
  })
})
