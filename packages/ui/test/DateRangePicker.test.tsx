import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { wrap } from './helpers'
import { DateRangePicker } from '../src/primitives/DateRangePicker'

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
})
