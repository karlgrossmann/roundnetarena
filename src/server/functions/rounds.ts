import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { DomainError } from "@/lib/domain-errors"
import { buildWeightMatrices } from "@/lib/matchmaking/weights"
import {
  generateMatchExplanation,
  supportsMatchExplanation,
} from "@/lib/matchmaking/explanation"
import { selectPlayersToPause } from "@/lib/matchmaking/pause"
import { randomMatching, solveMatching } from "@/lib/matchmaking/solver"
import { activeFixedTeams, maxFixedTeams } from "@/lib/pool"
import { validateScore } from "@/lib/score"

import { getDb } from "../db/client"
import { createId } from "../db/ids"
import { authed } from "../middleware/auth"
import {
  OrganizationLeagueSchema,
  requireLeagueAccess,
} from "./league-access.server"
import {
  findPauseStatsToday,
  findPool,
  findRecentMatchups,
} from "../repositories/pool"
import {
  cancelAllRoundGames,
  cancelOpenRoundGames,
  findActiveRound,
  findPlayedGameRatingInputs,
  findRound,
  hasOpenGames,
  insertRound,
  lockRound,
  markRoundCommitted,
  ratingsForPlayers,
  updateGameCancellation,
  updateGameResult,
  writeRatingResults,
} from "../repositories/rounds"
import { findSettings } from "../repositories/settings"

const LeagueSchema = OrganizationLeagueSchema
const GenerateRoundSchema = LeagueSchema.extend({
  courts: z.number().int().positive(),
})
const RoundSchema = LeagueSchema.extend({ roundId: z.string().min(1) })
const GameSchema = RoundSchema.extend({ gameId: z.string().min(1) })
const ResultSchema = GameSchema.extend({
  pointsA: z.number().int(),
  pointsB: z.number().int(),
})
const CancellationSchema = GameSchema.extend({ cancelled: z.boolean() })

export const generateRound = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(GenerateRoundSchema)
  .handler(async ({ context, data }) =>
    getDb().transaction(async (tx) => {
      await requireLeagueWrite(tx, data, context.auth.user.id)
      const existing = await findActiveRound(tx, data.leagueId)
      if (existing) throw new DomainError("round.active_exists")

      const [pool, settings] = await Promise.all([
        findPool(tx, data.leagueId),
        findSettings(tx, data.leagueId),
      ])
      if (!settings) throw new DomainError("settings.not_found")
      const playingEntries = pool.entries.filter(
        (entry) => entry.status === "playing"
      )
      const seats = data.courts * 4
      if (playingEntries.length < seats || seats < 4) {
        throw new DomainError("round.too_few_players")
      }
      const fixedTeams = activeFixedTeams(pool)
      if (fixedTeams.length > maxFixedTeams(data.courts)) {
        throw new DomainError("round.too_many_fixed_teams")
      }

      const stats = await findPauseStatsToday(
        tx,
        data.leagueId,
        playingEntries.map((entry) => entry.player.id)
      )
      const pauseSelection = selectPlayersToPause(
        stats,
        playingEntries.length - seats,
        settings.pauseMode,
        fixedTeams
      )
      const selectedIds = pauseSelection.playing.map((player) => player.id)
      const selectedIdSet = new Set(selectedIds)
      const selectedFixedTeams = fixedTeams.filter((team) =>
        team.players.every((playerId) => selectedIdSet.has(playerId))
      )
      const ratings = await ratingsForPlayers(tx, data.leagueId, selectedIds)
      const matchmakingPlayers = pauseSelection.playing
        .map((player) => ({
          id: player.id,
          rating: ratings.get(player.id)?.rating ?? player.rating,
        }))
        .toSorted((first, second) => second.rating - first.rating)
      const history = await findRecentMatchups(tx, data.leagueId, selectedIds)
      const weights = buildWeightMatrices(
        matchmakingPlayers.map((player) => player.id),
        history
      )
      const solution =
        settings.matchingAlgorithm === "random"
          ? randomMatching({
              players: matchmakingPlayers,
              weights,
              higherRatingWeight: settings.higherRatingWeight,
              fixedTeams: selectedFixedTeams,
            })
          : await solveMatching({
              players: matchmakingPlayers,
              weights,
              higherRatingWeight: settings.higherRatingWeight,
              fixedTeams: selectedFixedTeams,
            })
      const explanation = supportsMatchExplanation(settings.matchingAlgorithm)
        ? generateMatchExplanation({
            matchups: solution.matchups,
            players: matchmakingPlayers,
            weights,
            higherRatingWeight: settings.higherRatingWeight,
            fixedTeams: selectedFixedTeams,
          })
        : undefined
      const roundId = createId("block")
      await insertRound(
        tx,
        {
          id: roundId,
          leagueId: data.leagueId,
          matchups: solution.matchups,
          assignedPauses: pauseSelection.pausing.map((player) => player.id),
          voluntaryPauses: pool.entries
            .filter((entry) => entry.status === "paused")
            .map((entry) => entry.player.id),
          explanation,
        },
        ratings
      )
      const round = await findRound(tx, data.leagueId, roundId)
      if (!round) throw new DomainError("round.creation_failed")
      return round
    })
  )

export const enterResult = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(ResultSchema)
  .handler(async ({ context, data }) =>
    getDb().transaction(async (tx) => {
      await requireLeagueWrite(tx, data, context.auth.user.id)
      await requireOpenRound(tx, data.leagueId, data.roundId)
      const validation = validateScore(data.pointsA, data.pointsB)
      if (!validation.isValid) {
        throw new DomainError(validation.errors[0].code)
      }
      const found = await updateGameResult(
        tx,
        data.leagueId,
        data.roundId,
        data.gameId,
        data.pointsA,
        data.pointsB
      )
      if (!found) throw new DomainError("round.game_not_active")
      return requireRound(tx, data.leagueId, data.roundId)
    })
  )

export const setGameCancelled = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(CancellationSchema)
  .handler(async ({ context, data }) =>
    getDb().transaction(async (tx) => {
      await requireLeagueWrite(tx, data, context.auth.user.id)
      await requireOpenRound(tx, data.leagueId, data.roundId)
      const found = await updateGameCancellation(
        tx,
        data.leagueId,
        data.roundId,
        data.gameId,
        data.cancelled
      )
      if (!found) throw new DomainError("round.game_not_active")
      return requireRound(tx, data.leagueId, data.roundId)
    })
  )

export const cancelOpenGames = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(RoundSchema)
  .handler(async ({ context, data }) =>
    getDb().transaction(async (tx) => {
      await requireLeagueWrite(tx, data, context.auth.user.id)
      await requireOpenRound(tx, data.leagueId, data.roundId)
      await cancelOpenRoundGames(tx, data.leagueId, data.roundId)
      return requireRound(tx, data.leagueId, data.roundId)
    })
  )

export const annulRound = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(RoundSchema)
  .handler(async ({ context, data }) =>
    getDb().transaction(async (tx) => {
      await requireLeagueWrite(tx, data, context.auth.user.id)
      await requireOpenRound(tx, data.leagueId, data.roundId)
      await cancelAllRoundGames(tx, data.leagueId, data.roundId)
      return requireRound(tx, data.leagueId, data.roundId)
    })
  )

export const commitRound = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(RoundSchema)
  .handler(async ({ context, data }) =>
    getDb().transaction(async (tx) => {
      await requireLeagueWrite(tx, data, context.auth.user.id)
      await requireOpenRound(tx, data.leagueId, data.roundId)
      if (await hasOpenGames(tx, data.leagueId, data.roundId)) {
        throw new DomainError("round.all_games_required")
      }
      const inputs = await findPlayedGameRatingInputs(
        tx,
        data.leagueId,
        data.roundId
      )
      const timestamp = new Date().toISOString()
      await writeRatingResults(tx, inputs, timestamp)
      await markRoundCommitted(tx, data.leagueId, data.roundId)
      return requireRound(tx, data.leagueId, data.roundId)
    })
  )

async function requireOpenRound(
  executor: Parameters<typeof lockRound>[0],
  leagueId: string,
  roundId: string
): Promise<void> {
  const locked = await lockRound(executor, leagueId, roundId)
  if (!locked) throw new DomainError("round.not_found")
  if (locked.committed) {
    throw new DomainError("round.already_committed")
  }
}

async function requireRound(
  executor: Parameters<typeof findRound>[0],
  leagueId: string,
  roundId: string
) {
  const round = await findRound(executor, leagueId, roundId)
  if (!round) throw new DomainError("round.not_found")
  return round
}

function requireLeagueWrite(
  executor: Parameters<typeof requireLeagueAccess>[0],
  data: { organizationId: string; leagueId: string },
  userId: string
) {
  return requireLeagueAccess(executor, {
    ...data,
    userId,
    permission: "play:manage",
  })
}
