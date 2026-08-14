import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { wrap } from './helpers'
import { Field } from '../src/primitives/Field'
import { Input } from '../src/primitives/Input'
import { Select } from '../src/primitives/Select'
import { Switch } from '../src/primitives/Switch'

const options = [
  { label: 'Dine in', value: 'dine_in' },
  { label: 'Takeaway', value: 'takeaway' },
]

describe('Select', () => {
  it('shows the placeholder when nothing is chosen', () => {
    wrap(<Select options={options} value={null} onChange={vi.fn()} placeholder="Channel" />)
    expect(screen.getByText('Channel')).toBeTruthy()
  })

  it('selects an option', () => {
    const onChange = vi.fn()
    wrap(<Select options={options} value={null} onChange={onChange} placeholder="Channel" />)

    fireEvent.click(screen.getByText('Channel'))
    fireEvent.click(screen.getByText('Dine in'))

    expect(onChange).toHaveBeenCalledWith('dine_in')
  })

  it('shows the chosen option label rather than its value', () => {
    wrap(<Select options={options} value="takeaway" onChange={vi.fn()} placeholder="Channel" />)
    expect(screen.getByText('Takeaway')).toBeTruthy()
  })

  it('closes after choosing', () => {
    wrap(<Select options={options} value={null} onChange={vi.fn()} placeholder="Channel" />)

    fireEvent.click(screen.getByText('Channel'))
    expect(screen.getByText('Takeaway')).toBeTruthy()

    fireEvent.click(screen.getByText('Dine in'))
    expect(screen.queryByText('Takeaway')).toBeNull()
  })
})

describe('Field', () => {
  it('renders a label, hint and error together', () => {
    wrap(
      <Field label="Customer" hint="Optional" error="Required">
        <Input value="" onChangeText={vi.fn()} />
      </Field>,
    )

    expect(screen.getByText('Customer')).toBeTruthy()
    expect(screen.getByText('Required')).toBeTruthy()
    // The error replaces the hint rather than stacking with it.
    expect(screen.queryByText('Optional')).toBeNull()
  })
})

describe('Switch', () => {
  it('toggles', () => {
    const onValueChange = vi.fn()
    wrap(<Switch value={false} onValueChange={onValueChange} label="Auto-accept" />)

    fireEvent.click(screen.getByRole('switch'))
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('reports its state to assistive technology', () => {
    wrap(<Switch value onValueChange={vi.fn()} label="Auto-accept" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('names itself without printing the name when only accessibilityLabel is given', () => {
    wrap(<Switch value onValueChange={vi.fn()} accessibilityLabel="Otah available" />)

    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'Otah available')
    expect(screen.queryByText('Otah available')).toBeNull()
  })
})
