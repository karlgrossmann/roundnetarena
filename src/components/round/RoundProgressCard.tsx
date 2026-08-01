import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { roundProgress } from "@/lib/round"
import { roundProgressLabel } from "@/lib/round-view"
import type { Round } from "@/lib/types"
import {
  round_progress_aria,
  round_ratings_commit_notice,
  status_running,
} from "@/paraglide/messages.js"

/**
 * Round progress — plus the sentence everything hinges on.
 *
 * Without the notice the commit looks like a redundant intermediate step and gets
 * skipped, leaving the match day without its scores.
 */
interface RoundProgressCardProps {
  round: Round
  /** Side actions below the notice. They sit here rather than on the games because they
   *  affect several or all games of the round. */
  action?: ReactNode
}

export function RoundProgressCard({ round, action }: RoundProgressCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="flex-1 text-sm">{roundProgressLabel(round)}</span>
          <Badge>{status_running()}</Badge>
        </div>

        <Progress
          value={roundProgress(round) * 100}
          aria-label={round_progress_aria()}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {round_ratings_commit_notice()}
          </p>
          {action}
        </div>
      </CardContent>
    </Card>
  )
}
