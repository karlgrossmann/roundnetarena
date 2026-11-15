// @vitest-environment node

import { eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { closeDb, getDb } from "../db/client"
import { createId } from "../db/ids"
import {
  ensureIntegrationTestOrganization,
  INTEGRATION_TEST_ORGANIZATION_ID,
} from "../db/integration-test-organization"
import {
  gameBlocks,
  gameParticipations,
  games,
  leagues,
  players,
  ratingSnapshots,
} from "../db/schema"
import {
  findPlayer,
  findPlayerRatingHistory,
  insertPlayer,
} from "../repositories/players"
import {
  cancelAllRoundGames,
  insertRound,
  markRoundCommitted,
  ratingsForPlayers,
} from "../repositories/rounds"
import { deletePlayerForLeague } from "./delete-player.server"
import { updatePlayerForLeague } from "./update-player.server"

const databaseDescribe = process.env.DATABASE_URL ? describe : describe.skip

beforeAll(async () => {
  if (process.env.DATABASE_URL) await ensureIntegrationTestOrganization()
})

afterAll(async () => {
  await closeDb()
})

async function createLeague(): Promise<string> {
  const leagueId = createId("league")
  await getDb().insert(leagues).values({
    id: leagueId,
    organizationId: INTEGRATION_TEST_ORGANIZATION_ID,
    name: leagueId,
  })
  return leagueId
}

async function createPlayer(leagueId: string, firstName: string) {
  return getDb().transaction((tx) =>
    insertPlayer(tx, {
      leagueId,
      firstName,
      lastName: "Test",
      rating: 1500,
      rd: 125,
    })
  )
}

async function cleanupLeague(leagueId: string): Promise<void> {
  const database = getDb()
  await database
    .delete(gameParticipations)
    .where(eq(gameParticipations.leagueId, leagueId))
  await database
    .delete(ratingSnapshots)
    .where(eq(ratingSnapshots.leagueId, leagueId))
  await database.delete(games).where(eq(games.leagueId, leagueId))
  await database.delete(gameBlocks).where(eq(gameBlocks.leagueId, leagueId))
  await database.delete(players).where(eq(players.leagueId, leagueId))
  await database.delete(leagues).where(eq(leagues.id, leagueId))
}

databaseDescribe("updatePlayerForLeague", () => {
  it("renames, and points at the other player on a name conflict", async () => {
    const leagueId = await createLeague()
    try {
      const klara = await createPlayer(leagueId, "Klara")
      const anna = await createPlayer(leagueId, "Anna")

      const renamed = await updatePlayerForLeague({
        leagueId,
        playerId: klara.id,
        firstName: "  klara ",
        lastName: "Nowak",
      })
      expect(renamed).toMatchObject({
        status: "updated",
        player: { firstName: "klara", lastName: "Nowak", rating: 1500 },
      })

      await expect(
        updatePlayerForLeague({
          leagueId,
          playerId: anna.id,
          firstName: "KLARA",
          lastName: "nowak",
        })
      ).resolves.toEqual({
        status: "conflict",
        error: { code: "PLAYER_NAME_CONFLICT", existingPlayerId: klara.id },
      })
      expect(await findPlayer(getDb(), leagueId, anna.id)).toMatchObject({
        firstName: "Anna",
      })
    } finally {
      await cleanupLeague(leagueId)
    }
  })

  it("corrects the rating from now on and keeps the start value", async () => {
    const leagueId = await createLeague()
    try {
      const klara = await createPlayer(leagueId, "Klara")

      const result = await updatePlayerForLeague({
        leagueId,
        playerId: klara.id,
        firstName: "Klara",
        lastName: "Test",
        rating: 1720,
      })
      expect(result).toMatchObject({
        status: "updated",
        player: { rating: 1720, rd: 125, totalRatingChange: 220 },
      })
      expect(
        (await findPlayerRatingHistory(getDb(), leagueId, klara.id)).map(
          (point) => point.rating
        )
      ).toEqual([1500, 1720])

      // Only the start snapshot and a correction exist: nothing to anonymize.
      await expect(
        deletePlayerForLeague({ leagueId, playerId: klara.id })
      ).resolves.toEqual({ id: klara.id, kind: "deleted" })
    } finally {
      await cleanupLeague(leagueId)
    }
  })

  it("locks the rating while the player sits in a running round", async () => {
    const leagueId = await createLeague()
    try {
      const all = await Promise.all(
        ["Klara", "Anna", "Hannes", "Lukas"].map((name) =>
          createPlayer(leagueId, name)
        )
      )
      const roundId = createId("block")
      await getDb().transaction(async (tx) =>
        insertRound(
          tx,
          {
            id: roundId,
            leagueId,
            matchups: [[all[0].id, all[1].id, all[2].id, all[3].id]],
            assignedPauses: [],
            voluntaryPauses: [],
          },
          await ratingsForPlayers(
            tx,
            leagueId,
            all.map((player) => player.id)
          )
        )
      )
      const edit = {
        leagueId,
        playerId: all[0].id,
        firstName: "Clara",
        lastName: "Test",
      }

      await expect(updatePlayerForLeague({ ...edit, rd: 80 })).rejects.toThrow(
        "player.rating_locked_in_round"
      )
      // The whole edit rolls back, the rename included.
      expect(await findPlayer(getDb(), leagueId, all[0].id)).toMatchObject({
        firstName: "Klara",
        rd: 125,
      })
      await expect(updatePlayerForLeague(edit)).resolves.toMatchObject({
        status: "updated",
        player: { firstName: "Clara" },
      })

      await getDb().transaction(async (tx) => {
        await cancelAllRoundGames(tx, leagueId, roundId)
        await markRoundCommitted(tx, leagueId, roundId)
      })
      await expect(
        updatePlayerForLeague({ ...edit, rd: 80 })
      ).resolves.toMatchObject({ status: "updated", player: { rd: 80 } })
    } finally {
      await cleanupLeague(leagueId)
    }
  })
})
