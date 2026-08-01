import { describe, expect, it } from "vitest"

import {
  PLAYER_NAME_CONFLICT_CODE,
  normalizePlayerNamePart,
  playerNameConflict,
} from "./player-name"

describe("normalizePlayerNamePart", () => {
  it("strips outer whitespace and collapses inner whitespace", () => {
    expect(normalizePlayerNamePart("  Anna \t Maria\n ")).toBe("Anna Maria")
  })

  it("keeps the original casing for the visible display", () => {
    expect(normalizePlayerNamePart("  van DER Meer ")).toBe("van DER Meer")
  })
})

describe("playerNameConflict", () => {
  it("returns a stable code and the existing player ID", () => {
    expect(playerNameConflict("player_existing")).toEqual({
      status: "conflict",
      error: {
        code: PLAYER_NAME_CONFLICT_CODE,
        existingPlayerId: "player_existing",
      },
    })
  })
})
