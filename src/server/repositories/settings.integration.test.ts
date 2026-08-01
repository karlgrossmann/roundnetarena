// @vitest-environment node

import { eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import type { Settings } from "@/lib/types"

import { closeDb, getDb } from "../db/client"
import { createId } from "../db/ids"
import {
  ensureIntegrationTestOrganization,
  INTEGRATION_TEST_ORGANIZATION_ID,
} from "../db/integration-test-organization"
import { leagueSettings, leagues, players, ratingSnapshots } from "../db/schema"
import { findPlayer, insertPlayer } from "./players"
import { findSettings, upsertSettings } from "./settings"

const databaseDescribe = process.env.DATABASE_URL ? describe : describe.skip

beforeAll(async () => {
  if (process.env.DATABASE_URL) await ensureIntegrationTestOrganization()
})

const settings: Settings = {
  matchingAlgorithm: "default",
  higherRatingWeight: 2,
  pauseMode: "random",
  initialRating: 1500,
  initialRd: 125,
  table: {
    columns: ["rating", "rd"],
    sortBy: "rating",
    colorRatingChange: true,
  },
}

afterAll(async () => {
  await closeDb()
})

databaseDescribe("settings repository", () => {
  it("reloads changed defaults without altering existing ratings", async () => {
    const database = getDb()
    const leagueId = createId("league")
    await database.insert(leagues).values({
      id: leagueId,
      organizationId: INTEGRATION_TEST_ORGANIZATION_ID,
      name: leagueId,
    })

    try {
      const existing = await database.transaction(async (tx) => {
        await upsertSettings(tx, leagueId, settings)
        return insertPlayer(tx, {
          leagueId,
          firstName: "Bestehende",
          lastName: "Person",
          rating: settings.initialRating,
          rd: settings.initialRd,
        })
      })

      await database.transaction((tx) =>
        upsertSettings(tx, leagueId, {
          ...settings,
          initialRating: 1725,
          initialRd: 100,
        })
      )

      const reloaded = await findSettings(database, leagueId)
      expect(reloaded).toMatchObject({
        initialRating: 1725,
        initialRd: 100,
      })
      if (!reloaded) throw new Error("Stored defaults are missing.")

      const created = await database.transaction((tx) =>
        insertPlayer(tx, {
          leagueId,
          firstName: "Neue",
          lastName: "Person",
          rating: reloaded.initialRating,
          rd: reloaded.initialRd,
        })
      )

      expect(created).toMatchObject({ rating: 1725, rd: 100 })
      await expect(
        findPlayer(database, leagueId, existing.id)
      ).resolves.toMatchObject({ rating: 1500, rd: 125 })
    } finally {
      await database
        .delete(ratingSnapshots)
        .where(eq(ratingSnapshots.leagueId, leagueId))
      await database.delete(players).where(eq(players.leagueId, leagueId))
      await database
        .delete(leagueSettings)
        .where(eq(leagueSettings.leagueId, leagueId))
      await database.delete(leagues).where(eq(leagues.id, leagueId))
    }
  })
})
