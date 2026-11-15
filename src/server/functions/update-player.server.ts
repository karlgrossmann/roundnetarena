import "@tanstack/react-start/server-only"

import { DomainError } from "@/lib/domain-errors"
import { normalizePlayerNamePart, playerNameConflict } from "@/lib/player-name"
import type { UpdatePlayerResult } from "@/lib/player-name"
import type { PlayerId } from "@/lib/types"

import { getDb } from "../db/client"
import type { Executor } from "../db/client"
import {
  findActivePlayerIdByName,
  findCurrentGlickoRatings,
  findPlayer,
  insertManualRating,
  isPlayerSeatedInOpenRound,
  lockActivePlayer,
  PlayerNameConstraintError,
  updatePlayerName,
} from "../repositories/players"

export interface UpdatePlayerData {
  leagueId: string
  playerId: PlayerId
  firstName: string
  lastName: string
  /** Omitted when unchanged — only a real correction writes a rating snapshot. */
  rating?: number
  rd?: number
}

async function otherPlayerWithName(
  executor: Executor,
  data: UpdatePlayerData
): Promise<PlayerId | null> {
  const id = await findActivePlayerIdByName(
    executor,
    data.leagueId,
    data.firstName,
    data.lastName
  )
  return id === data.playerId ? null : id
}

/**
 * Renames a player and, if asked, corrects their rating from now on.
 *
 * Past games keep the ratings they were played with: a manual correction is appended
 * as a new snapshot instead of rewriting the start value.
 */
export async function updatePlayerForLeague(
  data: UpdatePlayerData
): Promise<UpdatePlayerResult> {
  const database = getDb()
  const normalized = {
    ...data,
    firstName: normalizePlayerNamePart(data.firstName),
    lastName: normalizePlayerNamePart(data.lastName),
  }

  try {
    return await database.transaction(async (tx) => {
      const exists = await lockActivePlayer(
        tx,
        normalized.leagueId,
        normalized.playerId
      )
      if (!exists) throw new DomainError("player.not_found")

      const conflictingId = await otherPlayerWithName(tx, normalized)
      if (conflictingId) return playerNameConflict(conflictingId)

      await updatePlayerName(
        tx,
        normalized.leagueId,
        normalized.playerId,
        normalized.firstName,
        normalized.lastName
      )

      if (normalized.rating !== undefined || normalized.rd !== undefined) {
        if (
          await isPlayerSeatedInOpenRound(
            tx,
            normalized.leagueId,
            normalized.playerId
          )
        ) {
          throw new DomainError("player.rating_locked_in_round")
        }
        const current = (
          await findCurrentGlickoRatings(tx, normalized.leagueId, [
            normalized.playerId,
          ])
        ).get(normalized.playerId)
        if (!current) throw new Error("The player has no current rating.")

        await insertManualRating(tx, {
          leagueId: normalized.leagueId,
          playerId: normalized.playerId,
          rating: normalized.rating ?? current.rating,
          rd: normalized.rd ?? current.rd,
          vol: current.vol,
        })
      }

      const player = await findPlayer(
        tx,
        normalized.leagueId,
        normalized.playerId
      )
      if (!player) throw new Error("The player could not be updated.")
      return { status: "updated", player }
    })
  } catch (error) {
    if (!(error instanceof PlayerNameConstraintError)) throw error

    const conflictingId = await otherPlayerWithName(database, normalized)
    if (!conflictingId) {
      throw new Error("The name conflict could not be resolved.")
    }
    return playerNameConflict(conflictingId)
  }
}
