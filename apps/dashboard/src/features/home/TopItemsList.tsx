import { Card, Divider, EmptyState, Inline, Skeleton, Stack, Text } from '@repo/ui'
import { Fragment } from 'react'

export type TopItem = { menuItemId: string; name: string; quantitySold: number }

export function TopItemsList({ items }: { items: TopItem[] }) {
  return (
    <Card padding="lg" flex={1}>
      <Stack gap="md">
        <Text variant="h3">Top items</Text>
        {items.length === 0 ? (
          <EmptyState title="No sales yet" description="Items appear here once orders come in." />
        ) : (
          <Stack gap="sm">
            {items.map((item, index) => (
              <Fragment key={item.menuItemId}>
                {index > 0 ? <Divider /> : null}
                <Inline justify="space-between">
                  <Text>{item.name}</Text>
                  <Text color="muted">{`${item.quantitySold} sold`}</Text>
                </Inline>
              </Fragment>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

/** Five rows, because five is what the endpoint returns at most. */
export function TopItemsListSkeleton() {
  return (
    <Card padding="lg" flex={1}>
      <Stack gap="md">
        <Skeleton width={90} height={20} />
        <Stack gap="sm">
          {[0, 1, 2, 3, 4].map((index) => (
            <Inline key={index} justify="space-between">
              <Skeleton width={130} height={14} />
              <Skeleton width={50} height={14} />
            </Inline>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}
