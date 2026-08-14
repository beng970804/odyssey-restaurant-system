import { ThemeProvider } from '@repo/ui'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { NavToggleProvider } from '../src/components/NavToggle'
import { PageHeader } from '../src/components/PageHeader'

const wrap = (ui: ReactElement) =>
  render(
    <ThemeProvider>
      <NavToggleProvider open onOpenChange={vi.fn()}>
        {ui}
      </NavToggleProvider>
    </ThemeProvider>,
  )

describe('PageHeader', () => {
  it('lets the title column give way, so the actions stay on the screen', () => {
    // A row child does not shrink by default under React Native, so a long
    // description pushed the actions button past the right edge of a phone
    // instead of wrapping beside it.
    wrap(
      <PageHeader
        title="Orders"
        description="Every order, and what can be done with it."
        actions={<>{null}</>}
      />,
    )

    const column = screen.getByText('Orders').parentElement?.parentElement
    expect(column?.style.flex).toBe('1 1 0%')
  })
})
