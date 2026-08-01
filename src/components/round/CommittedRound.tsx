import { useSuspenseQuery } from "@tanstack/react-query"

import { RatingChangeList } from "./RatingChangeList"
import { useLeagueContext } from "@/components/league/LeagueContext"
import { StickyActionBar } from "@/components/layout/StickyActionBar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { poolQueryOptions } from "@/lib/api/queries"
import { countPoolStatus, poolSummaryLabel } from "@/lib/pool"
import { committedRatingChanges, committedRoundSummary } from "@/lib/round-view"
import type { Round } from "@/lib/types"
import {
  common_final,
  round_change_pool,
  round_completed_badge,
  round_completed_title,
  round_next,
  round_nothing_scored,
  round_pool_kept,
  round_rating_changes,
  round_saved_history,
} from "@/paraglide/messages.js"

interface CommittedRoundProps {
  round: Round
  /**
   * Leads back to the pool state. "Start next round" and "Change" do the same thing —
   * the pool is both the next step and the place to adjust it.
   */
  onBackToPool: () => void
}

/**
 * `/round` right after the commit: shows what the commit changed and offers exactly one
 * way onward.
 *
 * The round comes from the commit mutation, not from a query; only the pool is read,
 * and that one is already in the cache.
 */
export function CommittedRound({ round, onBackToPool }: CommittedRoundProps) {
  const league = useLeagueContext()
  const { data: pool } = useSuspenseQuery(poolQueryOptions(league))

  const changes = committedRatingChanges(round)
  const counts = countPoolStatus(pool.entries)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <Badge className="bg-success text-success-foreground">
            {round_completed_badge()}
          </Badge>

          <div>
            <p className="font-heading text-lg font-medium">
              {round_completed_title({ number: round.number })}
            </p>
            <p className="text-sm text-muted-foreground">
              {committedRoundSummary(round)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{round_rating_changes()}</CardTitle>
          <CardAction>
            <span className="text-xs text-muted-foreground">
              {common_final()}
            </span>
          </CardAction>
        </CardHeader>

        <CardContent>
          {changes.length > 0 ? (
            <RatingChangeList changes={changes} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {round_nothing_scored()}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            {/* The pool survives the round — saying so avoids the fear of having to
                re-enter everyone. */}
            <p className="text-sm font-medium">{round_pool_kept()}</p>
            <p className="text-sm text-muted-foreground">
              {poolSummaryLabel(counts)}
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={onBackToPool}>
            {round_change_pool()}
          </Button>
        </CardContent>
      </Card>

      <StickyActionBar hint={round_saved_history({ number: round.number })}>
        <Button size="lg" className="h-12 w-full" onClick={onBackToPool}>
          {round_next()}
        </Button>
      </StickyActionBar>
    </div>
  )
}
