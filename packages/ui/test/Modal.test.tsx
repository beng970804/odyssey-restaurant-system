import { screen } from '@testing-library/react'
import { Text } from 'react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { wrap } from './helpers'
import { Modal } from '../src/primitives/Modal'

// jsdom reports a zero-width window, so the viewport is faked at the one hook
// that reads it — same pattern as Drawer.test.tsx.
let viewportWidth = 1440

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  return {
    ...actual,
    useWindowDimensions: () => ({ width: viewportWidth, height: 900, scale: 1, fontScale: 1 }),
  }
})

beforeEach(() => {
  viewportWidth = 1440
})

const modal = () => (
  <Modal open onClose={vi.fn()} title="Orders awaiting a decision" width={640}>
    <Text>body</Text>
  </Modal>
)

describe('Modal', () => {
  it('takes the width it asks for when the viewport has it', () => {
    wrap(modal())

    expect(screen.getByRole('dialog')).toHaveStyle({ width: '640px' })
  })

  it('leaves a gutter each side on a phone rather than filling it', () => {
    // A 640px dialog on a 390px phone is edge to edge: nothing behind it stays
    // visible, and a dialog with no ground around it reads as a navigation.
    viewportWidth = 390
    wrap(modal())

    expect(screen.getByRole('dialog')).toHaveStyle({ width: '342px' })
  })
})
