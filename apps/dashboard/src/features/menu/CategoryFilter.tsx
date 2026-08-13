import type { Category } from '@repo/api-client'
import { ChipGroup } from '@repo/ui'
import { IconToolsKitchen2 } from '@tabler/icons-react-native'
import { categoryIcon } from './categoryIcons'

export const ALL_CATEGORIES = 'all'

/** Hoisted: defined inside the component it would be a new component each render. */
const allIcon = (props: { color: string; size: number }) => <IconToolsKitchen2 {...props} />

/**
 * A filter, not a tab strip: the table below it stays put and only its rows
 * change, which is why this is a ChipGroup announced as a radio group.
 */
export function CategoryFilter({
  categories,
  value,
  onChange,
}: {
  categories: Category[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <ChipGroup
      chips={[
        { value: ALL_CATEGORIES, label: 'All', icon: allIcon },
        ...categories.map((category) => ({
          value: category.id,
          label: category.name,
          icon: categoryIcon(category.name),
        })),
      ]}
      value={value}
      onChange={onChange}
    />
  )
}
