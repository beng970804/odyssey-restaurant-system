import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ThemeProvider, useThemeMode } from '../src/theme/ThemeProvider'

function Toggle() {
  const { mode, setMode } = useThemeMode()
  return (
    <button type="button" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
      {mode}
    </button>
  )
}

describe('ThemeProvider', () => {
  it('tells the browser which scheme it is painting', () => {
    // Scrollbars, form controls and the space behind the page are drawn by the
    // browser, from `color-scheme` rather than from our tokens. Unset, a dark
    // dashboard gets a bright scrollbar down its edge.
    render(
      <ThemeProvider>
        <Toggle />
      </ThemeProvider>,
    )

    expect(document.documentElement.style.colorScheme).toBe('light')

    act(() => screen.getByRole('button').click())

    expect(screen.getByRole('button')).toHaveTextContent('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })
})
