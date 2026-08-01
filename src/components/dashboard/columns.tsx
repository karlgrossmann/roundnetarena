import type { ReactNode } from "react"
import { createColumnHelper } from "@tanstack/react-table"
import type { ColumnDef } from "@tanstack/react-table"

import { RatingDelta } from "@/components/RatingDelta"
import {
  formatDelta,
  formatRating,
  formatRd,
  formatWinPercentage,
} from "@/lib/format"
import { columnLabel, columnValue } from "@/lib/leaderboard"
import type { LeaderboardPlayer, TableColumn } from "@/lib/types"
import { count_games, count_losses, count_wins } from "@/paraglide/messages.js"

const helper = createColumnHelper<LeaderboardPlayer>()

/**
 * Column definitions for TanStack Table — one per visible value.
 *
 * Rank and name are deliberately not among them: the rank only follows from the sorted
 * order, and the name carries the link to the player page. Both are rendered by hand in
 * `LeaderboardTable`. What remains are purely numeric columns — hence the uniform value
 * type.
 */
export function buildLeaderboardColumns(
  visibleColumns: Array<TableColumn>,
  colorRatingChange: boolean
): Array<ColumnDef<LeaderboardPlayer, number>> {
  return visibleColumns.map((column) =>
    helper.accessor((player) => columnValue(player, column), {
      id: column,
      header: columnLabel(column),
      sortDescFirst: true,
      cell: (context) =>
        renderCell(column, context.row.original, colorRatingChange),
    })
  )
}

/** Cell content of the table from `md` up. */
function renderCell(
  column: TableColumn,
  player: LeaderboardPlayer,
  colorRatingChange: boolean
): ReactNode {
  switch (column) {
    case "rating":
      return formatRating(player.rating)
    case "rd":
      return formatRd(player.rd)
    case "gamesPlayed":
      return player.gamesPlayed
    case "gamesWon":
      return player.gamesWon
    case "gamesLost":
      return player.gamesLost
    case "winPercentage":
      return formatWinPercentage(player.gamesWon, player.gamesPlayed)
    case "totalRatingChange":
      return colorRatingChange ? (
        <RatingDelta delta={player.totalRatingChange} />
      ) : (
        formatDelta(player.totalRatingChange)
      )
  }
}

/** At most this many figures sit below the name under `md`. More turns into a wall. */
const MAX_META_ENTRIES = 3

/**
 * Figures for the list presentation below `md`: "RD 48 · 34 games · 62 %".
 *
 * The rating is left out because the list already shows it large on the right. The
 * selection follows the visible columns — so the columns menu works on the phone too.
 */
export function metaEntries(
  visibleColumns: Array<TableColumn>,
  player: LeaderboardPlayer,
  colorRatingChange: boolean
): Array<{ column: TableColumn; node: ReactNode }> {
  return visibleColumns
    .filter((column) => column !== "rating")
    .slice(0, MAX_META_ENTRIES)
    .map((column) => ({
      column,
      node: renderMetaEntry(column, player, colorRatingChange),
    }))
}

function renderMetaEntry(
  column: TableColumn,
  player: LeaderboardPlayer,
  colorRatingChange: boolean
): ReactNode {
  switch (column) {
    case "rating":
      return formatRating(player.rating)
    case "rd":
      return `RD ${formatRd(player.rd)}`
    case "gamesPlayed":
      return count_games({ count: player.gamesPlayed })
    case "gamesWon":
      return count_wins({ count: player.gamesWon })
    case "gamesLost":
      return count_losses({ count: player.gamesLost })
    case "winPercentage":
      return formatWinPercentage(player.gamesWon, player.gamesPlayed)
    case "totalRatingChange":
      return colorRatingChange ? (
        <RatingDelta delta={player.totalRatingChange} size="sm" />
      ) : (
        formatDelta(player.totalRatingChange)
      )
  }
}
