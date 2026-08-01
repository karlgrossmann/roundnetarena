import { useState } from "react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteError } from "@/components/RouteError"
import { ActiveRound } from "@/components/round/ActiveRound"
import { CommittedRound } from "@/components/round/CommittedRound"
import { RoundPool } from "@/components/round/RoundPool"
import { RoundSkeleton } from "@/components/round/RoundSkeleton"
import {
  activeRoundQueryOptions,
  playersQueryOptions,
  poolQueryOptions,
  settingsQueryOptions,
} from "@/lib/api/queries"
import { ensureLeagueRouteContext } from "@/lib/api/league-route"
import { useLeagueContext } from "@/components/league/LeagueContext"
import type { Round } from "@/lib/types"
import { localizedRouteHead } from "@/lib/i18n"
import { route_error_round } from "@/paraglide/messages.js"

export const Route = createFileRoute("/o/$organizationSlug/l/$leagueId/round")({
  staticData: { titleKey: "round" },
  head: () => localizedRouteHead("round"),
  loader: async ({ context, params }) => {
    const league = await ensureLeagueRouteContext(context.queryClient, params)
    // In parallel, not sequentially — two consecutive `await`s double the wait.
    await Promise.all([
      context.queryClient.ensureQueryData(activeRoundQueryOptions(league)),
      context.queryClient.ensureQueryData(poolQueryOptions(league)),
      context.queryClient.ensureQueryData(playersQueryOptions(league)),
      context.queryClient.ensureQueryData(settingsQueryOptions(league)),
    ])
  },
  pendingComponent: RoundSkeleton,
  errorComponent: RoundError,
  component: RoundPage,
})

/**
 * `/round` has several appearances, chosen from the data rather than a search param —
 * the state belongs to the round, not to the view.
 *
 * The just-committed round is the one exception: it is no longer active and therefore in
 * no query. Reloading the page lands back in the pool, which is intended.
 */
function RoundPage() {
  const league = useLeagueContext()
  const { data: activeRound } = useSuspenseQuery(
    activeRoundQueryOptions(league)
  )
  const [committed, setCommitted] = useState<Round | null>(null)

  if (activeRound) {
    return <ActiveRound round={activeRound} onCommitted={setCommitted} />
  }

  if (committed) {
    return (
      <CommittedRound
        round={committed}
        onBackToPool={() => setCommitted(null)}
      />
    )
  }

  return <RoundPool />
}

function RoundError({ reset }: ErrorComponentProps) {
  return <RouteError description={route_error_round()} reset={reset} />
}
