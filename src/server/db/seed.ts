import "@tanstack/react-start/server-only"
import "dotenv/config"

import { eq } from "drizzle-orm"

import { DEFAULT_LEAGUE_ID } from "@/lib/league"

import { closeDb, getDb } from "./client"
import { createId } from "./ids"
import { organization } from "./auth-schema"
import {
  leagueSettings,
  leagues,
  playerPools,
  players,
  ratingSnapshots,
} from "./schema"

const seedPlayers = [
  ["Hannes", "Weber", 1662],
  ["Klara", "Neumann", 1638],
  ["Jonas", "Peters", 1588],
  ["Emma", "Lang", 1554],
  ["Carla", "Vogt", 1521],
  ["Ben", "Krause", 1498],
  ["Ida", "Kern", 1495],
  ["Felix", "Braun", 1452],
] as const

const SEED_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001"

async function seed(): Promise<void> {
  const db = getDb()

  await db.transaction(async (tx) => {
    await tx
      .insert(organization)
      .values({
        id: SEED_ORGANIZATION_ID,
        name: "Roundnet Bielefeld",
        slug: "roundnet-bielefeld",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      })
      .onConflictDoNothing({ target: organization.id })
    await tx
      .insert(leagues)
      .values({
        id: DEFAULT_LEAGUE_ID,
        organizationId: SEED_ORGANIZATION_ID,
        name: "Dienstagsgruppe",
      })
      .onConflictDoNothing()
    await tx
      .insert(leagueSettings)
      .values({
        leagueId: DEFAULT_LEAGUE_ID,
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
      .onConflictDoNothing()
    await tx
      .insert(playerPools)
      .values({ leagueId: DEFAULT_LEAGUE_ID })
      .onConflictDoNothing()

    const existing = await tx
      .select({ id: players.id })
      .from(players)
      .where(eq(players.leagueId, DEFAULT_LEAGUE_ID))
    if (existing.length > 0) return

    for (const [firstName, lastName, rating] of seedPlayers) {
      const playerId = createId("player")
      await tx.insert(players).values({
        id: playerId,
        leagueId: DEFAULT_LEAGUE_ID,
        firstName,
        lastName,
      })
      await tx.insert(ratingSnapshots).values({
        id: createId("rating"),
        playerId,
        leagueId: DEFAULT_LEAGUE_ID,
        gameId: null,
        rating,
        rd: 125,
        vol: 0.06,
      })
    }
  })
}

seed()
  .finally(closeDb)
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Seed failed."}\n`
    )
    process.exitCode = 1
  })
