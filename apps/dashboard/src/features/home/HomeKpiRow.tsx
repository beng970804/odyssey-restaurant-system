import { Grid, GridItem } from '@repo/ui'
import { KpiCard, KpiCardSkeleton } from './KpiCard'
import { PendingCard, PendingCardSkeleton } from './PendingCard'
import type { Kpi, Pending } from './useHomeSummary'

/**
 * Five columns: three facts at a fifth each, then the one figure anyone acts on
 * at two fifths.
 *
 * The row assembles itself rather than being assembled in the screen, because
 * the loading and loaded shapes have to stay identical — the moment they are
 * two lists written in two places, one of them grows a card the other has not
 * got, and the layout jumps when the data lands.
 */
export function HomeKpiRow({ kpis, pending }: { kpis: Kpi[]; pending: Pending | undefined }) {
  const loading = !pending

  return (
    <Grid columns={5} gap="lg">
      {loading
        ? [0, 1, 2].map((index) => <KpiCardSkeleton key={index} />)
        : kpis.map((kpi) => <KpiCard key={kpi.label} kpi={kpi} />)}

      <GridItem span={2}>
        {loading ? <PendingCardSkeleton /> : <PendingCard pending={pending} />}
      </GridItem>
    </Grid>
  )
}
