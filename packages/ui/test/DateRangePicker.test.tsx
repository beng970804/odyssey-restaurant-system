import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { wrap } from './helpers'
import { DateRangePicker } from '../src/primitives/DateRangePicker'

// jsdom's 0×0 window reads as compact, where the panel stacks. The width is
// faked so both layouts can be pinned.
let viewportWidth = 1440

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  return {
    ...actual,
    useWindowDimensions: () => ({ width: viewportWidth, height: 900, scale: 1, fontScale: 1 }),
  }
})

beforeEach(() => {
  viewportWidth = 1440
})

const TODAY = '2026-08-14'

const open = () => fireEvent.click(screen.getByText('Any date'))

describe('DateRangePicker', () => {
  it('says what it is for while nothing is chosen', () => {
    wrap(<DateRangePicker value={{ from: null, to: null }} onChange={vi.fn()} today={TODAY} />)
    expect(screen.getByText('Any date')).toBeTruthy()
  })

  it('reads back a chosen range as a range', () => {
    wrap(
      <DateRangePicker
        value={{ from: '2026-08-01', to: '2026-08-14' }}
        onChange={vi.fn()}
        today={TODAY}
      />,
    )
    expect(screen.getByText('1 Aug – 14 Aug')).toBeTruthy()
  })

  it('takes both ends from a preset in one change', () => {
    const onChange = vi.fn()
    wrap(<DateRangePicker value={{ from: null, to: null }} onChange={onChange} today={TODAY} />)

    open()
    fireEvent.click(screen.getByText('Last 7 days'))

    // Seven days inclusive of today, not seven days before it.
    expect(onChange).toHaveBeenCalledWith({ from: '2026-08-08', to: '2026-08-14' })
  })

  it('starts a range on the first day pressed', () => {
    const onChange = vi.fn()
    wrap(<DateRangePicker value={{ from: null, to: null }} onChange={onChange} today={TODAY} />)

    open()
    fireEvent.click(screen.getByLabelText('2026-08-05'))

    expect(onChange).toHaveBeenCalledWith({ from: '2026-08-05', to: null })
  })

  it('closes the range on the second day pressed', () => {
    const onChange = vi.fn()
    wrap(
      <DateRangePicker
        value={{ from: '2026-08-05', to: null }}
        onChange={onChange}
        today={TODAY}
      />,
    )

    fireEvent.click(screen.getByText('From 5 Aug'))
    fireEvent.click(screen.getByLabelText('2026-08-09'))

    expect(onChange).toHaveBeenCalledWith({ from: '2026-08-05', to: '2026-08-09' })
  })

  it('reads a backwards second press as a new start, not as an error', () => {
    const onChange = vi.fn()
    wrap(
      <DateRangePicker
        value={{ from: '2026-08-05', to: null }}
        onChange={onChange}
        today={TODAY}
      />,
    )

    fireEvent.click(screen.getByText('From 5 Aug'))
    fireEvent.click(screen.getByLabelText('2026-08-02'))

    expect(onChange).toHaveBeenCalledWith({ from: '2026-08-02', to: '2026-08-05' })
  })

  it('clears both ends', () => {
    const onChange = vi.fn()
    wrap(
      <DateRangePicker
        value={{ from: '2026-08-01', to: '2026-08-14' }}
        onChange={onChange}
        today={TODAY}
      />,
    )

    fireEvent.click(screen.getByText('1 Aug – 14 Aug'))
    fireEvent.click(screen.getByText('Any date'))

    expect(onChange).toHaveBeenCalledWith({ from: null, to: null })
  })

  it('opens on the month of the range being edited', () => {
    wrap(
      <DateRangePicker value={{ from: '2026-05-02', to: null }} onChange={vi.fn()} today={TODAY} />,
    )

    fireEvent.click(screen.getByText('From 2 May'))
    expect(screen.getByText('May 2026')).toBeTruthy()
  })

  it('walks months without touching the selection', () => {
    const onChange = vi.fn()
    wrap(<DateRangePicker value={{ from: null, to: null }} onChange={onChange} today={TODAY} />)

    open()
    fireEvent.click(screen.getByLabelText('Previous month'))

    expect(screen.getByText('July 2026')).toBeTruthy()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('sits the presets beside the calendar where there is room', () => {
    wrap(<DateRangePicker value={{ from: null, to: null }} onChange={vi.fn()} today={TODAY} />)
    open()

    const panel = screen.getByLabelText('Choose a date range')
    expect(panel.firstElementChild).toHaveStyle({ flexDirection: 'row' })
  })

  it('stacks the presets above the calendar on a phone', () => {
    // Presets beside the calendar come to ~420px, which no phone has: the
    // calendar sat past the right edge, unreachable — the picker looked like a
    // preset menu with a large blank corner.
    viewportWidth = 390
    wrap(<DateRangePicker value={{ from: null, to: null }} onChange={vi.fn()} today={TODAY} />)
    open()

    const panel = screen.getByLabelText('Choose a date range')
    expect(panel.firstElementChild).toHaveStyle({ flexDirection: 'column' })
    // Both halves are still there — presets to answer fast, grid for the rest.
    expect(screen.getByText('Last 7 days')).toBeTruthy()
    expect(screen.getByText('August 2026')).toBeTruthy()
  })
})
