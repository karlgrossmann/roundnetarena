import { IconUsers } from "@/components/icons"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteError } from "@/components/RouteError"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { LeaderboardCard } from "@/components/dashboard/LeaderboardCard"
import { OrganizationHeader } from "@/components/organization/OrganizationHeader"
import { usePublicViewContext } from "@/components/public-view/PublicViewContext"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { publicViewDashboardQueryOptions } from "@/lib/api/queries"
import { publicViewRouteHead } from "@/lib/public-view-head"
import {
  active_round_progress,
  active_round_title,
  public_view_error,
  public_view_no_players,
  public_view_no_players_description,
} from "@/paraglide/messages.js"

export const Route = createFileRoute("/view/$organizationSlug/l/$leagueId/")({
  head: () => publicViewRouteHead("dashboard"),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      publicViewDashboardQueryOptions(params)
    ),
  pendingComponent: DashboardSkeleton,
  errorComponent: PublicDashboardError,
  component: PublicDashboard,
})

function PublicDashboard() {
  const params = Route.useParams()
  const view = usePublicViewContext()
  const { data } = useSuspenseQuery(publicViewDashboardQueryOptions(params))
  return (
    <div className="flex flex-col gap-4">
      {/* Without a signed-in person, the league takes the place of the greeting. */}
      <OrganizationHeader
        name={view.organizationName}
        logo={view.organizationLogo}
        subline={view.leagueName}
      />

      {data.summary.activeRound ? (
        <Link
          to="/view/$organizationSlug/l/$leagueId/round"
          params={params}
          className="rounded-xl bg-primary/5 px-4 py-3 ring-1 ring-primary/20 transition-colors hover:bg-primary/10"
        >
          <span className="block font-heading text-sm font-medium">
            {active_round_title({ number: data.summary.activeRound.number })}
          </span>
          <span className="text-sm text-muted-foreground">
            {active_round_progress({
              open: data.summary.activeRound.openGames,
              total: data.summary.activeRound.totalGames,
            })}
          </span>
        </Link>
      ) : null}
      <DashboardStats summary={data.summary} />
      {data.players.length > 0 ? (
        <LeaderboardCard
          players={data.players}
          currentPoolPlayerIds={data.activePoolPlayerIds}
          config={data.table}
        />
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconUsers />
            </EmptyMedia>
            <EmptyTitle>{public_view_no_players()}</EmptyTitle>
            <EmptyDescription>
              {public_view_no_players_description()}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}

function PublicDashboardError({ reset }: ErrorComponentProps) {
  return <RouteError description={public_view_error()} reset={reset} />
}
