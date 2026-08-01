import "@tanstack/react-start/server-only"

import { sql } from "drizzle-orm"

import type { DashboardSummary } from "@/lib/types"

import { getDb } from "../db/client"
import type { Executor } from "../db/client"

export async function findSummary(
  executor: Executor = getDb(),
  leagueId: string
): Promise<DashboardSummary> {
  const result = await executor.execute(sql<{
    player_count: number
    games_total: number
    games_today: number
    session_count: number
    active_id: string | null
    active_number: number | null
    open_games: number | null
    total_games: number | null
  }>`
    with local_blocks as (
      select
        b.*,
        date_trunc(
          'day',
          (b.created_at at time zone 'Europe/Berlin') - interval '5 hours'
        ) as session_day,
        row_number() over (
          partition by date_trunc(
            'day',
            (b.created_at at time zone 'Europe/Berlin') - interval '5 hours'
          )
          order by b.seq
        ) as local_number
      from game_block b
      where b.league_id = ${leagueId}
    ),
    totals as (
      select
        (select count(*) from player p where p.league_id = ${leagueId} and not p.marked_as_deleted) as player_count,
        count(g.game_id) filter (where lb.committed and g.status = 'played') as games_total,
        count(g.game_id) filter (
          where lb.committed
            and g.status = 'played'
            and lb.session_day = date_trunc(
              'day',
              (now() at time zone 'Europe/Berlin') - interval '5 hours'
            )
        ) as games_today,
        count(distinct lb.session_day) filter (where lb.committed) as session_count
      from local_blocks lb
      left join game g on g.block_id = lb.block_id
    ),
    active as (
      select
        lb.block_id,
        lb.local_number,
        count(g.game_id) filter (where g.status = 'proposed') as open_games,
        count(g.game_id) as total_games
      from local_blocks lb
      inner join game g on g.block_id = lb.block_id
      where not lb.committed
      group by lb.block_id, lb.local_number
      limit 1
    )
    select
      totals.*,
      active.block_id as active_id,
      active.local_number as active_number,
      active.open_games,
      active.total_games
    from totals
    left join active on true
  `)
  const row = result.rows[0] as unknown as {
    player_count: number
    games_total: number
    games_today: number
    session_count: number
    active_id: string | null
    active_number: number | null
    open_games: number | null
    total_games: number | null
  }

  return {
    playerCount: Number(row.player_count),
    gamesTotal: Number(row.games_total),
    gamesToday: Number(row.games_today),
    sessionCount: Number(row.session_count),
    activeRound: row.active_id
      ? {
          id: row.active_id,
          number: Number(row.active_number),
          openGames: Number(row.open_games),
          totalGames: Number(row.total_games),
        }
      : undefined,
  }
}
