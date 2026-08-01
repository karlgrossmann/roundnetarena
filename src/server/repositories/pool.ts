import "@tanstack/react-start/server-only"

import { and, eq, inArray, sql } from "drizzle-orm"

import type { HistoricalRound } from "@/lib/matchmaking/weights"
import type { PauseStats } from "@/lib/matchmaking/pause"
import type { FixedTeam, PlayerId, Pool, PoolEntry } from "@/lib/types"

import { getDb } from "../db/client"
import type { Executor } from "../db/client"
import { fromPoolStatus, toPoolStatus } from "../db/mappers"
import {
  gameParticipations,
  playerPoolMembers,
  playerPools,
} from "../db/schema"
import { findPlayerRefs } from "./players"

export async function findPool(
  executor: Executor = getDb(),
  leagueId: string
): Promise<Pool> {
  const poolRows = await executor
    .select()
    .from(playerPools)
    .where(eq(playerPools.leagueId, leagueId))
  const poolRow = poolRows.at(0)
  const rows = await executor
    .select()
    .from(playerPoolMembers)
    .where(eq(playerPoolMembers.leagueId, leagueId))
  const refs = await findPlayerRefs(executor, leagueId)

  const entries = rows.flatMap((row): Array<PoolEntry> => {
    const player = refs.get(row.playerId)
    return player ? [{ player, status: toPoolStatus(row.status) }] : []
  })
  const teams = new Map<string, Array<PlayerId>>()
  rows.forEach((row) => {
    if (!row.fixedTeamKey) return
    teams.set(row.fixedTeamKey, [
      ...(teams.get(row.fixedTeamKey) ?? []),
      row.playerId,
    ])
  })
  const fixedTeams = [...teams.entries()].flatMap(
    ([id, playerIds]): Array<FixedTeam> =>
      playerIds.length === 2
        ? [{ id, players: [playerIds[0], playerIds[1]] }]
        : []
  )

  return {
    updatedAt: (poolRow?.updatedAt ?? new Date(0)).toISOString(),
    entries,
    fixedTeams,
  }
}

export async function replacePool(
  executor: Executor,
  leagueId: string,
  pool: Pool
): Promise<Pool> {
  await executor
    .insert(playerPools)
    .values({ leagueId, updatedAt: new Date(pool.updatedAt) })
    .onConflictDoUpdate({
      target: playerPools.leagueId,
      set: { updatedAt: new Date(pool.updatedAt) },
    })
  await executor
    .delete(playerPoolMembers)
    .where(eq(playerPoolMembers.leagueId, leagueId))

  const fixedTeamByPlayer = new Map(
    pool.fixedTeams.flatMap((team) =>
      team.players.map((playerId) => [playerId, team.id] as const)
    )
  )
  const values = pool.entries.map((entry) => ({
    leagueId,
    playerId: entry.player.id,
    status: fromPoolStatus(entry.status),
    fixedTeamKey: fixedTeamByPlayer.get(entry.player.id) ?? null,
  }))
  if (values.length > 0) {
    await executor.insert(playerPoolMembers).values(values)
  }
  return findPool(executor, leagueId)
}

export async function removePlayerFromPool(
  executor: Executor,
  leagueId: string,
  playerId: PlayerId
): Promise<void> {
  await executor
    .delete(playerPoolMembers)
    .where(
      and(
        eq(playerPoolMembers.leagueId, leagueId),
        eq(playerPoolMembers.playerId, playerId)
      )
    )
}

export async function findPauseStatsToday(
  executor: Executor,
  leagueId: string,
  playerIds: Array<PlayerId>
): Promise<Array<PauseStats>> {
  if (playerIds.length === 0) return []
  const refs = await findPlayerRefs(executor, leagueId)
  const result = await executor.execute(sql<{
    player_id: string
    games_played: number
    games_paused: number
  }>`
    with today as (
      select block_id
      from game_block
      where league_id = ${leagueId}
        and committed
        and date_trunc(
          'day',
          (created_at at time zone 'Europe/Berlin') - interval '5 hours'
        ) = date_trunc(
          'day',
          (now() at time zone 'Europe/Berlin') - interval '5 hours'
        )
    )
    select
      p.player_id,
      (
        select count(*)
        from game_participation gp
        inner join game g on g.game_id = gp.game_id and g.status = 'played'
        where gp.player_id = p.player_id
          and g.block_id in (select block_id from today)
      ) as games_played,
      (
        select count(*)
        from block_pause bp
        where bp.player_id = p.player_id
          and bp.block_id in (select block_id from today)
          and exists (
            select 1
            from game played_pause_game
            where played_pause_game.block_id = bp.block_id
              and played_pause_game.status = 'played'
          )
      ) as games_paused
    from player p
    where p.league_id = ${leagueId}
      and p.player_id in ${sql`(${sql.join(
        playerIds.map((id) => sql`${id}`),
        sql`, `
      )})`}
  `)
  const rows = result.rows as unknown as Array<{
    player_id: string
    games_played: number
    games_paused: number
  }>
  return rows.flatMap((row) => {
    const player = refs.get(row.player_id)
    return player
      ? [
          {
            player,
            gamesPlayedToday: Number(row.games_played),
            gamesPausedToday: Number(row.games_paused),
          },
        ]
      : []
  })
}

export async function findRecentMatchups(
  executor: Executor,
  leagueId: string,
  playerIds: Array<PlayerId>
): Promise<Array<HistoricalRound>> {
  if (playerIds.length === 0) return []
  const gamesResult = await executor.execute(sql<{
    game_id: string
    block_id: string
    timestamp: Date
  }>`
    select g.game_id, b.block_id, b.created_at as timestamp
    from game g
    inner join game_block b on b.block_id = g.block_id
    where b.league_id = ${leagueId}
      and b.committed
      and g.status = 'played'
      and b.created_at >= now() - interval '9 days'
      and exists (
        select 1
        from game_participation selected
        where selected.game_id = g.game_id
          and selected.player_id in ${sql`(${sql.join(
            playerIds.map((id) => sql`${id}`),
            sql`, `
          )})`}
      )
    order by b.created_at, g.local_idx
  `)
  const gameRows = gamesResult.rows as unknown as Array<{
    game_id: string
    block_id: string
    timestamp: Date
  }>
  const gameIds = gameRows.map((row) => row.game_id)
  if (gameIds.length === 0) return []
  const rows = await executor
    .select({
      gameId: gameParticipations.gameId,
      playerId: gameParticipations.playerId,
      team: gameParticipations.team,
    })
    .from(gameParticipations)
    .where(
      and(
        eq(gameParticipations.leagueId, leagueId),
        inArray(gameParticipations.gameId, gameIds)
      )
    )
  const rounds = new Map<string, HistoricalRound>()
  gameRows.forEach((gameRow) => {
    const seats = rows.filter((row) => row.gameId === gameRow.game_id)
    const teamA = seats
      .filter((seat) => seat.team === "a")
      .toSorted((first, second) =>
        first.playerId.localeCompare(second.playerId)
      )
      .map((seat) => seat.playerId)
    const teamB = seats
      .filter((seat) => seat.team === "b")
      .toSorted((first, second) =>
        first.playerId.localeCompare(second.playerId)
      )
      .map((seat) => seat.playerId)
    if (teamA.length !== 2 || teamB.length !== 2) return

    const existing = rounds.get(gameRow.block_id)
    const matchup = {
      teamA: [teamA[0], teamA[1]] as [PlayerId, PlayerId],
      teamB: [teamB[0], teamB[1]] as [PlayerId, PlayerId],
    }
    rounds.set(
      gameRow.block_id,
      existing
        ? { ...existing, matchups: [...existing.matchups, matchup] }
        : {
            timestamp: new Date(gameRow.timestamp).toISOString(),
            matchups: [matchup],
          }
    )
  })
  return [...rounds.values()]
}
