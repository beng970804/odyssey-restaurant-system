import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { wrap } from './helpers'
import { Avatar } from '../src/primitives/Avatar'

describe('Avatar', () => {
  it('falls back to initials when there is no image', () => {
    wrap(<Avatar name="Amélie Laurent" />)

    expect(screen.getByText('AL')).toBeTruthy()
  })

  it('renders the image when one is given', () => {
    wrap(<Avatar name="Amélie Laurent" imageUri="https://example.com/a.png" testID="avatar" />)

    // The URI can arrive as a src or as a background-image depending on how
    // react-native-web renders the source, so the assertion meets either.
    expect(screen.getByTestId('avatar').outerHTML).toContain('https://example.com/a.png')
  })

  it('keeps the initials underneath the image, so a failed load still says who this is', () => {
    wrap(<Avatar name="Amélie Laurent" imageUri="https://example.com/a.png" testID="avatar" />)

    expect(screen.getByText('AL')).toBeTruthy()
  })
})
