import { ErrorState, Grid, Stack } from '@repo/ui'
import { PageHeader } from '../../src/components/PageHeader'
import { KpiCard, KpiCardSkeleton } from '../../src/features/home/KpiCard'
import { RecentOrdersCard } from '../../src/features/home/RecentOrdersCard'
import { TopItemsList } from '../../src/features/home/TopItemsList'
import { TrendBars } from '../../src/features/home/TrendBars'
import { useHomeSummary } from '../../src/features/home/useHomeSummary'

export default function HomeScreen() {
  const { kpis, trend, topItems, currency, isLoading, error, refetch } = useHomeSummary()

  return (
    <>
      <PageHeader title="Today" description="How the restaurant is doing right now." />

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Stack gap="xl">
          <Grid columns={4} gap="lg">
            {isLoading
              ? [0, 1, 2, 3].map((index) => <KpiCardSkeleton key={index} />)
              : kpis.map((kpi) => <KpiCard key={kpi.label} kpi={kpi} />)}
          </Grid>

          {!isLoading && <TrendBars days={trend} currency={currency} />}

          <Grid columns={2} gap="lg">
            <TopItemsList items={topItems} />
            <RecentOrdersCard currency={currency} />
          </Grid>
        </Stack>
      )}
    </>
  )
}
