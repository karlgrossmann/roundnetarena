import { player_anonymized_name } from "@/paraglide/messages.js"
import type { PlayerRef } from "./types"

/** Localized label; anonymized names are only formed at the UI boundary. */
export function playerRefDisplayName(player: PlayerRef): string {
  return player.anonymizedKey
    ? player_anonymized_name({ key: player.anonymizedKey })
    : player.displayName
}
