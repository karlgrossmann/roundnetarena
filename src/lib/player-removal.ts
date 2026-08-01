import type { PlayerId } from "./types"

export type PlayerRemoval = "anonymized" | "deleted"

/**
 * References that make a player historically relevant.
 *
 * The initial rating row alone is not yet history and is removed along with a hard
 * delete. Any use of that row through a participation, and every later rating
 * snapshot, block deletion instead.
 */
export interface PlayerReferences {
  gameParticipation: boolean
  pause: boolean
  historicalRatingSnapshot: boolean
  ratingSnapshotReference: boolean
}

export function playerRemovalKind(references: PlayerReferences): PlayerRemoval {
  return Object.values(references).some(Boolean) ? "anonymized" : "deleted"
}

/** Stable, non-personal identifier for an anonymized player. */
export function anonymizedPlayerKey(playerId: PlayerId): string {
  const opaquePart = playerId.startsWith("player_")
    ? playerId.slice("player_".length)
    : playerId
  return `anon_${opaquePart}`
}
