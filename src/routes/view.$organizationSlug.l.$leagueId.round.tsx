import { IconBallVolleyball } from "@/components/icons"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteError } from "@/components/RouteError"
import { ReadOnlyActiveRound } from "@/components/public-view/ReadOnlyActiveRound"
import { RoundSkeleton } from "@/components/round/RoundSkeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { publicViewActiveRoundQueryOptions } from "@/lib/api/queries"
import { publicViewRouteHead } from "@/lib/public-view-head"
import {
  public_view_error,
  public_view_no_active_round,
  public_view_no_active_round_description,
} from "@/paraglide/messages.js"

export const Route = createFileRoute(
  "/view/$organizationSlug/l/$leagueId/round"
)({
  head: () => publicViewRouteHead("round"),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      publicViewActiveRoundQueryOptions(params)
    ),
  pendingComponent: RoundSkeleton,
  errorComponent: PublicRoundError,
  component: PublicRound,
})

function PublicRound() {
  const params = Route.useParams()
  const { data: round } = useSuspenseQuery(
    publicViewActiveRoundQueryOptions(params)
  )
  if (round) return <ReadOnlyActiveRound round={round} />
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconBallVolleyball />
        </EmptyMedia>
        <EmptyTitle>{public_view_no_active_round()}</EmptyTitle>
        <EmptyDescription>
          {public_view_no_active_round_description()}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function PublicRoundError({ reset }: ErrorComponentProps) {
  return <RouteError description={public_view_error()} reset={reset} />
}
