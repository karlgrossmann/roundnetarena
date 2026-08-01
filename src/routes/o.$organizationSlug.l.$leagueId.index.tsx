import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteError } from "@/components/RouteError"
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { LeaderboardCard } from "@/components/dashboard/LeaderboardCard"
import { PlayerEmptyState } from "@/components/dashboard/PlayerEmptyState"
import { ActiveRoundBanner } from "@/components/layout/ActiveRoundBanner"
import { useLeagueContext } from "@/components/league/LeagueContext"
import { CreatePlayerButton } from "@/components/player/CreatePlayerButton"
import {
  accountQueryOptions,
  organizationsQueryOptions,
  playersQueryOptions,
  poolQueryOptions,
  settingsQueryOptions,
  summaryQueryOptions,
} from "@/lib/api/queries"
import { ensureLeagueRouteContext } from "@/lib/api/league-route"
import { localizedRouteHead } from "@/lib/i18n"
import { route_error_dashboard } from "@/paraglide/messages.js"

export const Route = createFileRoute("/o/$organizationSlug/l/$leagueId/")({
  staticData: { titleKey: "dashboard" },
  head: () => localizedRouteHead("dashboard"),
  loader: async ({ context, params }) => {
    const league = await ensureLeagueRouteContext(context.queryClient, params)
    // In parallel, not sequentially — two consecutive `await`s double the wait.
    await Promise.all([
      context.queryClient.ensureQueryData(summaryQueryOptions(league)),
      context.queryClient.ensureQueryData(playersQueryOptions(league)),
      context.queryClient.ensureQueryData(poolQueryOptions(league)),
      context.queryClient.ensureQueryData(settingsQueryOptions(league)),
      // Header data (account name, organization crest) belongs in the loader so it is
      // part of the server-rendered page instead of popping in afterwards.
      context.queryClient.ensureQueryData(accountQueryOptions()),
      context.queryClient.ensureQueryData(organizationsQueryOptions()),
    ])
  },
  pendingComponent: DashboardSkeleton,
  errorComponent: DashboardError,
  component: Dashboard,
})

function Dashboard() {
  const league = useLeagueContext()
  // Data is already in the cache — no second loading state.
  const { data: summary } = useSuspenseQuery(summaryQueryOptions(league))
  const { data: players } = useSuspenseQuery(playersQueryOptions(league))
  const { data: pool } = useSuspenseQuery(poolQueryOptions(league))
  const { data: settings } = useSuspenseQuery(settingsQueryOptions(league))

  const hasPlayers = players.length > 0

  return (
    <div className="flex flex-col gap-4">
      <DashboardGreeting />

      {summary.activeRound && (
        <ActiveRoundBanner
          number={summary.activeRound.number}
          openGames={summary.activeRound.openGames}
          totalGames={summary.activeRound.totalGames}
        />
      )}

      <DashboardStats summary={summary} />

      {hasPlayers ? (
        <LeaderboardCard
          players={players}
          pool={pool}
          config={settings.table}
          playerLinkParams={{
            organizationSlug: league.organizationSlug,
            leagueId: league.id,
          }}
          action={
            <CreatePlayerButton
              initialRating={settings.initialRating}
              initialRd={settings.initialRd}
              labelClassName="hidden sm:inline"
            />
          }
        />
      ) : (
        <PlayerEmptyState settings={settings} />
      )}
    </div>
  )
}

function DashboardError({ reset }: ErrorComponentProps) {
  return <RouteError description={route_error_dashboard()} reset={reset} />
}
