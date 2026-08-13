import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { hexToRgb, wrap } from './helpers'
import { ChipGroup } from '../src/primitives/ChipGroup'
import { lightTheme } from '../src/theme/tokens'

const chips = [
  { value: 'all', label: 'All' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'coffee', label: 'Coffee' },
]

describe('ChipGroup', () => {
  it('is a radio group, not a tab list', () => {
    // The distinction is the whole reason this is not a Tabs variant: tabs
    // switch panels, chips filter one list that stays put. Assistive tech is
    // told which of those is happening.
    wrap(<ChipGroup chips={chips} value="all" onChange={vi.fn()} />)

    expect(screen.getByRole('radiogroup')).toBeTruthy()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('marks exactly one chip selected', () => {
    wrap(<ChipGroup chips={chips} value="pizza" onChange={vi.fn()} />)

    expect(screen.getByTestId('chip-pizza')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('chip-all')).toHaveAttribute('aria-checked', 'false')
  })

  it('reports the chosen chip', () => {
    const onChange = vi.fn()
    wrap(<ChipGroup chips={chips} value="all" onChange={onChange} />)

    fireEvent.click(screen.getByTestId('chip-coffee'))
    expect(onChange).toHaveBeenCalledWith('coffee')
  })

  it('fills the selected chip with the brand colour', () => {
    wrap(<ChipGroup chips={chips} value="pizza" onChange={vi.fn()} />)

    expect(screen.getByTestId('chip-pizza')).toHaveStyle({
      backgroundColor: hexToRgb(lightTheme.color.brand.default),
    })
  })

  it('shows a focus ring on keyboard focus', () => {
    wrap(<ChipGroup chips={chips} value="all" onChange={vi.fn()} />)
    const chip = screen.getByTestId('chip-pizza')

    fireEvent.focus(chip)
    expect(chip.style.outlineStyle).toBe('solid')
    expect(chip.style.outlineColor).toBe(hexToRgb(lightTheme.color.border.focus))
  })

  it('tints a render-prop icon to match the chip it sits in', () => {
    const seen: string[] = []
    const icon = ({ color }: { color: string }) => {
      seen.push(color)
      return null
    }

    wrap(
      <ChipGroup
        chips={[
          { value: 'all', label: 'All', icon },
          { value: 'pizza', label: 'Pizza', icon },
        ]}
        value="all"
        onChange={vi.fn()}
      />,
    )

    // Selected sits on the brand fill, so its icon takes the on-brand colour.
    expect(seen).toEqual([lightTheme.color.brand.onBrand, lightTheme.color.text.secondary])
  })

  it('renders without icons at all', () => {
    wrap(<ChipGroup chips={chips} value="all" onChange={vi.fn()} />)
    expect(screen.getByText('Pizza')).toBeTruthy()
  })
})
