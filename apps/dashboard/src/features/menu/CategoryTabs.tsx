import type { Category } from '@repo/api-client'
import { Tabs } from '@repo/ui'

export const ALL_CATEGORIES = 'all'

export function CategoryTabs({
  categories,
  value,
  onChange,
}: {
  categories: Category[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Tabs
      tabs={[
        { value: ALL_CATEGORIES, label: 'All' },
        ...categories.map((category) => ({ value: category.id, label: category.name })),
      ]}
      value={value}
      onChange={onChange}
    />
  )
}
