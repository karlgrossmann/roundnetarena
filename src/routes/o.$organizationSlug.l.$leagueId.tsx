import { useSuspenseQuery } from "@tanstack/react-query"
import { Outlet, createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { LeagueContextProvider } from "@/components/league/LeagueContext"
import { RouteError } from "@/components/RouteError"
import { ensureLeagueRouteContext } from "@/lib/api/league-route"
import { leagueContextQueryOptions } from "@/lib/api/queries"
import { route_error_dashboard } from "@/paraglide/messages.js"

export const Route = createFileRoute("/o/$organizationSlug/l/$leagueId")({
  loader: ({ context, params }) =>
    ensureLeagueRouteContext(context.queryClient, params),
  errorComponent: LeagueContextError,
  component: LeagueLayout,
})

function LeagueLayout() {
  const { organizationSlug, leagueId } = Route.useParams()
  const organizationId = Route.useLoaderData().organizationId
  const { data: league } = useSuspenseQuery(
    leagueContextQueryOptions(organizationId, organizationSlug, leagueId)
  )

  return (
    <LeagueContextProvider value={league}>
      <Outlet />
    </LeagueContextProvider>
  )
}

function LeagueContextError({ reset }: ErrorComponentProps) {
  return <RouteError description={route_error_dashboard()} reset={reset} />
}
