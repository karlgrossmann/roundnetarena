import {
  IconArrowDown,
  IconArrowUp,
  IconMedalFirstPlace,
  IconMedalSecondPlace,
  IconMedalThirdPlace,
  IconSelector,
} from "@/components/icons"
import { Link } from "@tanstack/react-router"
import { flexRender } from "@tanstack/react-table"
import type { Header, Table as TableInstance } from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { LeaderboardPlayer } from "@/lib/types"
import { common_name } from "@/paraglide/messages.js"

interface LeaderboardTableProps {
  table: TableInstance<LeaderboardPlayer>
  /** Rank numbers in display order; `null` means a tie with the row above. */
  ranks: Array<number | null>
  /** Replaces the rows in the table when the search finds nothing. */
  emptyMessage: string | null
  playerLinkParams?: { organizationSlug: string; leagueId: string }
}

/** Table presentation from `md` up. All numbers right-aligned and `tabular-nums` so
 *  columns stay flush regardless of digit width. */
export function LeaderboardTable({
  table,
  ranks,
  emptyMessage,
  playerLinkParams,
}: LeaderboardTableProps) {
  const headers = table.getHeaderGroups()[0]?.headers ?? []
  const rows = table.getRowModel().rows

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 pl-4 text-right">#</TableHead>
          <TableHead>{common_name()}</TableHead>
          {headers.map((header) => (
            <SortableHead key={header.id} header={header} />
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {emptyMessage ? (
          <TableRow>
            <TableCell
              colSpan={headers.length + 2}
              className="py-6 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => {
            const rank = ranks[index]

            return (
              <TableRow key={row.id} className="relative">
                <TableCell
                  className={cn(
                    "pl-4 text-right tabular-nums",
                    rank === 1 ? "font-semibold" : "text-muted-foreground"
                  )}
                >
                  {rank ?? ""}
                </TableCell>

                <TableCell className="font-medium">
                  {/* The link spans the whole row — one control per row, instead of a
                      `div` with a click handler. */}
                  {playerLinkParams ? (
                    <Link
                      to="/o/$organizationSlug/l/$leagueId/player/$playerId"
                      params={{
                        ...playerLinkParams,
                        playerId: row.original.id,
                      }}
                      className="after:absolute after:inset-0 hover:underline"
                    >
                      {row.original.displayName}
                    </Link>
                  ) : (
                    row.original.displayName
                  )}
                  <RankMedal rank={rank} />
                </TableCell>

                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="pr-4 text-right tabular-nums"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}

/** Medal after the name for the top three ranks; a tie (`rank === null`) gets none. */
function RankMedal({ rank }: { rank: number | null }) {
  switch (rank) {
    case 1:
      return <IconMedalFirstPlace className="ml-1.5 inline size-4 text-gold" />
    case 2:
      return (
        <IconMedalSecondPlace className="ml-1.5 inline size-4 text-silver" />
      )
    case 3:
      return (
        <IconMedalThirdPlace className="ml-1.5 inline size-4 text-bronze" />
      )
    default:
      return null
  }
}

function SortableHead({
  header,
}: {
  header: Header<LeaderboardPlayer, unknown>
}) {
  const sorted = header.column.getIsSorted()

  return (
    <TableHead
      className="pr-4 text-right last:pr-4"
      aria-sort={
        sorted === "asc"
          ? "ascending"
          : sorted === "desc"
            ? "descending"
            : "none"
      }
    >
      <button
        type="button"
        onClick={header.column.getToggleSortingHandler()}
        className="ml-auto flex items-center gap-1 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none data-[sorted=true]:text-foreground"
        data-sorted={sorted !== false}
      >
        {flexRender(header.column.columnDef.header, header.getContext())}
        {sorted === "asc" ? (
          <IconArrowUp className="size-3.5" />
        ) : sorted === "desc" ? (
          <IconArrowDown className="size-3.5" />
        ) : (
          <IconSelector className="size-3.5 opacity-50" />
        )}
      </button>
    </TableHead>
  )
}
