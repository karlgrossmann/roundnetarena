import type { Player, PlayerId } from "./types"

export const PLAYER_NAME_CONFLICT_CODE = "PLAYER_NAME_CONFLICT" as const

export interface PlayerNameConflict {
  code: typeof PLAYER_NAME_CONFLICT_CODE
  existingPlayerId: PlayerId
}

export type CreatePlayerResult =
  | { status: "created"; player: Player }
  | { status: "conflict"; error: PlayerNameConflict }

/**
 * Brings a name into its visible, persisted form. Casing is kept for display; the
 * case-insensitive comparison is additionally guaranteed by PostgreSQL, whose unique
 * index uses the same whitespace scheme.
 */
export function normalizePlayerNamePart(value: string): string {
  return value.trim().replace(/\s+/gu, " ")
}

export function playerNameConflict(
  existingPlayerId: PlayerId
): CreatePlayerResult {
  return {
    status: "conflict",
    error: {
      code: PLAYER_NAME_CONFLICT_CODE,
      existingPlayerId,
    },
  }
}
