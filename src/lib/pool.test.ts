import { describe, expect, it } from "vitest"

import {
  activeFixedTeams,
  clearedPool,
  countPoolStatus,
  courtsConsequenceLabel,
  effectiveCourts,
  generateRoundHint,
  maxFixedTeams,
  noPauseSentence,
  pauseBoundaryIndex,
  poolEntriesForPlayers,
  poolSummaryLabel,
  poolWithAllPlaying,
  poolWithStatus,
  sortPauseCandidates,
  sortPoolEntries,
  withFixedTeam,
  withoutFixedTeam,
} from "./pool"
import type {
  PauseCandidate,
  Player,
  Pool,
  PoolEntry,
  PoolStatus,
} from "./types"

const NOW = "2026-07-27T20:00:00"

function player(id: string, displayName: string, rating: number): Player {
  return {
    id,
    firstName: displayName,
    lastName: "T",
    displayName,
    rating,
    rd: 60,
    gamesPlayed: 10,
    gamesWon: 5,
    gamesLost: 5,
    gamesPaused: 2,
    totalRatingChange: 0,
  }
}

function entry(
  id: string,
  rating: number,
  status: PoolStatus,
  displayName = id
): PoolEntry {
  return { player: { id, displayName, rating }, status }
}

function pool(entries: Array<PoolEntry>): Pool {
  return { updatedAt: "2026-07-27T19:00:00", entries, fixedTeams: [] }
}

function candidate(
  displayName: string,
  pauseQuota: number,
  willPause: boolean
): PauseCandidate {
  return {
    player: { id: displayName, displayName, rating: 1500 },
    gamesPlayedToday: 3,
    gamesPausedToday: 1,
    pauseQuota,
    willPause,
  }
}

describe("poolEntriesForPlayers", () => {
  it("takes the status from the pool", () => {
    const players = [player("p1", "Anna B.", 1500)]
    const result = poolEntriesForPlayers(
      players,
      pool([entry("p1", 1500, "paused")])
    )

    expect(result).toEqual([
      {
        player: { id: "p1", displayName: "Anna B.", rating: 1500 },
        status: "paused",
      },
    ])
  })

  it("shows players without a pool entry as absent", () => {
    const players = [player("p1", "Anna B.", 1500)]

    expect(poolEntriesForPlayers(players, pool([]))[0].status).toBe("absent")
  })

  it("takes the master data from the player list, not from the pool", () => {
    // The pool may carry a stale name or an old rating.
    const players = [player("p1", "Anna Bo.", 1620)]
    const result = poolEntriesForPlayers(
      players,
      pool([entry("p1", 1500, "playing", "Anna B.")])
    )

    expect(result[0].player).toEqual({
      id: "p1",
      displayName: "Anna Bo.",
      rating: 1620,
    })
  })
})

describe("sortPoolEntries", () => {
  it("orders alphabetically by display name", () => {
    const sorted = sortPoolEntries([
      entry("c", 1600, "playing", "Carla V."),
      entry("a", 1400, "absent", "Anna B."),
      entry("b", 1500, "paused", "Ben K."),
    ])

    expect(sorted.map((item) => item.player.displayName)).toEqual([
      "Anna B.",
      "Ben K.",
      "Carla V.",
    ])
  })

  it("handles umlauts", () => {
    const sorted = sortPoolEntries([
      entry("z", 1500, "absent", "Zoe"),
      entry("o", 1500, "absent", "Örs"),
      entry("p", 1500, "absent", "Paul"),
    ])

    expect(sorted.map((item) => item.player.displayName)).toEqual([
      "Örs",
      "Paul",
      "Zoe",
    ])
  })

  it("does not reorder when a status changes", () => {
    // The actual point: tiles must not jump when tapped.
    const before = [
      entry("a", 1400, "absent", "Anna B."),
      entry("b", 1600, "playing", "Ben K."),
      entry("c", 1500, "paused", "Carla V."),
    ]
    const after = [
      entry("a", 1400, "playing", "Anna B."),
      entry("b", 1600, "absent", "Ben K."),
      entry("c", 1500, "playing", "Carla V."),
    ]

    expect(sortPoolEntries(before).map((item) => item.player.id)).toEqual(
      sortPoolEntries(after).map((item) => item.player.id)
    )
  })

  it("leaves the input untouched", () => {
    const entries = [
      entry("b", 1400, "absent", "Ben K."),
      entry("a", 1600, "playing", "Anna B."),
    ]
    sortPoolEntries(entries)

    expect(entries.map((item) => item.player.id)).toEqual(["b", "a"])
  })
})

describe("countPoolStatus", () => {
  it("counts per status", () => {
    const counts = countPoolStatus([
      entry("a", 1500, "playing"),
      entry("b", 1500, "playing"),
      entry("c", 1500, "paused"),
      entry("d", 1500, "absent"),
    ])

    expect(counts).toEqual({ playing: 2, paused: 1, absent: 1 })
  })
})

describe("poolWithStatus", () => {
  it("switches an existing entry", () => {
    const before = pool([entry("p1", 1500, "playing")])
    const after = poolWithStatus(
      before,
      before.entries[0].player,
      "paused",
      NOW
    )

    expect(after.entries[0].status).toBe("paused")
    expect(after.updatedAt).toBe(NOW)
  })

  it("adds an unknown player", () => {
    const after = poolWithStatus(
      pool([]),
      { id: "gast", displayName: "Gast G.", rating: 1500 },
      "playing",
      NOW
    )

    expect(after.entries).toEqual([
      {
        player: { id: "gast", displayName: "Gast G.", rating: 1500 },
        status: "playing",
      },
    ])
  })

  it("does not mutate the previous pool", () => {
    const before = pool([entry("p1", 1500, "playing")])
    poolWithStatus(before, before.entries[0].player, "absent", NOW)

    expect(before.entries[0].status).toBe("playing")
    expect(before.updatedAt).toBe("2026-07-27T19:00:00")
  })

  it.each(["paused", "absent"] as const)(
    "keeps a fixed team stored at status %s",
    (status) => {
      const before: Pool = {
        ...pool([entry("p1", 1500, "playing"), entry("p2", 1450, "playing")]),
        fixedTeams: [{ id: "team", players: ["p1", "p2"] }],
      }

      const after = poolWithStatus(
        before,
        before.entries[0].player,
        status,
        NOW
      )

      expect(after.fixedTeams).toEqual(before.fixedTeams)
      expect(activeFixedTeams(after)).toEqual([])
    }
  )

  it("reactivates a stored pairing without linking it again", () => {
    const inactive: Pool = {
      ...pool([entry("p1", 1500, "absent"), entry("p2", 1450, "playing")]),
      fixedTeams: [{ id: "team", players: ["p1", "p2"] }],
    }

    const reactivated = poolWithStatus(
      inactive,
      inactive.entries[0].player,
      "playing",
      NOW
    )

    expect(activeFixedTeams(reactivated)).toEqual(inactive.fixedTeams)
  })
})

describe("poolWithAllPlaying", () => {
  it("brings absent players in", () => {
    const players = [
      player("p1", "Anna B.", 1500),
      player("p2", "Ben K.", 1400),
    ]
    const after = poolWithAllPlaying(pool([]), players, NOW)

    expect(after.entries.map((item) => item.status)).toEqual([
      "playing",
      "playing",
    ])
  })

  it("leaves paused players alone", () => {
    // Someone who signed off is not pulled back in by a bulk action.
    const players = [
      player("p1", "Anna B.", 1500),
      player("p2", "Ben K.", 1400),
    ]
    const after = poolWithAllPlaying(
      pool([entry("p1", 1500, "paused", "Anna B.")]),
      players,
      NOW
    )

    expect(after.entries).toEqual([
      {
        player: { id: "p1", displayName: "Anna B.", rating: 1500 },
        status: "paused",
      },
      {
        player: { id: "p2", displayName: "Ben K.", rating: 1400 },
        status: "playing",
      },
    ])
  })
})

describe("clearedPool", () => {
  it("empties the entries and records the timestamp", () => {
    expect(clearedPool(NOW)).toEqual({
      updatedAt: NOW,
      entries: [],
      fixedTeams: [],
    })
  })
})

describe("fixed teams", () => {
  it("detaches both players from previous teams", () => {
    const before: Pool = {
      ...pool([
        entry("p1", 1500, "playing"),
        entry("p2", 1450, "playing"),
        entry("p3", 1400, "playing"),
      ]),
      fixedTeams: [{ id: "old", players: ["p1", "p3"] }],
    }
    const after = withFixedTeam(
      before,
      before.entries[0].player,
      before.entries[1].player,
      NOW
    )

    expect(after.fixedTeams).toHaveLength(1)
    expect(after.fixedTeams[0].players).toEqual(["p1", "p2"])
    expect(before.fixedTeams[0].players).toEqual(["p1", "p3"])
  })

  it("activates a team only when both are playing", () => {
    const value: Pool = {
      ...pool([entry("p1", 1500, "playing"), entry("p2", 1450, "paused")]),
      fixedTeams: [{ id: "team", players: ["p1", "p2"] }],
    }
    expect(activeFixedTeams(value)).toEqual([])
    expect(
      activeFixedTeams({
        ...value,
        entries: value.entries.map((item) => ({
          ...item,
          status: "playing",
        })),
      })
    ).toEqual(value.fixedTeams)
  })

  it("does not hand a team with an absent member to the round selection", () => {
    const value: Pool = {
      ...pool([entry("p1", 1500, "playing"), entry("p2", 1450, "absent")]),
      fixedTeams: [{ id: "team", players: ["p1", "p2"] }],
    }

    expect(activeFixedTeams(value)).toEqual([])
  })

  it("dissolves a specific team and computes the upper limit", () => {
    const value: Pool = {
      ...pool([]),
      fixedTeams: [{ id: "team", players: ["p1", "p2"] }],
    }
    expect(withoutFixedTeam(value, "team", NOW).fixedTeams).toEqual([])
    expect(maxFixedTeams(3)).toBe(6)
  })
})

describe("effectiveCourts", () => {
  it("follows the recommendation as long as nobody touches the stepper", () => {
    expect(effectiveCourts(null, 12)).toBe(3)
    expect(effectiveCourts(null, 13)).toBe(3)
  })

  it("keeps a choice that was made", () => {
    expect(effectiveCourts(2, 12)).toBe(2)
  })

  it("pulls an oversized choice back to what can be filled", () => {
    // 12 players drop to 4 — three courts can no longer be filled.
    expect(effectiveCourts(3, 4)).toBe(1)
  })

  it("stays at at least one court", () => {
    expect(effectiveCourts(null, 0)).toBe(1)
    expect(effectiveCourts(0, 12)).toBe(1)
  })
})

describe("poolSummaryLabel", () => {
  it("names both counts", () => {
    expect(poolSummaryLabel({ playing: 12, paused: 2, absent: 0 })).toBe(
      "12 spielen · 2 pausieren"
    )
  })

  it("inflects the singular case", () => {
    expect(poolSummaryLabel({ playing: 1, paused: 1, absent: 0 })).toBe(
      "1 spielt · 1 pausiert"
    )
  })
})

describe("courtsConsequenceLabel", () => {
  it("names nobody when everyone plays", () => {
    expect(courtsConsequenceLabel(12, 3)).toBe("12 spielen · 0 setzen aus")
  })

  it("derives who sits out from the court count", () => {
    expect(courtsConsequenceLabel(12, 2)).toBe("12 spielen · 4 setzen aus")
  })

  it("accounts for the remainder of an uneven player count", () => {
    expect(courtsConsequenceLabel(13, 3)).toBe("13 spielen · 1 setzt aus")
  })
})

describe("generateRoundHint", () => {
  it("names the reason when there are too few players", () => {
    expect(generateRoundHint(2, 1)).toBe(
      "Mindestens 4 Spieler nötig — aktuell sind es 2."
    )
  })

  it("inflects the singular case", () => {
    expect(generateRoundHint(1, 1)).toBe(
      "Mindestens 4 Spieler nötig — aktuell ist es 1."
    )
  })

  it("otherwise names what will be created", () => {
    expect(generateRoundHint(12, 3)).toBe("3 Spiele für 12 Spieler")
    expect(generateRoundHint(4, 1)).toBe("1 Spiel für 4 Spieler")
  })
})

describe("noPauseSentence", () => {
  it("phrases the case where nobody sits out", () => {
    expect(noPauseSentence(12, 3)).toBe("Bei 3 Feldern spielen alle 12.")
    expect(noPauseSentence(4, 1)).toBe("Bei 1 Feld spielen alle 4.")
  })
})

describe("sortPauseCandidates", () => {
  it("sorts ascending by quota", () => {
    const sorted = sortPauseCandidates([
      candidate("Carla", 0.5, false),
      candidate("Anna", 0, true),
      candidate("Ben", 0.33, false),
    ])

    expect(sorted.map((item) => item.player.displayName)).toEqual([
      "Anna",
      "Ben",
      "Carla",
    ])
  })

  it("leaves the input untouched", () => {
    const candidates = [
      candidate("Carla", 0.5, false),
      candidate("Anna", 0, true),
    ]
    sortPauseCandidates(candidates)

    expect(candidates[0].player.displayName).toBe("Carla")
  })
})

describe("pauseBoundaryIndex", () => {
  it("sits before the first playing candidate", () => {
    const candidates = [
      candidate("Anna", 0, true),
      candidate("Ben", 0, true),
      candidate("Carla", 0.33, false),
    ]

    expect(pauseBoundaryIndex(candidates)).toBe(2)
  })

  it("is dropped when nobody sits out", () => {
    expect(
      pauseBoundaryIndex([
        candidate("Anna", 0.5, false),
        candidate("Ben", 0.5, false),
      ])
    ).toBeNull()
  })

  it("is dropped when everyone sits out", () => {
    expect(
      pauseBoundaryIndex([
        candidate("Anna", 0, true),
        candidate("Ben", 0, true),
      ])
    ).toBeNull()
  })
})
