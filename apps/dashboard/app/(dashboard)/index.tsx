import { ErrorState, Grid, GridItem, Stack } from '@repo/ui'
import { HomeHeader } from '../../src/features/home/HomeHeader'
import { KpiCard, KpiCardSkeleton } from '../../src/features/home/KpiCard'
import { PendingCard, PendingCardSkeleton } from '../../src/features/home/PendingCard'
import { RecentOrdersCard } from '../../src/features/home/RecentOrdersCard'
import { TopItemsList } from '../../src/features/home/TopItemsList'
import { TrendChart } from '../../src/features/home/TrendChart'
import { useHomeSummary } from '../../src/features/home/useHomeSummary'

/**
 * Five columns, not four. Three facts, then the one figure anyone acts on at
 * twice the width; the trend and the top sellers split 3/2 beneath it; the
 * orders table takes the full width, which is the only width its four fixed
 * columns fit in.
 */
export default function HomeScreen() {
  const { kpis, pending, trend, topItems, currency, timezone, isLoading, error, refetch } =
    useHomeSummary()

  return (
    <>
      <HomeHeader timezone={timezone} />

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Stack gap="xl">
          <Grid columns={5} gap="lg">
            {isLoading || !pending
              ? [
                  ...[0, 1, 2].map((index) => <KpiCardSkeleton key={index} />),
                  <GridItem key="pending" span={2}>
                    <PendingCardSkeleton />
                  </GridItem>,
                ]
              : [
                  ...kpis.map((kpi) => <KpiCard key={kpi.label} kpi={kpi} />),
                  <GridItem key="pending" span={2}>
                    <PendingCard pending={pending} />
                  </GridItem>,
                ]}
          </Grid>

          {!isLoading && (
            <Grid columns={5} gap="lg">
              <GridItem span={3}>
                <TrendChart days={trend} currency={currency} />
              </GridItem>
              <GridItem span={2}>
                <TopItemsList items={topItems} />
              </GridItem>
            </Grid>
          )}

          <RecentOrdersCard currency={currency} timezone={timezone} />
        </Stack>
      )}
    </>
  )
}
