import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Switch } from '../src/primitives/Switch'
import { wrap } from './helpers'

describe('Switch', () => {
  it('reports the flipped value on press', () => {
    const onValueChange = vi.fn()
    wrap(<Switch value={false} onValueChange={onValueChange} label="Dine in" />)

    fireEvent.click(screen.getByRole('switch'))
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('slides the knob rather than teleporting it', () => {
    // The knob moves 16px on every settings press and every availability
    // toggle; a snap reads as a glitch where a slide reads as a control.
    wrap(<Switch value={false} onValueChange={() => {}} label="Dine in" />)

    const knob = screen.getByTestId('switch-knob')
    expect(knob).toHaveStyle({ transitionProperty: 'transform' })
  })
})
