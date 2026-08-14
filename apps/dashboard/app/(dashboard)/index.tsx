import { ErrorState, Grid, GridItem, Stack } from '@repo/ui'
import { HomeHeader } from '../../src/features/home/HomeHeader'
import { HomeKpiRow } from '../../src/features/home/HomeKpiRow'
import { RecentOrdersCard } from '../../src/features/home/RecentOrdersCard'
import { TopItemsList, TopItemsListSkeleton } from '../../src/features/home/TopItemsList'
import { TrendChart, TrendChartSkeleton } from '../../src/features/home/TrendChart'
import { useHomeSummary } from '../../src/features/home/useHomeSummary'

/**
 * Five columns, not four. Three facts, then the one figure anyone acts on at
 * twice the width; the trend and the top sellers split 3/2 beneath it; the
 * orders table takes the full width, which is the only width its columns fit in.
 *
 * Every row keeps its shape while it loads. A row that renders nothing until
 * its data lands is a row that shoves the page down when it arrives.
 */
export default function HomeScreen() {
  const { kpis, pending, trend, topItems, currency, timezone, isLoading, error, refetch } =
    useHomeSummary()

  if (error) {
    return (
      <>
        <HomeHeader timezone={timezone} />
        <ErrorState error={error} onRetry={refetch} />
      </>
    )
  }

  return (
    <>
      <HomeHeader timezone={timezone} />

      <Stack gap="xl">
        <HomeKpiRow kpis={kpis} pending={pending} />

        <Grid columns={5} gap="lg">
          <GridItem span={3}>
            {isLoading ? <TrendChartSkeleton /> : <TrendChart days={trend} currency={currency} />}
          </GridItem>
          <GridItem span={2}>
            {isLoading ? <TopItemsListSkeleton /> : <TopItemsList items={topItems} />}
          </GridItem>
        </Grid>

        <RecentOrdersCard />
      </Stack>
    </>
  )
}
