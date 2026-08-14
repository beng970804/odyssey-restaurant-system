import { ApiProvider } from '@repo/api-client'
import { ThemeProvider, lightTheme } from '@repo/ui'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { NavToggleProvider } from '../src/components/NavToggle'
import { HomeHeader } from '../src/features/home/HomeHeader'
import { HomeKpiRow } from '../src/features/home/HomeKpiRow'
import { KpiCard } from '../src/features/home/KpiCard'
import { countFigure, moneyFigure } from '../src/features/home/kpiFigure'
import type { Kpi, Pending } from '../src/features/home/useHomeSummary'

vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

// No breakpoint mock: jsdom's 0×0 window *is* the compact layout.

const wrap = (ui: ReactElement) =>
  render(
    <ThemeProvider>
      <NavToggleProvider open onOpenChange={vi.fn()}>
        <ApiProvider>{ui}</ApiProvider>
      </NavToggleProvider>
    </ThemeProvider>,
  )

const kpis: Kpi[] = [
  { label: 'Total orders', figure: countFigure(63), hint: 'All time' },
  { label: 'Revenue', figure: moneyFigure(341_203), hint: 'Cancelled orders excluded' },
  { label: 'Average order', figure: moneyFigure(5783), hint: 'Per earning order' },
]

const pending: Pending = {
  count: 6,
  total: 63,
  caption: 'of 63 orders all time',
  tone: 'warning',
}

describe('Home on a phone', () => {
  it('pairs the facts two to a row and keeps Pending full width', () => {
    // One card per row is four screens of scrolling for four numbers.
    const { container } = wrap(<HomeKpiRow kpis={kpis} pending={pending} />)
    const cells = [...(container.firstElementChild?.children ?? [])] as HTMLElement[]

    expect(cells).toHaveLength(4)
    expect(cells[0]?.style.flex).toBe('1 1 50%')
    expect(cells[1]?.style.flex).toBe('1 1 50%')
    expect(cells[3]?.style.flex).toBe('1 1 100%')
  })

  it('steps the figure down a size, because half a phone is not 32px wide', () => {
    wrap(<KpiCard kpi={{ label: 'Revenue', figure: moneyFigure(341_203) }} />)

    expect(screen.getByLabelText('S$3,412.03')).toHaveStyle({
      fontSize: `${lightTheme.typography.h1.fontSize}px`,
    })
  })

  it('drops the icon tile, which is the decoration the label needs the room from', () => {
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

    expect(seen).toEqual([])
  })

  it('lets the greeting shrink beside the toggle instead of running off the page', () => {
    const { container } = wrap(<HomeHeader timezone="Asia/Singapore" />)

    expect(screen.getByText(/Welcome back/)).toHaveStyle({
      fontSize: `${lightTheme.typography.h1.fontSize}px`,
    })
    // The column holding it is the one that has to give; unshrinkable, the row
    // overflows the card and the greeting is clipped by the viewport.
    expect(screen.getByText(/Welcome back/).parentElement?.style.flex).toBe('1 1 0%')
    expect(container.firstElementChild).toBeTruthy()
  })
})
