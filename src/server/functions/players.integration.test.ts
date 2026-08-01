// @vitest-environment node

import { eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { closeDb, getDb } from "../db/client"
import { createId } from "../db/ids"
import {
  ensureIntegrationTestOrganization,
  INTEGRATION_TEST_ORGANIZATION_ID,
} from "../db/integration-test-organization"
import { leagues, players, ratingSnapshots } from "../db/schema"
import { findPlayer } from "../repositories/players"
import { createPlayerForLeague } from "./create-player.server"

const databaseDescribe = process.env.DATABASE_URL ? describe : describe.skip

beforeAll(async () => {
  if (process.env.DATABASE_URL) await ensureIntegrationTestOrganization()
})

afterAll(async () => {
  await closeDb()
})

async function removeTestLeagues(leagueIds: Array<string>): Promise<void> {
  const database = getDb()
  await database
    .delete(ratingSnapshots)
    .where(inArray(ratingSnapshots.leagueId, leagueIds))
  await database.delete(players).where(inArray(players.leagueId, leagueIds))
  await database.delete(leagues).where(inArray(leagues.id, leagueIds))
}

databaseDescribe("createPlayer Server Function", () => {
  it("normalizes names and points at the unchanged player on conflict", async () => {
    const leagueId = createId("league")
    const otherLeagueId = createId("league")
    const leagueIds = [leagueId, otherLeagueId]
    const database = getDb()
    await database.insert(leagues).values([
      {
        id: leagueId,
        organizationId: INTEGRATION_TEST_ORGANIZATION_ID,
        name: leagueId,
      },
      {
        id: otherLeagueId,
        organizationId: INTEGRATION_TEST_ORGANIZATION_ID,
        name: otherLeagueId,
      },
    ])

    try {
      const created = await createPlayerForLeague({
        leagueId,
        firstName: "  Anna \t Maria ",
        lastName: " van   Berg ",
        rating: 1420,
        rd: 110,
      })
      expect(created.status).toBe("created")
      if (created.status !== "created") {
        throw new Error("The first player was not created.")
      }
      expect(created.player).toMatchObject({
        firstName: "Anna Maria",
        lastName: "van Berg",
        rating: 1420,
        totalRatingChange: 0,
      })

      const conflict = await createPlayerForLeague({
        leagueId,
        firstName: "anna  maria",
        lastName: "VAN BERG",
        rating: 2100,
        rd: 50,
      })
      expect(conflict).toEqual({
        status: "conflict",
        error: {
          code: "PLAYER_NAME_CONFLICT",
          existingPlayerId: created.player.id,
        },
      })

      const unchanged = await findPlayer(database, leagueId, created.player.id)
      expect(unchanged).toMatchObject({
        firstName: "Anna Maria",
        lastName: "van Berg",
        rating: 1420,
        rd: 110,
        totalRatingChange: 0,
      })

      const otherLeague = await createPlayerForLeague({
        leagueId: otherLeagueId,
        firstName: "ANNA MARIA",
        lastName: "van berg",
        rating: 1600,
        rd: 125,
      })
      expect(otherLeague.status).toBe("created")
    } finally {
      await removeTestLeagues(leagueIds)
    }
  })

  it("allows only one active name even under concurrent requests", async () => {
    const leagueId = createId("league")
    const database = getDb()
    await database.insert(leagues).values({
      id: leagueId,
      organizationId: INTEGRATION_TEST_ORGANIZATION_ID,
      name: leagueId,
    })

    try {
      const [first, second] = await Promise.all([
        createPlayerForLeague({
          leagueId,
          firstName: "Noah",
          lastName: "Klein",
          rating: 1500,
          rd: 125,
        }),
        createPlayerForLeague({
          leagueId,
          firstName: " noah ",
          lastName: "KLEIN",
          rating: 1900,
          rd: 80,
        }),
      ])

      const created = [first, second].find(
        (result) => result.status === "created"
      )
      const conflict = [first, second].find(
        (result) => result.status === "conflict"
      )
      expect(created?.status).toBe("created")
      expect(conflict?.status).toBe("conflict")
      if (created?.status !== "created" || conflict?.status !== "conflict") {
        throw new Error("Concurrent player creation had no unambiguous result.")
      }
      expect(conflict.error.existingPlayerId).toBe(created.player.id)

      const rows = await database
        .select({ id: players.id })
        .from(players)
        .where(eq(players.leagueId, leagueId))
      expect(rows).toEqual([{ id: created.player.id }])
    } finally {
      await removeTestLeagues([leagueId])
    }
  })
})
