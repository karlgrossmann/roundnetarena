import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { DomainError } from "@/lib/domain-errors"
import { activeFixedTeams } from "@/lib/pool"
import { pauseQuota, selectPlayersToPause } from "@/lib/matchmaking/pause"
import { playerRemovalKind } from "@/lib/player-removal"
import type { PauseCandidate } from "@/lib/types"

import { statisticsRange, TimeRangeSchema } from "./statistics-range"
import {
  OrganizationLeagueSchema,
  requireLeagueAccess,
} from "./league-access.server"
import { authed } from "../middleware/auth"
import { findSummary } from "../repositories/dashboard"
import {
  findAllPlayers,
  findPlayer,
  findPlayerGames,
  findPlayerReferences,
  findPlayerRatingHistory,
} from "../repositories/players"
import { findPauseStatsToday, findPool } from "../repositories/pool"
import { findActiveRound, findHistory } from "../repositories/rounds"
import { findSettings } from "../repositories/settings"
import { getDb } from "../db/client"

const LeagueSchema = OrganizationLeagueSchema
const PlayerSchema = LeagueSchema.extend({ playerId: z.string().min(1) })
const PlayerStatisticsSchema = PlayerSchema.extend({ range: TimeRangeSchema })
const HistorySchema = LeagueSchema.extend({ range: TimeRangeSchema })
const PausePreviewSchema = LeagueSchema.extend({
  courts: z.number().int().positive(),
})

export const fetchSummary = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(LeagueSchema)
  .handler(async ({ context, data }) => {
    const db = getDb()
    await requireLeagueRead(db, data, context.auth.user.id)
    return findSummary(db, data.leagueId)
  })

export const fetchPlayers = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(LeagueSchema)
  .handler(async ({ context, data }) => {
    const db = getDb()
    await requireLeagueRead(db, data, context.auth.user.id)
    return findAllPlayers(db, data.leagueId)
  })

export const fetchPlayer = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(PlayerSchema)
  .handler(async ({ context, data }) => {
    const db = getDb()
    await requireLeagueRead(db, data, context.auth.user.id)
    const player = await findPlayer(db, data.leagueId, data.playerId)
    if (!player) throw new DomainError("player.not_found")
    return player
  })

export const fetchPlayerRatingHistory = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(PlayerStatisticsSchema)
  .handler(async ({ context, data }) => {
    const db = getDb()
    await requireLeagueRead(db, data, context.auth.user.id)
    return findPlayerRatingHistory(
      db,
      data.leagueId,
      data.playerId,
      statisticsRange(data.range)
    )
  })

export const fetchPlayerGames = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(PlayerStatisticsSchema)
  .handler(async ({ context, data }) => {
    const db = getDb()
    await requireLeagueRead(db, data, context.auth.user.id)
    return findPlayerGames(
      db,
      data.leagueId,
      data.playerId,
      statisticsRange(data.range)
    )
  })

export const fetchPlayerRemovalPreview = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(PlayerSchema)
  .handler(async ({ context, data }) => {
    const database = getDb()
    await requireLeagueRead(database, data, context.auth.user.id)
    const player = await findPlayer(database, data.leagueId, data.playerId)
    if (!player) throw new DomainError("player.not_found")
    return playerRemovalKind(
      await findPlayerReferences(database, data.leagueId, data.playerId)
    )
  })

export const fetchPool = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(LeagueSchema)
  .handler(async ({ context, data }) => {
    const db = getDb()
    await requireLeagueRead(db, data, context.auth.user.id)
    return findPool(db, data.leagueId)
  })

export const fetchPausePreview = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(PausePreviewSchema)
  .handler(async ({ context, data }): Promise<Array<PauseCandidate>> => {
    const db = getDb()
    await requireLeagueRead(db, data, context.auth.user.id)
    const [pool, settings] = await Promise.all([
      findPool(db, data.leagueId),
      findSettings(db, data.leagueId),
    ])
    if (!settings) throw new DomainError("settings.not_found")
    const playing = pool.entries.filter((entry) => entry.status === "playing")
    const seats = data.courts * 4
    const numberToPause = Math.max(playing.length - seats, 0)
    const stats = await findPauseStatsToday(
      db,
      data.leagueId,
      playing.map((entry) => entry.player.id)
    )
    const selection = selectPlayersToPause(
      stats,
      numberToPause,
      settings.pauseMode,
      activeFixedTeams(pool)
    )
    const pausedIds = new Set(selection.pausing.map((player) => player.id))
    return stats.map((candidate) => ({
      ...candidate,
      pauseQuota: pauseQuota(candidate),
      willPause: pausedIds.has(candidate.player.id),
    }))
  })

export const fetchActiveRound = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(LeagueSchema)
  .handler(async ({ context, data }) => {
    const db = getDb()
    await requireLeagueRead(db, data, context.auth.user.id)
    return findActiveRound(db, data.leagueId)
  })

export const fetchHistory = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(HistorySchema)
  .handler(async ({ context, data }) => {
    const db = getDb()
    await requireLeagueRead(db, data, context.auth.user.id)
    return findHistory(db, data.leagueId, statisticsRange(data.range))
  })

export const fetchSettings = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(LeagueSchema)
  .handler(async ({ context, data }) => {
    const db = getDb()
    await requireLeagueRead(db, data, context.auth.user.id)
    const settings = await findSettings(db, data.leagueId)
    if (!settings) throw new DomainError("settings.not_found")
    return settings
  })

function requireLeagueRead(
  executor: Parameters<typeof requireLeagueAccess>[0],
  data: { organizationId: string; leagueId: string },
  userId: string
) {
  return requireLeagueAccess(executor, { ...data, userId })
}
