import { fireEvent, screen } from '@testing-library/react'
import { View } from 'react-native'
import { describe, expect, it, vi } from 'vitest'
import { wrap } from './helpers'
import { Modal } from '../src/primitives/Modal'

/** A modal written deep inside a card, which is where the bug came from. */
const nested = (onClose = vi.fn()) => (
  <View testID="card">
    <View testID="inner">
      <Modal open onClose={onClose} title="Orders awaiting a decision">
        <View testID="body" />
      </Modal>
    </View>
  </View>
)

describe('Overlay', () => {
  it('escapes the element it was written inside', () => {
    // An absolutely positioned overlay only covers its nearest positioned
    // ancestor, so a modal opened from a card was laid out inside that card —
    // clipped, and half off it. The portal is what makes where it is written
    // stop mattering.
    const { container } = wrap(nested())

    const dialog = screen.getByRole('dialog')
    expect(container.contains(dialog)).toBe(false)
    expect(document.body.contains(dialog)).toBe(true)
  })

  it('covers the viewport rather than a parent box', () => {
    wrap(nested())

    // The backdrop is the first of the two: the modal's own close button
    // carries the same label.
    const [backdrop] = screen.getAllByLabelText('Close')
    expect(backdrop?.parentElement).toHaveStyle({ position: 'fixed' })
  })

  it('still closes on the backdrop and on Escape', () => {
    const onClose = vi.fn()
    const { unmount } = wrap(nested(onClose))

    const [backdrop] = screen.getAllByLabelText('Close')
    fireEvent.click(backdrop!)
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
    unmount()
  })

  it('takes itself out of the body when it closes', () => {
    const { unmount } = wrap(nested())
    expect(screen.queryByRole('dialog')).toBeTruthy()

    unmount()
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
