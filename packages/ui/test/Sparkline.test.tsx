import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { wrap } from './helpers'
import { Sparkline } from '../src/primitives/Sparkline'
import { lightTheme } from '../src/theme/tokens'

const bars = () => [...screen.getByLabelText('Seven-day trend').children] as HTMLElement[]

describe('Sparkline', () => {
  it('scales every bar against the tallest', () => {
    wrap(<Sparkline values={[0, 14, 28]} height={28} label="Seven-day trend" />)

    const heights = bars().map((bar) => bar.style.height)
    expect(heights[2]).toBe('28px')
    expect(heights[1]).toBe('14px')
  })

  it('keeps a floor under a bar, so a quiet week still draws', () => {
    // All zeros divide into nothing: without a floor the control renders as
    // blank space and reads as broken rather than as "nothing sold".
    wrap(<Sparkline values={[0, 0, 0]} height={28} label="Seven-day trend" />)

    for (const bar of bars()) {
      expect(bar.style.height).toBe('2px')
    }
  })

  it('sets the newest bar apart — it is the day being asked about', () => {
    wrap(<Sparkline values={[10, 20, 30]} height={28} label="Seven-day trend" />)

    const all = bars()
    expect(all.at(-1)).toHaveStyle({ backgroundColor: lightTheme.color.brand.default })
    expect(all[0]).toHaveStyle({ backgroundColor: lightTheme.color.border.strong })
  })

  it('is one image to a screen reader, not a list of nameless boxes', () => {
    wrap(<Sparkline values={[1, 2]} height={28} label="Seven-day trend" />)

    expect(screen.getByLabelText('Seven-day trend')).toHaveAttribute('role', 'img')
  })
})
