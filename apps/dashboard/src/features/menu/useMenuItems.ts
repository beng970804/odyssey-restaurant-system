import { unwrap, useListCategories, useListMenuItems } from '@repo/api-client'
import { useState } from 'react'
import { ALL_CATEGORIES } from './CategoryTabs'
import { useToggleAvailability } from './useToggleAvailability'

const PAGE_SIZE = 100

/**
 * Category filter, both queries and the optimistic toggle in one place, so the
 * screen holds no query state and the toggle has exactly one caller.
 */
export function useMenuItems() {
  const [category, setCategory] = useState(ALL_CATEGORIES)

  const categories = unwrap(useListCategories().data)?.data ?? []
  const { data, isLoading, error, refetch } = useListMenuItems({
    ...(category !== ALL_CATEGORIES && { categoryId: category }),
    pageSize: PAGE_SIZE,
  })
  const toggle = useToggleAvailability()

  return {
    category,
    setCategory,
    categories,
    items: unwrap(data)?.data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
    toggleAvailability: (item: { id: string }, isAvailable: boolean) =>
      toggle.mutate({ id: item.id, data: { isAvailable } }),
  }
}
