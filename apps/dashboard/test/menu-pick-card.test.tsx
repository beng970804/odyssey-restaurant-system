import type { MenuItemWithCategory } from '@repo/api-client'
import { ThemeProvider } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MenuPickCard } from '../src/features/orders/MenuPickCard'

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

const item = (overrides: Partial<MenuItemWithCategory> = {}): MenuItemWithCategory => ({
  id: 'item-1',
  categoryId: 'cat-1',
  categoryName: 'Noodles & Rice',
  name: 'Laksa',
  description: null,
  priceCents: 850,
  isAvailable: true,
  isArchived: false,
  imageUrl: null,
  createdAt: '2026-08-01T02:00:00.000Z',
  updatedAt: '2026-08-01T02:00:00.000Z',
  ...overrides,
})

describe('MenuPickCard', () => {
  it('adds one on a single press — no separate Add button to find', () => {
    const onAdd = vi.fn()
    wrap(
      <MenuPickCard
        item={item()}
        quantity={0}
        currency="SGD"
        onAdd={onAdd}
        onSetQuantity={vi.fn()}
      />,
    )

    expect(screen.getByText('S$8.50')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Add Laksa'))
    expect(onAdd).toHaveBeenCalledOnce()
  })

  it('becomes a stepper once the item is in the order', () => {
    const onSetQuantity = vi.fn()
    wrap(
      <MenuPickCard
        item={item()}
        quantity={2}
        currency="SGD"
        onAdd={vi.fn()}
        onSetQuantity={onSetQuantity}
      />,
    )

    expect(screen.getByText('2')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Add one Laksa'))
    expect(onSetQuantity).toHaveBeenCalledWith('item-1', 3)

    fireEvent.click(screen.getByLabelText('Remove one Laksa'))
    expect(onSetQuantity).toHaveBeenCalledWith('item-1', 1)
  })

  it('shows an unavailable item but refuses to add it', () => {
    const onAdd = vi.fn()
    wrap(
      <MenuPickCard
        item={item({ isAvailable: false })}
        quantity={0}
        currency="SGD"
        onAdd={onAdd}
        onSetQuantity={vi.fn()}
      />,
    )

    // Visible — hiding it makes staff think the dish left the menu — but inert.
    expect(screen.getByText('Laksa')).toBeTruthy()
    expect(screen.getByText('Unavailable')).toBeTruthy()
    fireEvent.click(screen.getByText('Laksa'))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('falls back to an initial tile when there is no photo', () => {
    wrap(
      <MenuPickCard
        item={item({ imageUrl: null })}
        quantity={0}
        currency="SGD"
        onAdd={vi.fn()}
        onSetQuantity={vi.fn()}
      />,
    )
    // The first letter, oversized, where the photo would be.
    expect(screen.getByText('L')).toBeTruthy()
  })

  it('shows the photo when there is one', () => {
    wrap(
      <MenuPickCard
        item={item({ imageUrl: 'https://example.test/laksa.jpg' })}
        quantity={0}
        currency="SGD"
        onAdd={vi.fn()}
        onSetQuantity={vi.fn()}
      />,
    )
    expect(screen.queryByText('L')).toBeNull()
    // RNW renders an Image as a labelled wrapper around the img element.
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Laksa')).toBeTruthy()
  })
})
