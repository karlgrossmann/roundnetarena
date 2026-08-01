import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteError } from "@/components/RouteError"
import { HistorySkeleton } from "@/components/history/HistorySkeleton"
import { PublicSessionHistory } from "@/components/public-view/PublicSessionHistory"
import { publicViewHistoryQueryOptions } from "@/lib/api/queries"
import { publicViewRouteHead } from "@/lib/public-view-head"
import { public_view_error } from "@/paraglide/messages.js"

export const Route = createFileRoute(
  "/view/$organizationSlug/l/$leagueId/history"
)({
  head: () => publicViewRouteHead("history"),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      publicViewHistoryQueryOptions(params, "all")
    ),
  pendingComponent: HistorySkeleton,
  errorComponent: PublicHistoryError,
  component: PublicSessionHistory,
})

function PublicHistoryError({ reset }: ErrorComponentProps) {
  return <RouteError description={public_view_error()} reset={reset} />
}
