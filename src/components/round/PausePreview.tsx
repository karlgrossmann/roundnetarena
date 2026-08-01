import { Fragment } from "react"
import { IconChevronDown } from "@/components/icons"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { useLeagueContext } from "@/components/league/LeagueContext"
import { Card } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { pausePreviewQueryOptions } from "@/lib/api/queries"
import { formatPauseQuota } from "@/lib/format"
import {
  noPauseSentence,
  pauseBoundaryIndex,
  sortPauseCandidates,
} from "@/lib/pool"
import { playersAtRest } from "@/lib/round"
import { playerRefDisplayName } from "@/lib/player-display"
import type { PauseCandidate } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  common_name,
  common_preview,
  common_retry,
  round_pause_preview_boundary,
  round_pause_preview_description,
  round_pause_preview_error,
  round_pause_preview_paused,
  round_pause_preview_played,
  round_pause_preview_rate,
  round_pause_preview_title,
} from "@/paraglide/messages.js"

interface PausePreviewProps {
  courts: number
  playingCount: number
}

const PLACEHOLDER_ROWS = 5

/**
 * "Who would have to sit out?" — collapsed by default, since the question only matters
 * once not everyone can play.
 *
 * The data depends on the court count and therefore on page state, so it belongs here
 * with its own loading state rather than in the route loader.
 */
export function PausePreview({ courts, playingCount }: PausePreviewProps) {
  const league = useLeagueContext()
  const preview = useQuery(pausePreviewQueryOptions(league, courts))
  const nobodyRests = playersAtRest(playingCount, courts) === 0

  return (
    <Card className="gap-0 py-0">
      <Collapsible>
        <CollapsibleTrigger className="group/preview flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <span className="flex-1 font-heading text-base font-medium">
            {round_pause_preview_title()}
          </span>
          <span className="text-xs text-muted-foreground">
            {common_preview()}
          </span>
          <IconChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/preview:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t px-4 py-3">
          {nobodyRests ? (
            <p className="text-sm text-muted-foreground">
              {noPauseSentence(playingCount, courts)}
            </p>
          ) : (
            <PreviewBody
              isPending={preview.isPending}
              isError={preview.isError}
              onRetry={() => void preview.refetch()}
              candidates={preview.data ?? []}
            />
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

interface PreviewBodyProps {
  isPending: boolean
  isError: boolean
  onRetry: () => void
  candidates: Array<PauseCandidate>
}

function PreviewBody({
  isPending,
  isError,
  onRetry,
  candidates,
}: PreviewBodyProps) {
  if (isPending) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-muted-foreground">
          {round_pause_preview_error()}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {common_retry()}
        </Button>
      </div>
    )
  }

  const sorted = sortPauseCandidates(candidates)
  const boundary = pauseBoundaryIndex(sorted)

  return (
    <>
      <p className="mb-2 text-sm text-muted-foreground">
        {round_pause_preview_description()}
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{common_name()}</TableHead>
            <TableHead className="text-right">
              {round_pause_preview_played()}
            </TableHead>
            <TableHead className="text-right">
              {round_pause_preview_paused()}
            </TableHead>
            <TableHead className="text-right">
              {round_pause_preview_rate()}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((candidate, index) => (
            <Fragment key={candidate.player.id}>
              {index === boundary && <BoundaryRow />}

              <TableRow
                className={cn(
                  // Pausing is not an error state — muted, not red.
                  candidate.willPause && "text-muted-foreground"
                )}
              >
                <TableCell className="font-medium">
                  {playerRefDisplayName(candidate.player)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {candidate.gamesPlayedToday}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {candidate.gamesPausedToday}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPauseQuota(candidate.pauseQuota)}
                </TableCell>
              </TableRow>
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

/** The table's actual message: from here on, people play. */
function BoundaryRow() {
  return (
    <TableRow className="border-b-0 hover:bg-transparent">
      <TableCell
        colSpan={4}
        className="border-t-2 border-dashed border-primary px-0 pt-1.5 pb-1 text-center text-[0.6875rem] font-medium tracking-wide text-primary uppercase"
      >
        {round_pause_preview_boundary()}
      </TableCell>
    </TableRow>
  )
}
