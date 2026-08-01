import { Fragment } from "react"
import { Link } from "@tanstack/react-router"
import type { Table as TableInstance } from "@tanstack/react-table"

import { metaEntries } from "./columns"
import { formatRating } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { LeaderboardPlayer, TableColumn } from "@/lib/types"

interface LeaderboardListProps {
  table: TableInstance<LeaderboardPlayer>
  /** Rank numbers in display order; `null` means a tie with the row above. */
  ranks: Array<number | null>
  visibleColumns: Array<TableColumn>
  colorRatingChange: boolean
  emptyMessage: string | null
  playerLinkParams?: { organizationSlug: string; leagueId: string }
}

/** List presentation below `md`: rank and name on the left, the rating large on the
 *  right. Same data source as the table — only arranged differently. */
export function LeaderboardList({
  table,
  ranks,
  visibleColumns,
  colorRatingChange,
  emptyMessage,
  playerLinkParams,
}: LeaderboardListProps) {
  if (emptyMessage) {
    return (
      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className="divide-y">
      {table.getRowModel().rows.map((row, index) => {
        const player = row.original
        const rank = ranks[index]
        const isFirst = rank === 1
        const meta = metaEntries(visibleColumns, player, colorRatingChange)

        return (
          <li key={row.id}>
            {playerLinkParams ? (
              <Link
                to="/o/$organizationSlug/l/$leagueId/player/$playerId"
                params={{ ...playerLinkParams, playerId: player.id }}
                className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
              >
                <PlayerRow
                  player={player}
                  rank={rank}
                  isFirst={isFirst}
                  meta={meta}
                />
              </Link>
            ) : (
              <div className="flex min-h-14 items-center gap-3 px-4 py-2.5">
                <PlayerRow
                  player={player}
                  rank={rank}
                  isFirst={isFirst}
                  meta={meta}
                />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function PlayerRow({
  player,
  rank,
  isFirst,
  meta,
}: {
  player: LeaderboardPlayer
  rank: number | null | undefined
  isFirst: boolean
  meta: ReturnType<typeof metaEntries>
}) {
  return (
    <>
      <span
        className={cn(
          "w-5 shrink-0 text-right text-sm tabular-nums",
          isFirst ? "font-semibold text-primary" : "text-muted-foreground"
        )}
      >
        {rank ?? ""}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {player.displayName}
        </span>
        {meta.length > 0 ? (
          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            {meta.map((entry, entryIndex) => (
              <Fragment key={entry.column}>
                {entryIndex > 0 ? <span aria-hidden="true">·</span> : null}
                {entry.node}
              </Fragment>
            ))}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "shrink-0 font-heading text-lg font-semibold tabular-nums",
          isFirst && "text-primary"
        )}
      >
        {formatRating(player.rating)}
      </span>
    </>
  )
}
