import { describe, expect, it } from "vitest"

import {
  matchingAlgorithmLabel,
  pauseModeLabel,
  settingsWithColumns,
  sortByOptions,
  toggleColumn,
  visibleColumnsSummary,
} from "./settings-view"
import type { Settings, TableColumn } from "./types"

function settings(overrides: Partial<Settings["table"]> = {}): Settings {
  return {
    matchingAlgorithm: "default",
    higherRatingWeight: 2,
    pauseMode: "random",
    initialRating: 1500,
    initialRd: 125,
    table: {
      columns: ["rating", "rd", "gamesPlayed"],
      sortBy: "rating",
      colorRatingChange: true,
      ...overrides,
    },
  }
}

describe("matchingAlgorithmLabel", () => {
  it("names each algorithm by its effect", () => {
    expect(matchingAlgorithmLabel("default")).toBe("Standard")
    expect(matchingAlgorithmLabel("random")).toBe("Zufällig")
  })
})

describe("pauseModeLabel", () => {
  it("labels the tie-break choice", () => {
    expect(pauseModeLabel("random")).toBe("Zufällig")
    expect(pauseModeLabel("lowest_first")).toBe("Schwächste zuerst")
  })
})

describe("visibleColumnsSummary", () => {
  it("lists the columns in table order", () => {
    expect(
      visibleColumnsSummary(["gamesPlayed", "rating", "totalRatingChange"])
    ).toBe("Rating, Spiele, Δ gesamt")
  })

  it("stays empty without any column", () => {
    expect(visibleColumnsSummary([])).toBe("")
  })
})

describe("sortByOptions", () => {
  it("offers visible columns only", () => {
    expect(
      sortByOptions(["rd", "rating"]).map((option) => option.value)
    ).toEqual(["rating", "rd"])
  })
})

describe("settingsWithColumns", () => {
  it("sorts the columns into table order", () => {
    const next = settingsWithColumns(settings(), [
      "gamesWon",
      "rating",
      "rd",
    ] as Array<TableColumn>)

    expect(next.table.columns).toEqual(["rating", "rd", "gamesWon"])
  })

  it("keeps a sort column that stays visible", () => {
    const next = settingsWithColumns(settings({ sortBy: "rd" }), [
      "rd",
      "rating",
    ])

    expect(next.table.sortBy).toBe("rd")
  })

  it("moves to a visible column when the sort column disappears", () => {
    const next = settingsWithColumns(settings({ sortBy: "rd" }), [
      "gamesPlayed",
      "gamesWon",
    ])

    expect(next.table.sortBy).toBe("gamesPlayed")
  })

  it("leaves the remaining settings untouched", () => {
    const before = settings()
    const next = settingsWithColumns(before, ["rating"])

    expect(next.matchingAlgorithm).toBe(before.matchingAlgorithm)
    expect(next.table.colorRatingChange).toBe(true)
    expect(before.table.columns).toEqual(["rating", "rd", "gamesPlayed"])
  })
})

describe("toggleColumn", () => {
  it("shows a column at the right position", () => {
    expect(toggleColumn(["rating", "gamesPlayed"], "rd", true)).toEqual([
      "rating",
      "rd",
      "gamesPlayed",
    ])
  })

  it("hides a column", () => {
    expect(toggleColumn(["rating", "rd"], "rd", false)).toEqual(["rating"])
  })

  it("keeps the last column in place", () => {
    expect(toggleColumn(["rating"], "rating", false)).toEqual(["rating"])
  })

  it("does not modify the input", () => {
    const columns: Array<TableColumn> = ["rating", "rd"]
    toggleColumn(columns, "rd", false)
    expect(columns).toEqual(["rating", "rd"])
  })
})
