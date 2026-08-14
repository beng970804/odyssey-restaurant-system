import { screen } from '@testing-library/react'
import { Text } from 'react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { wrap } from './helpers'
import { Drawer } from '../src/primitives/Drawer'

// jsdom reports a zero-width window, so the viewport is faked at the one hook
// that reads it — same pattern as Grid.test.tsx.
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

const drawer = () => (
  <Drawer open onClose={vi.fn()} title="Order">
    <Text>body</Text>
  </Drawer>
)

describe('Drawer', () => {
  it('takes the width it asks for when the viewport has it', () => {
    wrap(drawer())

    expect(screen.getByRole('dialog')).toHaveStyle({ width: '480px' })
  })

  it('leaves a strip of the page visible on a phone', () => {
    // A 480px drawer on a 390px phone is not a drawer, it is a page: nothing
    // behind it stays visible, so nothing says "you have not navigated away".
    // The gutter keeps the backdrop tappable and the overlay legible as one.
    viewportWidth = 390
    wrap(drawer())

    expect(screen.getByRole('dialog')).toHaveStyle({ width: '342px' })
  })
})
