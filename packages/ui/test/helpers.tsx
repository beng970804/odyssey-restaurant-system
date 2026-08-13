import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../src/theme/ThemeProvider'

/** Every primitive needs the theme in context, so no test renders bare. */
export const wrap = (ui: ReactElement): RenderResult => render(<ThemeProvider>{ui}</ThemeProvider>)

/** The DOM normalises hex colours to rgb(), so assertions have to meet it there. */
export function hexToRgb(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
  return `rgb(${r}, ${g}, ${b})`
}
