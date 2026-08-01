import { IconChevronRight } from "@/components/icons"
import { Link } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import type { ActiveRoundLink } from "./SessionDayCard"
import { formatTime } from "@/lib/format"
import { cancelledLabel, roundSummaryLabel } from "@/lib/history"
import type { RoundSummary } from "@/lib/types"
import { history_round_title, status_running } from "@/paraglide/messages.js"

interface HistoryRoundRowProps {
  round: RoundSummary
  activeRoundLink: ActiveRoundLink
}

/**
 * One round in the history.
 *
 * The running round links back to `/round` — it is the only entry with anything left to
 * do. Committed rounds are plain text: a detail view only exists once the API serves
 * single rounds, and a link into nothing would be worse than none.
 */
export function HistoryRoundRow({
  round,
  activeRoundLink,
}: HistoryRoundRowProps) {
  if (round.status === "active") {
    if (activeRoundLink.mode === "public") {
      return (
        <Link
          to="/view/$organizationSlug/l/$leagueId/round"
          params={activeRoundLink}
          className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
        >
          <RoundDescription round={round} activeRoundLink={activeRoundLink} />
          <RoundTime round={round} activeRoundLink={activeRoundLink} />
          <IconChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      )
    }
    return (
      <Link
        to="/o/$organizationSlug/l/$leagueId/round"
        params={{
          organizationSlug: activeRoundLink.organizationSlug,
          leagueId: activeRoundLink.leagueId,
        }}
        className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
      >
        <RoundDescription round={round} activeRoundLink={activeRoundLink} />
        <RoundTime round={round} activeRoundLink={activeRoundLink} />
        <IconChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    )
  }

  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2.5">
      <RoundDescription round={round} activeRoundLink={activeRoundLink} />
      <RoundTime round={round} activeRoundLink={activeRoundLink} />
    </div>
  )
}

function RoundDescription({ round }: HistoryRoundRowProps) {
  const cancelled = cancelledLabel(round)

  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">
          {history_round_title({ number: round.number })}
        </span>

        {round.status === "active" && <Badge>{status_running()}</Badge>}
        {cancelled && <Badge variant="outline">{cancelled}</Badge>}
      </div>

      <p className="text-sm text-muted-foreground">
        {roundSummaryLabel(round)}
      </p>
    </div>
  )
}

function RoundTime({ round }: HistoryRoundRowProps) {
  return (
    <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
      {formatTime(round.startedAt)}
    </span>
  )
}
