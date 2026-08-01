import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteError } from "@/components/RouteError"
import { HistorySkeleton } from "@/components/history/HistorySkeleton"
import { SessionHistory } from "@/components/history/SessionHistory"
import { historyQueryOptions } from "@/lib/api/queries"
import { localizedRouteHead } from "@/lib/i18n"
import { ensureLeagueRouteContext } from "@/lib/api/league-route"
import { route_error_history } from "@/paraglide/messages.js"

export const Route = createFileRoute(
  "/o/$organizationSlug/l/$leagueId/history"
)({
  staticData: { titleKey: "history" },
  head: () => localizedRouteHead("history"),
  loader: async ({ context, params }) => {
    const league = await ensureLeagueRouteContext(context.queryClient, params)
    return context.queryClient.ensureQueryData(
      historyQueryOptions(league, "all")
    )
  },
  pendingComponent: HistorySkeleton,
  errorComponent: HistoryError,
  component: SessionHistory,
})

function HistoryError({ reset }: ErrorComponentProps) {
  return <RouteError description={route_error_history()} reset={reset} />
}
