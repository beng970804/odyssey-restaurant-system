import { formatMoney } from '@repo/shared'
import { ThemeProvider } from '@repo/ui'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { KpiCard } from '../src/features/home/KpiCard'
import { TrendChart, describeDay } from '../src/features/home/TrendChart'

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

describe('money at the display boundary', () => {
  it('renders cents as currency, never as a raw integer', () => {
    wrap(<KpiCard kpi={{ label: 'Revenue', amount: 2602, format: (c) => formatMoney(c, 'SGD') }} />)

    // By label, not by text: the figure counts up, so the settled value is the
    // one the card publishes rather than whatever frame this assertion catches.
    expect(screen.getByLabelText('S$26.02')).toBeTruthy()
    expect(screen.queryByText('2602')).toBeNull()
  })

  it('formats zero rather than showing an empty card', () => {
    wrap(
      <KpiCard kpi={{ label: 'Average order', amount: 0, format: (c) => formatMoney(c, 'SGD') }} />,
    )
    expect(screen.getByLabelText('S$0.00')).toBeTruthy()
  })

  it('describes the trend in currency, so the chart is not the only way to read it', () => {
    wrap(
      <TrendChart
        currency="SGD"
        days={[
          { date: '2026-08-12', orderCount: 0, revenueCents: 0 },
          { date: '2026-08-13', orderCount: 2, revenueCents: 2602 },
        ]}
      />,
    )

    // A chart carries its values in geometry, which a screen reader cannot see.
    // These labels are the accessible equivalent — and they go through the same
    // money boundary, so raw cents never reach them either.
    expect(screen.getByLabelText(/S\$26\.02 in total/)).toBeTruthy()
    expect(screen.getByLabelText(/Revenue for the last 2 days/)).toBeTruthy()
    expect(screen.queryByText('2602')).toBeNull()
  })

  it("states a day's exact takings in the tooltip, not its geometry", () => {
    // The bar says "about a thousand"; the tooltip is where the figure is
    // exact, and it crosses the same money boundary as everything else.
    const line = describeDay({ date: '2026-08-13', orderCount: 17, revenueCents: 109363 }, 'SGD')

    expect(line).toContain('S$1,093.63')
    expect(line).toContain('17 orders')
    expect(line).not.toContain('109363')
  })

  it('counts one order in the singular', () => {
    const line = describeDay({ date: '2026-08-13', orderCount: 1, revenueCents: 2602 }, 'SGD')
    expect(line).toContain('1 order')
    expect(line).not.toContain('1 orders')
  })
})
