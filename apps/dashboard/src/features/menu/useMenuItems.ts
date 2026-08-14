import {
  getListMenuItemsQueryKey,
  unwrap,
  useListCategories,
  useListMenuItems,
} from '@repo/api-client'
import { keepPreviousData } from '@tanstack/react-query'
import { useState } from 'react'
import { ALL_CATEGORIES } from './CategoryFilter'
import { useToggleAvailability } from './useToggleAvailability'

const PAGE_SIZE = 100

/**
 * Category filter, both queries and the optimistic toggle in one place, so the
 * screen holds no query state and the toggle has exactly one caller.
 */
export function useMenuItems() {
  const [category, setCategory] = useState(ALL_CATEGORIES)

  const categories = unwrap(useListCategories().data)?.data ?? []
  // Each category is a new query key; the previous rows hold the screen,
  // dimmed by `refreshing`, so a chip press never blanks the table.
  const query = {
    ...(category !== ALL_CATEGORIES && { categoryId: category }),
    pageSize: PAGE_SIZE,
  }
  const { data, isLoading, isFetching, error, refetch } = useListMenuItems(query, {
    // The key restates what the generated hook would derive — the options type
    // requires it whenever any query option is overridden.
    query: { queryKey: getListMenuItemsQueryKey(query), placeholderData: keepPreviousData },
  })
  const toggle = useToggleAvailability()

  return {
    category,
    setCategory,
    categories,
    items: unwrap(data)?.data ?? [],
    isLoading,
    refreshing: isFetching && !isLoading,
    error: error as Error | null,
    refetch,
    toggleAvailability: (item: { id: string }, isAvailable: boolean) =>
      toggle.mutate({ id: item.id, data: { isAvailable } }),
  }
}
