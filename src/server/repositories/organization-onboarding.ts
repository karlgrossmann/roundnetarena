import "@tanstack/react-start/server-only"

import { getDb } from "../db/client"
import type { Executor } from "../db/client"
import { leagueSettings, leagues, playerPools } from "../db/schema"

interface OrganizationDefaultsInput {
  id: string
  name: string
  slug: string
}

export async function provisionOrganizationDefaults(
  organization: OrganizationDefaultsInput
): Promise<string> {
  return getDb().transaction(async (tx) => {
    const leagueId = `league_${organization.id}`
    await tx
      .insert(leagues)
      .values({
        id: leagueId,
        organizationId: organization.id,
        name: "Standardliga",
      })
      .onConflictDoNothing({ target: leagues.id })
    await provisionLeagueDefaults(tx, leagueId)

    return leagueId
  })
}

export async function provisionLeagueDefaults(
  executor: Executor,
  leagueId: string
): Promise<void> {
  await executor
    .insert(leagueSettings)
    .values({
      leagueId,
      tableColumns: [
        "rating",
        "rd",
        "gamesPlayed",
        "gamesWon",
        "totalRatingChange",
      ],
      tableSortBy: "rating",
      tableColoring: true,
    })
    .onConflictDoNothing({ target: leagueSettings.leagueId })
  await executor
    .insert(playerPools)
    .values({ leagueId })
    .onConflictDoNothing({ target: playerPools.leagueId })
}
