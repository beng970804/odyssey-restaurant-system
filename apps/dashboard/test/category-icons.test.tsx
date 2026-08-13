import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { categoryIcon } from '../src/features/menu/categoryIcons'

/**
 * Tabler renders an <svg>, so the assertions read the rendered element rather
 * than comparing component identities — that is what actually reaches a user.
 */
function renderIcon(name: string) {
  const icon = categoryIcon(name)
  const { container } = render(<>{icon({ color: '#000000', size: 20 })}</>)
  return container.querySelector('svg')
}

describe('categoryIcon', () => {
  it('gives every seeded category its own icon', () => {
    const seeded = ['Starters', 'Mains', 'Noodles & Rice', 'Sides', 'Desserts', 'Drinks']
    const paths = seeded.map((name) => renderIcon(name)?.innerHTML)

    expect(paths.every(Boolean)).toBe(true)
    expect(new Set(paths).size).toBe(seeded.length)
  })

  it('matches on a keyword rather than the exact category name', () => {
    // Categories are free text a user can rename, so 'Hot Drinks' and 'Drinks'
    // have to land on the same icon.
    expect(renderIcon('Hot Drinks')?.innerHTML).toBe(renderIcon('Drinks')?.innerHTML)
    expect(renderIcon('noodles')?.innerHTML).toBe(renderIcon('Noodles & Rice')?.innerHTML)
  })

  it('falls back rather than rendering nothing for an unknown category', () => {
    // The map is keyed on English keywords. An unmatched category still has to
    // render a chip that looks like all the others.
    expect(renderIcon('Kombucha Flight')).toBeTruthy()
  })

  it('takes the colour and size it is given', () => {
    const icon = categoryIcon('Desserts')
    const { container } = render(<>{icon({ color: '#C2410C', size: 32 })}</>)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('stroke', '#C2410C')
    expect(svg).toHaveAttribute('width', '32')
  })
})
