import type { OpeningHours } from '@repo/shared'
import { ThemeProvider } from '@repo/ui'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { OpeningHoursEditor } from '../src/features/settings/OpeningHoursEditor'

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

const hours: OpeningHours = Object.fromEntries(
  ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => [
    day,
    { open: '11:00', close: '22:00' },
  ]),
) as OpeningHours

describe('OpeningHoursEditor', () => {
  it('keeps a day on the screen by letting its row wrap', () => {
    // Label, switch and two free-width inputs came to ~500px, and the row did
    // not wrap — on a phone the closing time was clipped off the right edge
    // with no way to scroll to it.
    wrap(<OpeningHoursEditor value={hours} onChange={vi.fn()} />)

    const input = screen.getByLabelText('Monday opening time')
    // A time is five characters; the field takes a five-character width rather
    // than the intrinsic free width that pushed the row past the viewport.
    expect(input.parentElement).toHaveStyle({ width: '90px' })

    const row = input.parentElement?.parentElement?.parentElement
    expect(row).toHaveStyle({ flexWrap: 'wrap' })
  })

  it('keeps a day and its times together by spacing the days further apart', () => {
    // Wrapped, a day is two lines with a 12px gap inside it. The 8px between
    // days put Monday's times nearer Tuesday's label than Monday's own — the
    // grouping only reads if the between-days gap is the larger one. jsdom's
    // 0×0 window is the compact layout this applies to.
    const { container } = wrap(<OpeningHoursEditor value={hours} onChange={vi.fn()} />)

    expect(container.firstElementChild).toHaveStyle({ gap: '24px' })
  })
})
