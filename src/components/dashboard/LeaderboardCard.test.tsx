import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { LeaderboardCard } from "./LeaderboardCard"
import { makePlayer } from "@/lib/fixtures"
import type { TableConfig } from "@/lib/types"

const config: TableConfig = {
  columns: ["rating", "gamesPlayed"],
  sortBy: "rating",
  colorRatingChange: false,
}

describe("LeaderboardCard", () => {
  it("renders players without a detail link when no link context is passed", () => {
    render(
      <LeaderboardCard
        players={[makePlayer({ id: "player_1", displayName: "Alex M." })]}
        currentPoolPlayerIds={["player_1"]}
        config={config}
      />
    )

    expect(screen.getAllByText("Alex M.")).toHaveLength(2)
    expect(screen.queryByRole("link", { name: "Alex M." })).toBeNull()
  })
})
