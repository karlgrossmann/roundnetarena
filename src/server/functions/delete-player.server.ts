import "@tanstack/react-start/server-only"

import { DomainError } from "@/lib/domain-errors"
import { anonymizedPlayerKey, playerRemovalKind } from "@/lib/player-removal"
import type { PlayerRemoval } from "@/lib/player-removal"
import type { PlayerId } from "@/lib/types"

import { getDb } from "../db/client"
import {
  anonymizePlayer,
  findPlayerReferences,
  hardDeletePlayer,
  lockActivePlayer,
} from "../repositories/players"
import { removePlayerFromPool } from "../repositories/pool"

interface DeletePlayerData {
  leagueId: string
  playerId: PlayerId
}

export interface DeletePlayerResult {
  id: PlayerId
  kind: PlayerRemoval
}

/**
 * Decides and removes within the same transaction.
 *
 * The row lock prevents a new foreign key reference to the player from being written
 * between the reference check and the deletion; PostgreSQL FK checks take an
 * incompatible key lock for that.
 */
export async function deletePlayerForLeague(
  data: DeletePlayerData
): Promise<DeletePlayerResult> {
  return getDb().transaction(async (tx) => {
    const exists = await lockActivePlayer(tx, data.leagueId, data.playerId)
    if (!exists) throw new DomainError("player.not_found")

    const references = await findPlayerReferences(
      tx,
      data.leagueId,
      data.playerId
    )
    const kind = playerRemovalKind(references)

    await removePlayerFromPool(tx, data.leagueId, data.playerId)
    if (kind === "anonymized") {
      await anonymizePlayer(
        tx,
        data.leagueId,
        data.playerId,
        anonymizedPlayerKey(data.playerId)
      )
    } else {
      await hardDeletePlayer(tx, data.leagueId, data.playerId)
    }

    return { id: data.playerId, kind }
  })
}
