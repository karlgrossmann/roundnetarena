import { describe, expect, it } from "vitest"

import { validatePool } from "./pool-validation"
import type { FixedTeam, Pool, PoolStatus } from "./types"

const fixedTeam: FixedTeam = {
  id: "team",
  players: ["p1", "p2"],
}

function pool(
  firstStatus: PoolStatus,
  secondStatus: PoolStatus,
  teams: Array<FixedTeam> = [fixedTeam]
): Pool {
  return {
    updatedAt: "2026-07-28T18:00:00.000Z",
    entries: [
      {
        player: { id: "p1", displayName: "Ada A.", rating: 1500 },
        status: firstStatus,
      },
      {
        player: { id: "p2", displayName: "Berta B.", rating: 1450 },
        status: secondStatus,
      },
    ],
    fixedTeams: teams,
  }
}

describe("validatePool", () => {
  it.each(["playing", "paused", "absent"] as const)(
    "allows a stored team whose members have status %s",
    (status) => {
      expect(validatePool(pool(status, "playing"))).toEqual([])
    }
  )

  it("still requires a stored pool entry for every team member", () => {
    const value = pool("playing", "playing")

    expect(
      validatePool({
        ...value,
        entries: value.entries.slice(0, 1),
      })
    ).toContainEqual({ code: "pool.fixed_team_player_missing" })
  })

  it("still prevents a player from being in several fixed teams", () => {
    expect(
      validatePool(
        pool("playing", "playing", [
          fixedTeam,
          { id: "other", players: ["p1", "p3"] },
        ])
      )
    ).toContainEqual({ code: "pool.player_in_multiple_fixed_teams" })
  })
})
