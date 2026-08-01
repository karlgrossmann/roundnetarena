import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { IconSearch } from "@/components/icons"
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type { SortingState } from "@tanstack/react-table"

import { ColumnsMenu } from "./ColumnsMenu"
import { LeaderboardList } from "./LeaderboardList"
import { LeaderboardPoolFilter } from "./LeaderboardPoolFilter"
import { LeaderboardTable } from "./LeaderboardTable"
import { buildLeaderboardColumns } from "./columns"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  assignRanks,
  filterPlayers,
  filterPlayersByIds,
  filterPlayersByPool,
} from "@/lib/leaderboard"
import type {
  LeaderboardPlayer,
  Pool,
  TableColumn,
  TableConfig,
} from "@/lib/types"
import {
  leaderboard_empty_pool,
  leaderboard_no_search_result,
  leaderboard_player_count,
  leaderboard_scoped_player_count,
  leaderboard_search_label,
  leaderboard_search_placeholder,
  leaderboard_title,
} from "@/paraglide/messages.js"

interface LeaderboardCardProps {
  players: Array<LeaderboardPlayer>
  pool?: Pool
  currentPoolPlayerIds?: Array<string>
  config: TableConfig
  playerLinkParams?: { organizationSlug: string; leagueId: string }
  /** Sits to the right of the search. The card doesn't know the action — that keeps it
   *  free of player management. */
  action?: ReactNode
}

/**
 * The dashboard's table.
 *
 * One data model, two presentations: a list below `md`, a real table from `md` up. Both
 * draw their rows from the same TanStack Table instance so sorting and search cannot
 * drift apart.
 */
export function LeaderboardCard({
  players,
  pool,
  currentPoolPlayerIds,
  config,
  action,
  playerLinkParams,
}: LeaderboardCardProps) {
  const [search, setSearch] = useState("")
  const [onlyCurrentPool, setOnlyCurrentPool] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<Array<TableColumn>>(
    config.columns
  )
  const [sorting, setSorting] = useState<SortingState>([
    { id: config.sortBy, desc: true },
  ])

  // At this data volume, client-side filtering without debounce is enough.
  const publicPoolIds = useMemo(
    () => new Set(currentPoolPlayerIds ?? []),
    [currentPoolPlayerIds]
  )
  const scopedPlayers = useMemo(() => {
    if (pool) return filterPlayersByPool(players, pool, onlyCurrentPool)
    return filterPlayersByIds(players, publicPoolIds, onlyCurrentPool)
  }, [players, pool, publicPoolIds, onlyCurrentPool])
  const filtered = useMemo(
    () => filterPlayers(scopedPlayers, search),
    [scopedPlayers, search]
  )

  const columns = useMemo(
    () => buildLeaderboardColumns(visibleColumns, config.colorRatingChange),
    [visibleColumns, config.colorRatingChange]
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const rows = table.getRowModel().rows
  const ranks = useMemo(
    () => assignRanks(rows.map((row) => row.original.rating)),
    [rows]
  )

  const emptyMessage =
    rows.length === 0
      ? search.trim() !== ""
        ? leaderboard_no_search_result({ query: search.trim() })
        : onlyCurrentPool
          ? leaderboard_empty_pool()
          : null
      : null

  return (
    <Card className="gap-0">
      <CardHeader className="pb-(--card-spacing)">
        <CardTitle>{leaderboard_title()}</CardTitle>
        <CardDescription>
          {onlyCurrentPool
            ? leaderboard_scoped_player_count({
                shown: scopedPlayers.length,
                total: players.length,
              })
            : leaderboard_player_count({ count: players.length })}
        </CardDescription>
        <CardAction>
          <ColumnsMenu
            visibleColumns={visibleColumns}
            onChange={setVisibleColumns}
          />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col items-stretch gap-1 pb-(--card-spacing)">
        <div className="flex items-center gap-2">
          <InputGroup className="min-w-0 flex-1">
            <InputGroupAddon>
              <IconSearch />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder={leaderboard_search_placeholder()}
              aria-label={leaderboard_search_label()}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </InputGroup>
          {action}
        </div>
        <LeaderboardPoolFilter
          checked={onlyCurrentPool}
          onCheckedChange={setOnlyCurrentPool}
        />
      </CardContent>

      <div className="border-t md:hidden">
        <LeaderboardList
          table={table}
          ranks={ranks}
          visibleColumns={visibleColumns}
          colorRatingChange={config.colorRatingChange}
          emptyMessage={emptyMessage}
          playerLinkParams={playerLinkParams}
        />
      </div>

      <div className="hidden border-t md:block">
        <LeaderboardTable
          table={table}
          ranks={ranks}
          emptyMessage={emptyMessage}
          playerLinkParams={playerLinkParams}
        />
      </div>
    </Card>
  )
}
