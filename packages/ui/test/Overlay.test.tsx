import { fireEvent, screen, waitFor } from '@testing-library/react'
import { View } from 'react-native'
import { describe, expect, it, vi } from 'vitest'
import { wrap } from './helpers'
import { Drawer } from '../src/primitives/Drawer'
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

  it('opens from nothing rather than appearing at full strength', () => {
    // The shared value starts at 0 even when the overlay mounts already open,
    // so the first frame is transparent and the animation has somewhere to run
    // from. (The mocks freeze it there; the browser runs it to 1.)
    wrap(nested())

    expect(screen.getByRole('dialog').parentElement).toHaveStyle({ opacity: '0' })
  })

  it('slides the drawer in from the edge it is anchored to', async () => {
    wrap(
      <Drawer open onClose={vi.fn()} title="Order #168" width={480}>
        <View testID="detail" />
      </Drawer>,
    )

    // Closed, the panel sits one full width past the right edge.
    const panel = screen.getByRole('dialog')
    expect(panel).toHaveStyle({ transform: 'translateX(480px)' })

    // A tick later it is flush, and the transition is what carries it there:
    // longer than a dialog's, because it crosses its own width to arrive. The
    // backdrop is given the same span, so the two arrive together rather than
    // one chasing the other.
    await waitFor(() => expect(panel).toHaveStyle({ transform: 'translateX(0px)' }))
    expect(panel).toHaveStyle({ transitionProperty: 'transform' })
    expect(panel.style.transitionDuration).toBe('360ms')
    expect(panel.parentElement?.style.transitionDuration).toBe('360ms')
  })
})
