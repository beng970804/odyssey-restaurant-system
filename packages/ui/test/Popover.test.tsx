import { fireEvent, screen } from '@testing-library/react'
import { useState } from 'react'
import { Pressable, Text as RNText } from 'react-native'
import { describe, expect, it } from 'vitest'
import { wrap } from './helpers'
import { Popover } from '../src/primitives/Popover'
import { Select } from '../src/primitives/Select'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Popover open={open} onClose={() => setOpen(false)} content={<RNText>Panel</RNText>}>
        <Pressable onPress={() => setOpen((was) => !was)}>
          <RNText>Trigger</RNText>
        </Pressable>
      </Popover>
      <Pressable onPress={() => {}}>
        <RNText>Elsewhere</RNText>
      </Pressable>
    </>
  )
}

/** The dismissal is bound to pointerdown, which fireEvent.click does not send. */
const pressDown = (element: Element) => fireEvent.pointerDown(element, { bubbles: true })

describe('Popover', () => {
  it('opens and closes from its trigger', () => {
    wrap(<Harness />)

    fireEvent.click(screen.getByText('Trigger'))
    expect(screen.getByText('Panel')).toBeTruthy()

    fireEvent.click(screen.getByText('Trigger'))
    expect(screen.queryByText('Panel')).toBeNull()
  })

  it('closes on a press outside it', () => {
    wrap(<Harness />)
    fireEvent.click(screen.getByText('Trigger'))

    pressDown(screen.getByText('Elsewhere'))
    expect(screen.queryByText('Panel')).toBeNull()
  })

  it('stays open when the press lands inside the panel', () => {
    wrap(<Harness />)
    fireEvent.click(screen.getByText('Trigger'))

    pressDown(screen.getByText('Panel'))
    expect(screen.getByText('Panel')).toBeTruthy()
  })

  it('escapes its parent, so nothing painted after it can cover it', () => {
    wrap(<Harness />)
    fireEvent.click(screen.getByText('Trigger'))

    // Mounted on the body rather than beside the trigger: the orders filter
    // menu used to be painted behind the table header below it.
    expect(document.body.contains(screen.getByText('Panel'))).toBe(true)
    expect(screen.getByText('Trigger').parentElement?.contains(screen.getByText('Panel'))).toBe(
      false,
    )
  })
})

describe('two Selects side by side', () => {
  const statuses = [{ label: 'Pending', value: 'pending' }]
  const channels = [{ label: 'Delivery', value: 'delivery' }]

  it('opening one closes the other', () => {
    wrap(
      <>
        <Select options={statuses} value={null} onChange={() => {}} placeholder="Any status" />
        <Select options={channels} value={null} onChange={() => {}} placeholder="Any channel" />
      </>,
    )

    fireEvent.click(screen.getByText('Any status'))
    expect(screen.getByText('Pending')).toBeTruthy()

    // One gesture: the press that dismisses the status menu is the same press
    // that opens the channel one.
    pressDown(screen.getByText('Any channel'))
    fireEvent.click(screen.getByText('Any channel'))

    expect(screen.queryByText('Pending')).toBeNull()
    expect(screen.getByText('Delivery')).toBeTruthy()
  })
})
