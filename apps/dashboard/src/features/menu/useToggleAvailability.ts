import { getListMenuItemsQueryKey, useUpdateMenuItem, type MenuItemList } from '@repo/api-client'
import { useToast } from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'

/**
 * A switch that waits 300ms before moving feels broken, so the toggle is
 * optimistic — and rolls back on failure, which is the half people skip.
 */
export function useToggleAvailability() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useUpdateMenuItem({
    mutation: {
      onMutate: async ({ id, data }) => {
        const key = getListMenuItemsQueryKey()
        await queryClient.cancelQueries({ queryKey: key })
        const previous = queryClient.getQueryData(key)

        queryClient.setQueryData(key, (old: { data: MenuItemList } | undefined) =>
          old
            ? {
                ...old,
                data: {
                  ...old.data,
                  data: old.data.data.map((item) =>
                    item.id === id
                      ? { ...item, isAvailable: data.isAvailable ?? item.isAvailable }
                      : item,
                  ),
                },
              }
            : old,
        )

        return { previous, key }
      },
      onError: (_error, _variables, context) => {
        if (context) queryClient.setQueryData(context.key, context.previous)
        toast.show('Could not update availability', 'danger')
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() }),
    },
  })
}
