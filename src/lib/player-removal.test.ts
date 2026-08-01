import { describe, expect, it } from "vitest"

import { anonymizedPlayerKey, playerRemovalKind } from "./player-removal"
import type { PlayerReferences } from "./player-removal"

function references(
  overrides: Partial<PlayerReferences> = {}
): PlayerReferences {
  return {
    gameParticipation: false,
    pause: false,
    historicalRatingSnapshot: false,
    ratingSnapshotReference: false,
    ...overrides,
  }
}

describe("playerRemovalKind", () => {
  it("deletes only a player with no references at all", () => {
    expect(playerRemovalKind(references())).toBe("deleted")
  })

  it.each([
    "gameParticipation",
    "pause",
    "historicalRatingSnapshot",
    "ratingSnapshotReference",
  ] as const)("anonymizes when referenced by %s", (reference) => {
    expect(playerRemovalKind(references({ [reference]: true }))).toBe(
      "anonymized"
    )
  })
})

describe("anonymized player key", () => {
  it("is stable, non-personal and independent of visible text", () => {
    const key = anonymizedPlayerKey("player_0123456789abcdef")

    expect(key).toBe("anon_0123456789abcdef")
    expect(anonymizedPlayerKey("player_0123456789abcdef")).toBe(key)
  })
})
