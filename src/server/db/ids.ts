import "@tanstack/react-start/server-only"

import { randomBytes } from "node:crypto"

type IdPrefix = "block" | "fixed_team" | "game" | "league" | "player" | "rating"

export function createId(prefix: IdPrefix): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`
}
