import { ErrorState, Grid, Stack } from '@repo/ui'
import { HomeHeader } from '../../src/features/home/HomeHeader'
import { KpiCard, KpiCardSkeleton } from '../../src/features/home/KpiCard'
import { RecentOrdersCard } from '../../src/features/home/RecentOrdersCard'
import { TopItemsList } from '../../src/features/home/TopItemsList'
import { TrendChart } from '../../src/features/home/TrendChart'
import { useHomeSummary } from '../../src/features/home/useHomeSummary'

export default function HomeScreen() {
  const { kpis, trend, topItems, currency, timezone, isLoading, error, refetch } = useHomeSummary()

  return (
    <>
      <HomeHeader timezone={timezone} />

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Stack gap="xl">
          <Grid columns={4} gap="lg">
            {isLoading
              ? [0, 1, 2, 3].map((index) => <KpiCardSkeleton key={index} />)
              : kpis.map((kpi) => <KpiCard key={kpi.label} kpi={kpi} />)}
          </Grid>

          {!isLoading && <TrendChart days={trend} currency={currency} />}

          <Grid columns={2} gap="lg">
            <TopItemsList items={topItems} />
            <RecentOrdersCard currency={currency} />
          </Grid>
        </Stack>
      )}
    </>
  )
}
