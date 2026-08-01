import "@tanstack/react-start/server-only"

import { normalizePlayerNamePart, playerNameConflict } from "@/lib/player-name"
import type { CreatePlayerResult } from "@/lib/player-name"

import { getDb } from "../db/client"
import {
  findActivePlayerIdByName,
  insertPlayer,
  PlayerNameConstraintError,
} from "../repositories/players"

export interface CreatePlayerData {
  leagueId: string
  firstName: string
  lastName: string
  rating: number
  rd: number
}

/**
 * The second lookup sits outside the failed transaction on purpose: with two concurrent
 * inserts PostgreSQL blocks on the unique index. After the rollback the winner is
 * visible, so its id can be returned to the UI reliably.
 */
export async function createPlayerForLeague(
  data: CreatePlayerData
): Promise<CreatePlayerResult> {
  const database = getDb()
  const normalized = {
    ...data,
    firstName: normalizePlayerNamePart(data.firstName),
    lastName: normalizePlayerNamePart(data.lastName),
  }

  try {
    return await database.transaction(async (tx) => {
      const existingPlayerId = await findActivePlayerIdByName(
        tx,
        normalized.leagueId,
        normalized.firstName,
        normalized.lastName
      )
      if (existingPlayerId) return playerNameConflict(existingPlayerId)

      return {
        status: "created",
        player: await insertPlayer(tx, normalized),
      }
    })
  } catch (error) {
    if (!(error instanceof PlayerNameConstraintError)) throw error

    const existingPlayerId = await findActivePlayerIdByName(
      database,
      normalized.leagueId,
      normalized.firstName,
      normalized.lastName
    )
    if (!existingPlayerId) {
      throw new Error("The name conflict could not be resolved.")
    }
    return playerNameConflict(existingPlayerId)
  }
}
