import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useMenuItemForm } from '../src/features/menu/useMenuItemForm'

const item = {
  id: 'item-1',
  categoryId: '0b6b8f5e-6b7a-4f3e-9a4b-2f0a5c1d7e88',
  name: 'Hainanese Chicken Rice',
  description: 'Poached chicken, chilli, ginger',
  priceCents: 890,
  isAvailable: true,
}

const categoryId = 'c1f0b0a4-1d2e-4a5b-8c9d-0e1f2a3b4c5d'

describe('useMenuItemForm', () => {
  it('submits the contract body, with the typed dollars converted to cents', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useMenuItemForm({ item: null, onSubmit }))

    act(() => {
      result.current.form.setFieldValue('name', 'Nasi Lemak')
      result.current.form.setFieldValue('categoryId', categoryId)
      result.current.setPriceInput('8.50')
    })
    await act(async () => {
      await result.current.form.handleSubmit()
    })

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Nasi Lemak',
      categoryId,
      description: null,
      priceCents: 850,
      isAvailable: true,
    })
  })

  it('refuses to submit an empty name, because the generated schema requires one', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useMenuItemForm({ item: null, onSubmit }))

    act(() => {
      result.current.form.setFieldValue('categoryId', categoryId)
      result.current.setPriceInput('8.50')
    })
    await act(async () => {
      await result.current.form.handleSubmit()
    })

    expect(onSubmit).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.fieldErrors.name).toBeTruthy())
  })

  it('refuses to submit with no category chosen', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useMenuItemForm({ item: null, onSubmit }))

    act(() => {
      result.current.form.setFieldValue('name', 'Nasi Lemak')
      result.current.setPriceInput('8.50')
    })
    await act(async () => {
      await result.current.form.handleSubmit()
    })

    expect(onSubmit).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.fieldErrors.categoryId).toBe('Choose a category'))
  })

  it('reports an unparseable price rather than pricing the item at zero', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useMenuItemForm({ item: null, onSubmit }))

    act(() => {
      result.current.form.setFieldValue('name', 'Nasi Lemak')
      result.current.form.setFieldValue('categoryId', categoryId)
      result.current.setPriceInput('abc')
    })
    await act(async () => {
      await result.current.form.handleSubmit()
    })

    expect(onSubmit).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.fieldErrors.priceCents).toBe('Enter a price'))
  })

  it('seeds from the item being edited, price shown in dollars', () => {
    const { result } = renderHook(() => useMenuItemForm({ item, onSubmit: vi.fn() }))

    expect(result.current.form.state.values.name).toBe('Hainanese Chicken Rice')
    expect(result.current.form.state.values.categoryId).toBe(item.categoryId)
    expect(result.current.priceInput).toBe('8.90')
  })

  it('re-seeds when a different item is opened, so the last edit does not leak', () => {
    const { result, rerender } = renderHook(
      ({ current }) => useMenuItemForm({ item: current, onSubmit: vi.fn() }),
      { initialProps: { current: item as typeof item | null } },
    )

    act(() => {
      result.current.form.setFieldValue('name', 'edited')
    })
    rerender({ current: null })

    expect(result.current.form.state.values.name).toBe('')
    expect(result.current.priceInput).toBe('')
  })
})
