import "@tanstack/react-start/server-only"

import { and, eq, inArray, sql } from "drizzle-orm"

import type { GlickoRating } from "@/lib/glicko"
import { normalizePlayerNamePart } from "@/lib/player-name"
import type { PlayerReferences } from "@/lib/player-removal"
import type { TimeRange } from "@/lib/time-range"
import type {
  Player,
  PlayerGame,
  PlayerId,
  PlayerRef,
  RatingPoint,
} from "@/lib/types"

import { getDb } from "../db/client"
import type { Executor } from "../db/client"
import { createId } from "../db/ids"
import { displayNames, toPlayer } from "../db/mappers"
import {
  gameParticipations,
  playerCurrentRatings,
  players,
  ratingSnapshots,
} from "../db/schema"
import { statisticsRangeCondition } from "./statistics-range"

interface PlayerRow {
  id: string
  firstName: string
  lastName: string
  rating: number
  rd: number
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  gamesPaused: number
  initialRating: number
}

export class PlayerNameConstraintError extends Error {
  constructor(options?: ErrorOptions) {
    super("The normalized player name is already taken in this league.", {
      cause: options?.cause,
    })
    this.name = "PlayerNameConstraintError"
  }
}

function isPlayerNameConstraintViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false
  if (
    "code" in error &&
    error.code === "23505" &&
    "constraint" in error &&
    error.constraint === "player_active_name_uq"
  ) {
    return true
  }
  return "cause" in error && error.cause !== error
    ? isPlayerNameConstraintViolation(error.cause)
    : false
}

export async function findAllPlayers(
  executor: Executor = getDb(),
  leagueId: string
): Promise<Array<Player>> {
  return findPlayers(executor, leagueId)
}

export async function findPlayer(
  executor: Executor = getDb(),
  leagueId: string,
  playerId: PlayerId
): Promise<Player | null> {
  const all = await findPlayers(executor, leagueId)
  return all.find((player) => player.id === playerId) ?? null
}

export async function insertPlayer(
  executor: Executor,
  input: {
    leagueId: string
    firstName: string
    lastName: string
    rating: number
    rd: number
  }
): Promise<Player> {
  const playerId = createId("player")
  const firstName = normalizePlayerNamePart(input.firstName)
  const lastName = normalizePlayerNamePart(input.lastName)
  try {
    await executor.insert(players).values({
      id: playerId,
      leagueId: input.leagueId,
      firstName,
      lastName,
    })
  } catch (error) {
    if (isPlayerNameConstraintViolation(error)) {
      throw new PlayerNameConstraintError({ cause: error })
    }
    throw error
  }
  await executor.insert(ratingSnapshots).values({
    id: createId("rating"),
    playerId,
    leagueId: input.leagueId,
    gameId: null,
    rating: input.rating,
    rd: input.rd,
    vol: 0.06,
  })

  const created = await findPlayer(executor, input.leagueId, playerId)
  if (!created) throw new Error("The player could not be created.")
  return created
}

export async function findActivePlayerIdByName(
  executor: Executor,
  leagueId: string,
  firstName: string,
  lastName: string
): Promise<PlayerId | null> {
  const normalizedFirstName = normalizePlayerNamePart(firstName)
  const normalizedLastName = normalizePlayerNamePart(lastName)
  const rows = await executor
    .select({ id: players.id })
    .from(players)
    .where(
      and(
        eq(players.leagueId, leagueId),
        eq(players.markedAsDeleted, false),
        sql`lower(regexp_replace(btrim(${players.firstName}), '[[:space:]]+', ' ', 'g')) =
          lower(${normalizedFirstName})`,
        sql`lower(regexp_replace(btrim(${players.lastName}), '[[:space:]]+', ' ', 'g')) =
          lower(${normalizedLastName})`
      )
    )
    .limit(1)

  return rows.length === 0 ? null : rows[0].id
}

export async function lockActivePlayer(
  executor: Executor,
  leagueId: string,
  playerId: PlayerId
): Promise<boolean> {
  const rows = await executor
    .select({ id: players.id })
    .from(players)
    .where(
      and(
        eq(players.id, playerId),
        eq(players.leagueId, leagueId),
        eq(players.markedAsDeleted, false)
      )
    )
    .for("update")
    .limit(1)
  return rows.length === 1
}

export async function findPlayerReferences(
  executor: Executor,
  leagueId: string,
  playerId: PlayerId
): Promise<PlayerReferences> {
  const result = await executor.execute(sql<{
    game_participation: boolean
    pause: boolean
    historical_rating_snapshot: boolean
    rating_snapshot_reference: boolean
  }>`
    select
      exists (
        select 1
        from game_participation
        where league_id = ${leagueId} and player_id = ${playerId}
      ) as game_participation,
      exists (
        select 1
        from block_pause
        where league_id = ${leagueId} and player_id = ${playerId}
      ) as pause,
      exists (
        select 1
        from rating_snapshot
        where league_id = ${leagueId}
          and player_id = ${playerId}
          and game_id is not null
      ) as historical_rating_snapshot,
      exists (
        select 1
        from game_participation participation
        inner join rating_snapshot snapshot
          on snapshot.rating_snapshot_id = participation.rating_snapshot_id
        where snapshot.league_id = ${leagueId}
          and snapshot.player_id = ${playerId}
      ) as rating_snapshot_reference
  `)
  const row = result.rows[0] as unknown as
    | {
        game_participation: boolean
        pause: boolean
        historical_rating_snapshot: boolean
        rating_snapshot_reference: boolean
      }
    | undefined

  return {
    gameParticipation: row?.game_participation ?? false,
    pause: row?.pause ?? false,
    historicalRatingSnapshot: row?.historical_rating_snapshot ?? false,
    ratingSnapshotReference: row?.rating_snapshot_reference ?? false,
  }
}

export async function anonymizePlayer(
  executor: Executor,
  leagueId: string,
  playerId: PlayerId,
  anonymizedKey: string
): Promise<void> {
  const rows = await executor
    .update(players)
    .set({
      firstName: "",
      lastName: "",
      markedAsDeleted: true,
      anonymizedKey,
    })
    .where(and(eq(players.id, playerId), eq(players.leagueId, leagueId)))
    .returning({ id: players.id })
  if (rows.length !== 1) {
    throw new Error("The player could not be anonymized.")
  }
}

export async function hardDeletePlayer(
  executor: Executor,
  leagueId: string,
  playerId: PlayerId
): Promise<void> {
  await executor
    .delete(ratingSnapshots)
    .where(
      and(
        eq(ratingSnapshots.playerId, playerId),
        eq(ratingSnapshots.leagueId, leagueId)
      )
    )
  await executor
    .delete(players)
    .where(and(eq(players.id, playerId), eq(players.leagueId, leagueId)))
}

export async function findPlayerRatingHistory(
  executor: Executor = getDb(),
  leagueId: string,
  playerId: PlayerId,
  range: TimeRange = "all"
): Promise<Array<RatingPoint>> {
  const rows = await executor
    .select({
      timestamp: ratingSnapshots.createdAt,
      rating: ratingSnapshots.rating,
      rd: ratingSnapshots.rd,
    })
    .from(ratingSnapshots)
    .where(
      and(
        eq(ratingSnapshots.leagueId, leagueId),
        eq(ratingSnapshots.playerId, playerId),
        statisticsRangeCondition(sql`${ratingSnapshots.createdAt}`, range)
      )
    )
    .orderBy(ratingSnapshots.seq)

  return rows.map((row) => ({
    timestamp: row.timestamp.toISOString(),
    rating: row.rating,
    rd: row.rd,
  }))
}

export async function findCurrentGlickoRatings(
  executor: Executor,
  leagueId: string,
  playerIds: Array<PlayerId>
): Promise<Map<PlayerId, GlickoRating & { snapshotId: string }>> {
  if (playerIds.length === 0) return new Map()
  const rows = await executor
    .select({
      playerId: playerCurrentRatings.playerId,
      rating: playerCurrentRatings.rating,
      rd: playerCurrentRatings.rd,
      vol: playerCurrentRatings.vol,
      timestamp: playerCurrentRatings.createdAt,
      snapshotId: playerCurrentRatings.ratingSnapshotId,
    })
    .from(playerCurrentRatings)
    .where(
      and(
        eq(playerCurrentRatings.leagueId, leagueId),
        inArray(playerCurrentRatings.playerId, playerIds)
      )
    )

  return new Map(
    rows.map((row) => [
      row.playerId,
      {
        playerId: row.playerId,
        rating: row.rating,
        rd: row.rd,
        vol: row.vol,
        timestamp: row.timestamp.toISOString(),
        snapshotId: row.snapshotId,
      },
    ])
  )
}

export async function findPlayerRefs(
  executor: Executor,
  leagueId: string
): Promise<Map<PlayerId, PlayerRef>> {
  const rows = await executor
    .select({
      id: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      anonymizedKey: players.anonymizedKey,
      rating: playerCurrentRatings.rating,
    })
    .from(players)
    .innerJoin(
      playerCurrentRatings,
      and(
        eq(playerCurrentRatings.playerId, players.id),
        eq(playerCurrentRatings.leagueId, players.leagueId)
      )
    )
    .where(eq(players.leagueId, leagueId))
  const namedRows = rows.filter((row) => row.anonymizedKey === null)
  const names = displayNames(namedRows)

  return new Map(
    rows.map((row) => {
      const anonymizedKey = row.anonymizedKey ?? undefined
      const ref: PlayerRef = {
        id: row.id,
        displayName: anonymizedKey ?? names.get(row.id) ?? row.firstName,
        ...(anonymizedKey ? { anonymizedKey } : {}),
        rating: row.rating,
      }
      return [row.id, ref]
    })
  )
}

export async function findPlayerGames(
  executor: Executor = getDb(),
  leagueId: string,
  playerId: PlayerId,
  range: TimeRange = "all"
): Promise<Array<PlayerGame>> {
  const rangeCondition = statisticsRangeCondition(
    sql`coalesce(g.played_at, g.created_at)`,
    range
  )
  const result = await executor.execute(sql<{
    game_id: string
    played_at: Date
    team: "a" | "b"
    points_a: number
    points_b: number
    rating_before: number
    rating_after: number
  }>`
    select
      g.game_id,
      coalesce(g.played_at, g.created_at) as played_at,
      gp.team,
      g.points_a,
      g.points_b,
      before.rating as rating_before,
      after.rating as rating_after
    from game g
    inner join game_block b
      on b.block_id = g.block_id and b.committed
    inner join game_participation gp
      on gp.game_id = g.game_id and gp.player_id = ${playerId}
    inner join rating_snapshot before
      on before.rating_snapshot_id = gp.rating_snapshot_id
    inner join rating_snapshot after
      on after.game_id = g.game_id and after.player_id = gp.player_id
    where g.league_id = ${leagueId}
      and g.status = 'played'
      and ${rangeCondition}
    order by coalesce(g.played_at, g.created_at) desc
  `)
  const gameRows = result.rows as unknown as Array<{
    game_id: string
    played_at: Date
    team: "a" | "b"
    points_a: number
    points_b: number
    rating_before: number
    rating_after: number
  }>
  if (gameRows.length === 0) return []

  const gameIds = gameRows.map((row) => row.game_id)
  const seats = await executor
    .select({
      gameId: gameParticipations.gameId,
      playerId: gameParticipations.playerId,
      team: gameParticipations.team,
    })
    .from(gameParticipations)
    .where(inArray(gameParticipations.gameId, gameIds))
  const refs = await findPlayerRefs(executor, leagueId)

  return gameRows.flatMap((row) => {
    const ownTeam = row.team
    const gameSeats = seats.filter((seat) => seat.gameId === row.game_id)
    const partnerSeat = gameSeats.find(
      (seat) => seat.team === ownTeam && seat.playerId !== playerId
    )
    const opponentSeats = gameSeats.filter((seat) => seat.team !== ownTeam)
    const partner = partnerSeat ? refs.get(partnerSeat.playerId) : undefined
    const opponents = opponentSeats
      .map((seat) => refs.get(seat.playerId))
      .filter((ref): ref is PlayerRef => ref !== undefined)
    if (!partner || opponents.length !== 2) return []

    const ownPoints = ownTeam === "a" ? row.points_a : row.points_b
    const opponentPoints = ownTeam === "a" ? row.points_b : row.points_a
    return [
      {
        gameId: row.game_id,
        timestamp: new Date(row.played_at).toISOString(),
        partner,
        opponents: [opponents[0], opponents[1]],
        ownPoints,
        opponentPoints,
        won: ownPoints > opponentPoints,
        ratingBefore: row.rating_before,
        ratingAfter: row.rating_after,
      },
    ]
  })
}

async function findPlayers(
  executor: Executor,
  leagueId: string
): Promise<Array<Player>> {
  const result = await executor.execute(sql<PlayerRow>`
    select
      p.player_id as id,
      p.first_name as "firstName",
      p.last_name as "lastName",
      current.rating,
      current.rd,
      stats.games_played as "gamesPlayed",
      stats.games_won as "gamesWon",
      stats.games_lost as "gamesLost",
      stats.games_paused as "gamesPaused",
      initial.rating as "initialRating"
    from player p
    inner join player_current_rating current using (player_id, league_id)
    inner join player_stats stats using (player_id, league_id)
    inner join rating_snapshot initial
      on initial.player_id = p.player_id and initial.game_id is null
    where p.league_id = ${leagueId}
      and not p.marked_as_deleted
    order by current.rating desc, p.first_name, p.last_name
  `)
  const rows = result.rows as unknown as Array<PlayerRow>
  const names = displayNames(rows)
  return rows.map((row) => toPlayer(row, names.get(row.id) ?? row.firstName))
}
