import type { MenuItemWithCategory } from '@repo/api-client'
import { ThemeProvider } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MenuItemTable } from '../src/features/menu/MenuItemTable'

// jsdom's 0×0 window reads as compact, where the table renders as a list. The
// width is faked so both layouts can be pinned.
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

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

const item = (overrides: Partial<MenuItemWithCategory> = {}): MenuItemWithCategory => ({
  id: 'item-1',
  categoryId: 'category-1',
  categoryName: 'Mains',
  name: 'Hainanese Chicken Rice',
  description: null,
  priceCents: 890,
  isAvailable: true,
  isArchived: false,
  imageUrl: null,
  createdAt: '2026-08-01T02:00:00.000Z',
  updatedAt: '2026-08-01T02:00:00.000Z',
  ...overrides,
})

const props = {
  loading: false,
  error: null,
  onRetry: () => {},
  onToggleAvailability: () => {},
  onEdit: () => {},
  onArchive: () => {},
  currency: 'SGD',
}

describe('MenuItemTable', () => {
  it('renders the price through the money boundary and the category name', () => {
    wrap(<MenuItemTable items={[item()]} {...props} />)

    expect(screen.getByText('S$8.90')).toBeTruthy()
    expect(screen.getByText('Mains')).toBeTruthy()
  })

  it('reports an availability toggle as the item and its next value', () => {
    const onToggleAvailability = vi.fn()
    wrap(<MenuItemTable items={[item()]} {...props} onToggleAvailability={onToggleAvailability} />)

    fireEvent.click(screen.getByLabelText('Hainanese Chicken Rice available'))

    expect(onToggleAvailability).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'item-1' }),
      false,
    )
  })

  it('offers edit and archive per row', () => {
    const onEdit = vi.fn()
    const onArchive = vi.fn()
    wrap(<MenuItemTable items={[item()]} {...props} onEdit={onEdit} onArchive={onArchive} />)

    fireEvent.click(screen.getByText('Edit'))
    fireEvent.click(screen.getByText('Archive'))

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-1' }))
    expect(onArchive).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-1' }))
  })

  it('trades the table for a list on a phone, every control still in reach', () => {
    // Five columns on a 390px screen put the switch and the actions behind a
    // sideways scroll — the exact controls a phone user opens this screen for.
    viewportWidth = 390
    const onToggleAvailability = vi.fn()
    wrap(<MenuItemTable items={[item()]} {...props} onToggleAvailability={onToggleAvailability} />)

    expect(screen.queryByRole('columnheader')).toBeNull()
    expect(screen.getByText('Hainanese Chicken Rice')).toBeTruthy()
    expect(screen.getByText('S$8.90')).toBeTruthy()
    expect(screen.getByText('Mains')).toBeTruthy()
    expect(screen.getByText('Edit')).toBeTruthy()
    expect(screen.getByText('Archive')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Hainanese Chicken Rice available'))
    expect(onToggleAvailability).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'item-1' }),
      false,
    )
  })
})
