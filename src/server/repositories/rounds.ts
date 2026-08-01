import "@tanstack/react-start/server-only"

import { and, asc, eq, inArray, sql } from "drizzle-orm"

import { rateDoublesGame } from "@/lib/glicko"
import type { GlickoRating } from "@/lib/glicko"
import type { HistoricalRound } from "@/lib/matchmaking/weights"
import type { TimeRange } from "@/lib/time-range"
import type {
  Game,
  GameId,
  MatchExplanation,
  PausingPlayer,
  PlayerId,
  PlayerRef,
  RatingChange,
  Round,
  RoundId,
  SessionDay,
} from "@/lib/types"

import { getDb } from "../db/client"
import type { Executor } from "../db/client"
import { createId } from "../db/ids"
import { toGameStatus, toMatchExplanation } from "../db/mappers"
import {
  blockPauses,
  gameBlocks,
  gameParticipations,
  games,
  ratingSnapshots,
} from "../db/schema"
import { findCurrentGlickoRatings, findPlayerRefs } from "./players"
import { statisticsRangeCondition } from "./statistics-range"

export interface NewRound {
  id: RoundId
  leagueId: string
  matchups: Array<[PlayerId, PlayerId, PlayerId, PlayerId]>
  assignedPauses: Array<PlayerId>
  voluntaryPauses: Array<PlayerId>
  explanation?: MatchExplanation
}

export interface PlayedGameRatingInput {
  gameId: GameId
  leagueId: string
  importance: number
  pointsA: number
  pointsB: number
  teamA: [GlickoRating, GlickoRating]
  teamB: [GlickoRating, GlickoRating]
}

export async function findActiveRound(
  executor: Executor = getDb(),
  leagueId: string
): Promise<Round | null> {
  const rows = await executor
    .select({ id: gameBlocks.id })
    .from(gameBlocks)
    .where(
      and(eq(gameBlocks.leagueId, leagueId), eq(gameBlocks.committed, false))
    )
  const row = rows.at(0)
  return row ? findRound(executor, leagueId, row.id) : null
}

export async function findRound(
  executor: Executor = getDb(),
  leagueId: string,
  roundId: RoundId
): Promise<Round | null> {
  const blockResult = await executor.execute(sql<{
    id: string
    committed: boolean
    created_at: Date
    local_number: number
    explanation: unknown
  }>`
    select
      b.block_id as id,
      b.committed,
      b.created_at,
      b.explanation,
      (
        select count(*)
        from game_block numbered
        where numbered.league_id = b.league_id
          and numbered.seq <= b.seq
          and date_trunc(
            'day',
            (numbered.created_at at time zone 'Europe/Berlin') - interval '5 hours'
          ) = date_trunc(
            'day',
            (b.created_at at time zone 'Europe/Berlin') - interval '5 hours'
          )
      ) as local_number
    from game_block b
    where b.league_id = ${leagueId} and b.block_id = ${roundId}
    limit 1
  `)
  const block = blockResult.rows[0] as unknown as
    | {
        id: string
        committed: boolean
        created_at: Date
        local_number: number
        explanation: unknown
      }
    | undefined
  if (!block) return null

  const gameRows = await executor
    .select()
    .from(games)
    .where(and(eq(games.blockId, roundId), eq(games.leagueId, leagueId)))
    .orderBy(asc(games.localIdx))
  const gameIds = gameRows.map((game) => game.id)
  const seats =
    gameIds.length === 0
      ? []
      : await executor
          .select()
          .from(gameParticipations)
          .where(inArray(gameParticipations.gameId, gameIds))
  const refs = await findPlayerRefs(executor, leagueId)
  const snapshotIds = seats.map((seat) => seat.ratingSnapshotId)
  const beforeRows =
    snapshotIds.length === 0
      ? []
      : await executor
          .select()
          .from(ratingSnapshots)
          .where(inArray(ratingSnapshots.id, snapshotIds))
  const afterRows =
    gameIds.length === 0
      ? []
      : await executor
          .select()
          .from(ratingSnapshots)
          .where(inArray(ratingSnapshots.gameId, gameIds))

  const mappedGames = gameRows.flatMap((gameRow): Array<Game> => {
    const gameSeats = seats.filter((seat) => seat.gameId === gameRow.id)
    const teamA = orderedTeam(gameSeats, "a", refs)
    const teamB = orderedTeam(gameSeats, "b", refs)
    if (!teamA || !teamB) return []

    const status = toGameStatus(gameRow.status)
    const result =
      status === "finished" &&
      gameRow.pointsA !== null &&
      gameRow.pointsB !== null
        ? {
            pointsA: gameRow.pointsA,
            pointsB: gameRow.pointsB,
            ratingChanges: ratingChangesForGame(
              gameRow.id,
              gameRow.importance,
              gameRow.pointsA,
              gameRow.pointsB,
              gameSeats,
              beforeRows,
              afterRows,
              refs,
              block.committed
            ),
          }
        : undefined
    return [
      {
        id: gameRow.id,
        court: gameRow.localIdx,
        status,
        teamA: { players: teamA },
        teamB: { players: teamB },
        result,
      },
    ]
  })

  const pauseRows = await executor
    .select()
    .from(blockPauses)
    .where(
      and(eq(blockPauses.blockId, roundId), eq(blockPauses.leagueId, leagueId))
    )
  const pausing = pauseRows.flatMap((row): Array<PausingPlayer> => {
    const player = refs.get(row.playerId)
    return player ? [{ player, reason: row.reason }] : []
  })

  return {
    id: block.id,
    number: Number(block.local_number),
    startedAt: new Date(block.created_at).toISOString(),
    status: block.committed ? "committed" : "active",
    games: mappedGames,
    pausing,
    explanation: toMatchExplanation(block.explanation),
  }
}

export async function insertRound(
  executor: Executor,
  input: NewRound,
  currentRatings: Map<PlayerId, GlickoRating & { snapshotId: string }>
): Promise<void> {
  await executor.insert(gameBlocks).values({
    id: input.id,
    leagueId: input.leagueId,
    explanation: input.explanation,
  })
  for (let index = 0; index < input.matchups.length; index += 1) {
    const matchup = input.matchups[index]
    const gameId = createId("game")
    await executor.insert(games).values({
      id: gameId,
      blockId: input.id,
      leagueId: input.leagueId,
      localIdx: index + 1,
      status: "proposed",
    })
    const seats = [
      { playerId: matchup[0], team: "a" as const, slot: 1 },
      { playerId: matchup[1], team: "a" as const, slot: 2 },
      { playerId: matchup[2], team: "b" as const, slot: 1 },
      { playerId: matchup[3], team: "b" as const, slot: 2 },
    ]
    await executor.insert(gameParticipations).values(
      seats.map((seat) => {
        const rating = currentRatings.get(seat.playerId)
        if (!rating) {
          throw new Error("A player is missing their current rating.")
        }
        return {
          gameId,
          playerId: seat.playerId,
          leagueId: input.leagueId,
          team: seat.team,
          slot: seat.slot,
          ratingSnapshotId: rating.snapshotId,
        }
      })
    )
  }

  const pauses = [
    ...input.assignedPauses.map((playerId) => ({
      blockId: input.id,
      playerId,
      leagueId: input.leagueId,
      reason: "assigned" as const,
    })),
    ...input.voluntaryPauses.map((playerId) => ({
      blockId: input.id,
      playerId,
      leagueId: input.leagueId,
      reason: "voluntary" as const,
    })),
  ]
  if (pauses.length > 0) await executor.insert(blockPauses).values(pauses)
}

export async function lockRound(
  executor: Executor,
  leagueId: string,
  roundId: RoundId
): Promise<{ committed: boolean } | null> {
  const result = await executor.execute(sql<{ committed: boolean }>`
    select committed
    from game_block
    where league_id = ${leagueId} and block_id = ${roundId}
    for update
  `)
  const row = result.rows[0] as unknown as { committed: boolean } | undefined
  return row ?? null
}

export async function updateGameResult(
  executor: Executor,
  leagueId: string,
  roundId: RoundId,
  gameId: GameId,
  pointsA: number,
  pointsB: number
): Promise<boolean> {
  const updated = await executor
    .update(games)
    .set({
      status: "played",
      pointsA,
      pointsB,
      playedAt: new Date(),
    })
    .where(
      and(
        eq(games.id, gameId),
        eq(games.blockId, roundId),
        eq(games.leagueId, leagueId)
      )
    )
    .returning({ id: games.id })
  return updated.length === 1
}

export async function updateGameCancellation(
  executor: Executor,
  leagueId: string,
  roundId: RoundId,
  gameId: GameId,
  cancelled: boolean
): Promise<boolean> {
  const updated = await executor
    .update(games)
    .set(
      cancelled
        ? { status: "cancelled" }
        : {
            status: sql`case
              when ${games.pointsA} is not null and ${games.pointsB} is not null
                then 'played'
              else 'proposed'
            end`,
          }
    )
    .where(
      and(
        eq(games.id, gameId),
        eq(games.blockId, roundId),
        eq(games.leagueId, leagueId)
      )
    )
    .returning({ id: games.id })
  return updated.length === 1
}

export async function cancelAllRoundGames(
  executor: Executor,
  leagueId: string,
  roundId: RoundId
): Promise<void> {
  await executor
    .update(games)
    .set({ status: "cancelled" })
    .where(and(eq(games.blockId, roundId), eq(games.leagueId, leagueId)))
}

export async function cancelOpenRoundGames(
  executor: Executor,
  leagueId: string,
  roundId: RoundId
): Promise<void> {
  await executor
    .update(games)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(games.blockId, roundId),
        eq(games.leagueId, leagueId),
        eq(games.status, "proposed")
      )
    )
}

export async function findPlayedGameRatingInputs(
  executor: Executor,
  leagueId: string,
  roundId: RoundId
): Promise<Array<PlayedGameRatingInput>> {
  const playedGames = await executor
    .select()
    .from(games)
    .where(
      and(
        eq(games.blockId, roundId),
        eq(games.leagueId, leagueId),
        eq(games.status, "played")
      )
    )
  const result: Array<PlayedGameRatingInput> = []
  for (const game of playedGames) {
    if (game.pointsA === null || game.pointsB === null) continue
    const seats = await executor
      .select()
      .from(gameParticipations)
      .where(eq(gameParticipations.gameId, game.id))
      .orderBy(gameParticipations.team, gameParticipations.slot)
    const snapshots = await executor
      .select()
      .from(ratingSnapshots)
      .where(
        inArray(
          ratingSnapshots.id,
          seats.map((seat) => seat.ratingSnapshotId)
        )
      )
    const ratingById = new Map(
      snapshots.map((snapshot) => [
        snapshot.id,
        {
          playerId: snapshot.playerId,
          rating: snapshot.rating,
          rd: snapshot.rd,
          vol: snapshot.vol,
          timestamp: snapshot.createdAt.toISOString(),
        },
      ])
    )
    const teamA = seats
      .filter((seat) => seat.team === "a")
      .map((seat) => ratingById.get(seat.ratingSnapshotId))
      .filter((rating): rating is GlickoRating => rating !== undefined)
    const teamB = seats
      .filter((seat) => seat.team === "b")
      .map((seat) => ratingById.get(seat.ratingSnapshotId))
      .filter((rating): rating is GlickoRating => rating !== undefined)
    if (teamA.length !== 2 || teamB.length !== 2) {
      throw new Error("The game does not have a complete lineup.")
    }
    result.push({
      gameId: game.id,
      leagueId,
      importance: game.importance,
      pointsA: game.pointsA,
      pointsB: game.pointsB,
      teamA: [teamA[0], teamA[1]],
      teamB: [teamB[0], teamB[1]],
    })
  }
  return result
}

export async function hasOpenGames(
  executor: Executor,
  leagueId: string,
  roundId: RoundId
): Promise<boolean> {
  const [row] = await executor
    .select({ id: games.id })
    .from(games)
    .where(
      and(
        eq(games.blockId, roundId),
        eq(games.leagueId, leagueId),
        eq(games.status, "proposed")
      )
    )
    .limit(1)
  return Boolean(row)
}

export async function writeRatingResults(
  executor: Executor,
  inputs: Array<PlayedGameRatingInput>,
  timestamp: string
): Promise<void> {
  for (const input of inputs) {
    const ratings = rateDoublesGame({
      teamA: input.teamA,
      teamB: input.teamB,
      pointsA: input.pointsA,
      pointsB: input.pointsB,
      matchImportance: input.importance,
      timestamp,
    })
    await executor.insert(ratingSnapshots).values(
      ratings.map((rating) => ({
        id: createId("rating"),
        playerId: rating.playerId,
        leagueId: input.leagueId,
        gameId: input.gameId,
        rating: rating.rating,
        rd: rating.rd,
        vol: rating.vol,
        createdAt: new Date(timestamp),
      }))
    )
  }
}

export async function markRoundCommitted(
  executor: Executor,
  leagueId: string,
  roundId: RoundId
): Promise<void> {
  await executor
    .update(gameBlocks)
    .set({ committed: true })
    .where(and(eq(gameBlocks.id, roundId), eq(gameBlocks.leagueId, leagueId)))
}

export async function findHistory(
  executor: Executor = getDb(),
  leagueId: string,
  range: TimeRange = "all"
): Promise<Array<SessionDay>> {
  const rangeCondition = statisticsRangeCondition(sql`b.created_at`, range)
  const result = await executor.execute(sql<{
    id: string
    date: string
    number: number
    started_at: Date
    committed: boolean
    game_count: number
    cancelled_count: number
    player_count: number
    pausing_count: number
  }>`
    with numbered as (
      select
        b.*,
        to_char(
          date_trunc(
            'day',
            (b.created_at at time zone 'Europe/Berlin') - interval '5 hours'
          ),
          'YYYY-MM-DD'
        ) as session_date,
        row_number() over (
          partition by date_trunc(
            'day',
            (b.created_at at time zone 'Europe/Berlin') - interval '5 hours'
          )
          order by b.seq
        ) as local_number
      from game_block b
      where b.league_id = ${leagueId}
        and ${rangeCondition}
    )
    select
      n.block_id as id,
      n.session_date as date,
      n.local_number as number,
      n.created_at as started_at,
      n.committed,
      count(distinct g.game_id) as game_count,
      count(distinct g.game_id) filter (where g.status = 'cancelled') as cancelled_count,
      count(distinct gp.player_id) as player_count,
      count(distinct bp.player_id) as pausing_count
    from numbered n
    left join game g on g.block_id = n.block_id
    left join game_participation gp on gp.game_id = g.game_id
    left join block_pause bp on bp.block_id = n.block_id
    group by n.block_id, n.session_date, n.local_number, n.created_at, n.committed, n.seq
    order by n.created_at desc
  `)
  const rows = result.rows as unknown as Array<{
    id: string
    date: string
    number: number
    started_at: Date
    committed: boolean
    game_count: number
    cancelled_count: number
    player_count: number
    pausing_count: number
  }>
  const byDate = new Map<string, SessionDay>()
  rows.forEach((row) => {
    const day = byDate.get(row.date) ?? { date: row.date, rounds: [] }
    day.rounds.push({
      id: row.id,
      number: Number(row.number),
      startedAt: new Date(row.started_at).toISOString(),
      status: row.committed ? "committed" : "active",
      gameCount: Number(row.game_count),
      cancelledCount: Number(row.cancelled_count),
      playerCount: Number(row.player_count),
      pausingCount: Number(row.pausing_count),
    })
    byDate.set(row.date, day)
  })
  return [...byDate.values()]
}

export type { HistoricalRound }

function orderedTeam(
  seats: Array<typeof gameParticipations.$inferSelect>,
  team: "a" | "b",
  refs: Map<PlayerId, PlayerRef>
): [PlayerRef, PlayerRef] | null {
  const players = seats
    .filter((seat) => seat.team === team)
    .toSorted((first, second) => first.slot - second.slot)
    .map((seat) => refs.get(seat.playerId))
    .filter((ref): ref is PlayerRef => ref !== undefined)
  return players.length === 2 ? [players[0], players[1]] : null
}

function ratingChangesForGame(
  gameId: string,
  importance: number,
  pointsA: number,
  pointsB: number,
  seats: Array<typeof gameParticipations.$inferSelect>,
  beforeRows: Array<typeof ratingSnapshots.$inferSelect>,
  afterRows: Array<typeof ratingSnapshots.$inferSelect>,
  refs: Map<PlayerId, PlayerRef>,
  committed: boolean
): Array<RatingChange> {
  const beforeById = new Map(beforeRows.map((row) => [row.id, row]))
  const beforeRatings = (team: "a" | "b") =>
    seats
      .filter((seat) => seat.team === team)
      .toSorted((first, second) => first.slot - second.slot)
      .map((seat) => beforeById.get(seat.ratingSnapshotId))
      .filter(
        (rating): rating is typeof ratingSnapshots.$inferSelect =>
          rating !== undefined
      )
      .map(toGlicko)
  const teamA = beforeRatings("a")
  const teamB = beforeRatings("b")
  if (teamA.length !== 2 || teamB.length !== 2) return []

  const calculated = committed
    ? afterRows.filter((row) => row.gameId === gameId).map(toGlicko)
    : rateDoublesGame({
        teamA: [teamA[0], teamA[1]],
        teamB: [teamB[0], teamB[1]],
        pointsA,
        pointsB,
        matchImportance: importance,
        timestamp: new Date().toISOString(),
      })
  const afterByPlayer = new Map(
    calculated.map((rating) => [rating.playerId, rating])
  )
  return [...teamA, ...teamB].flatMap((before) => {
    const after = afterByPlayer.get(before.playerId)
    const player = refs.get(before.playerId)
    return after && player
      ? [
          {
            player,
            ratingBefore: before.rating,
            ratingAfter: after.rating,
            delta: after.rating - before.rating,
          },
        ]
      : []
  })
}

function toGlicko(row: typeof ratingSnapshots.$inferSelect): GlickoRating {
  return {
    playerId: row.playerId,
    rating: row.rating,
    rd: row.rd,
    vol: row.vol,
    timestamp: row.createdAt.toISOString(),
  }
}

/** Collects the current snapshot ids a new round pins its participations to. */
export async function ratingsForPlayers(
  executor: Executor,
  leagueId: string,
  playerIds: Array<PlayerId>
) {
  return findCurrentGlickoRatings(executor, leagueId, playerIds)
}
