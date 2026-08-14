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

describe('ChipGroup drag-to-scroll', () => {
  it('scrolls the row by dragging it with the pointer', () => {
    wrap(<ChipGroup chips={chips} value="all" onChange={vi.fn()} />)
    const scroller = screen.getByTestId('chip-scroller')

    fireEvent.pointerDown(scroller, { button: 0, clientX: 200 })
    fireEvent.pointerMove(scroller, { clientX: 120 })

    // Dragged 80px left, so the row scrolled 80px right.
    expect(scroller.scrollLeft).toBe(80)
    fireEvent.pointerUp(scroller)
  })

  it('resumes from where the row already is', () => {
    wrap(<ChipGroup chips={chips} value="all" onChange={vi.fn()} />)
    const scroller = screen.getByTestId('chip-scroller')
    scroller.scrollLeft = 40

    fireEvent.pointerDown(scroller, { button: 0, clientX: 200 })
    fireEvent.pointerMove(scroller, { clientX: 180 })

    expect(scroller.scrollLeft).toBe(60)
    fireEvent.pointerUp(scroller)
  })

  it('does not select the chip a drag happens to end on', () => {
    const onChange = vi.fn()
    wrap(<ChipGroup chips={chips} value="all" onChange={onChange} />)
    const scroller = screen.getByTestId('chip-scroller')

    const chip = screen.getByTestId('chip-coffee')
    fireEvent.pointerDown(chip, { button: 0, clientX: 200 })
    fireEvent.pointerMove(chip, { clientX: 120 })
    fireEvent.pointerUp(chip)
    fireEvent.click(chip)

    expect(onChange).not.toHaveBeenCalled()
    expect(scroller.scrollLeft).toBe(80)
  })

  it('still selects on a plain press, no drag involved', () => {
    const onChange = vi.fn()
    wrap(<ChipGroup chips={chips} value="all" onChange={onChange} />)

    const chip = screen.getByTestId('chip-coffee')
    fireEvent.pointerDown(chip, { button: 0, clientX: 200 })
    fireEvent.pointerUp(chip)
    fireEvent.click(chip)

    expect(onChange).toHaveBeenCalledWith('coffee')
  })

  it('ignores a drag that wobbles less than the threshold', () => {
    const onChange = vi.fn()
    wrap(<ChipGroup chips={chips} value="all" onChange={onChange} />)

    const chip = screen.getByTestId('chip-coffee')
    fireEvent.pointerDown(chip, { button: 0, clientX: 200 })
    fireEvent.pointerMove(chip, { clientX: 197 })
    fireEvent.pointerUp(chip)
    fireEvent.click(chip)

    // Three pixels of wobble is a press with a shaky hand, not a drag.
    expect(onChange).toHaveBeenCalledWith('coffee')
  })
})
