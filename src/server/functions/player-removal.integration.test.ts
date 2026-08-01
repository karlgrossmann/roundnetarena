// @vitest-environment node

import { and, eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { anonymizedPlayerKey } from "@/lib/player-removal"

import { closeDb, getDb } from "../db/client"
import { createId } from "../db/ids"
import {
  ensureIntegrationTestOrganization,
  INTEGRATION_TEST_ORGANIZATION_ID,
} from "../db/integration-test-organization"
import {
  blockPauses,
  gameBlocks,
  gameParticipations,
  games,
  leagues,
  playerPoolMembers,
  playerPools,
  players,
  ratingSnapshots,
} from "../db/schema"
import {
  findAllPlayers,
  findPlayerRefs,
  insertPlayer,
} from "../repositories/players"
import {
  cancelAllRoundGames,
  findRound,
  insertRound,
  markRoundCommitted,
  ratingsForPlayers,
} from "../repositories/rounds"
import { deletePlayerForLeague } from "./delete-player.server"

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

async function createPlayer(
  leagueId: string,
  firstName: string,
  lastName = "Test"
) {
  return getDb().transaction((tx) =>
    insertPlayer(tx, {
      leagueId,
      firstName,
      lastName,
      rating: 1500,
      rd: 125,
    })
  )
}

async function cleanupLeague(leagueId: string): Promise<void> {
  const database = getDb()
  await database
    .delete(playerPoolMembers)
    .where(eq(playerPoolMembers.leagueId, leagueId))
  await database
    .delete(gameParticipations)
    .where(eq(gameParticipations.leagueId, leagueId))
  await database.delete(blockPauses).where(eq(blockPauses.leagueId, leagueId))
  await database
    .delete(ratingSnapshots)
    .where(eq(ratingSnapshots.leagueId, leagueId))
  await database.delete(games).where(eq(games.leagueId, leagueId))
  await database.delete(gameBlocks).where(eq(gameBlocks.leagueId, leagueId))
  await database.delete(players).where(eq(players.leagueId, leagueId))
  await database.delete(playerPools).where(eq(playerPools.leagueId, leagueId))
  await database.delete(leagues).where(eq(leagues.id, leagueId))
}

async function playerRow(leagueId: string, playerId: string) {
  return (
    await getDb()
      .select()
      .from(players)
      .where(and(eq(players.leagueId, leagueId), eq(players.id, playerId)))
  )[0]
}

databaseDescribe("deletePlayerForLeague", () => {
  it("fully deletes a player referenced only by initial rating and current pool", async () => {
    const leagueId = await createLeague()
    try {
      const player = await createPlayer(leagueId, "Unreferenziert")
      await getDb().insert(playerPools).values({ leagueId })
      await getDb().insert(playerPoolMembers).values({
        leagueId,
        playerId: player.id,
        status: "active",
      })

      await expect(
        deletePlayerForLeague({ leagueId, playerId: player.id })
      ).resolves.toEqual({ id: player.id, kind: "deleted" })

      expect(await playerRow(leagueId, player.id)).toBeUndefined()
      expect(
        await getDb()
          .select()
          .from(ratingSnapshots)
          .where(eq(ratingSnapshots.playerId, player.id))
      ).toHaveLength(0)
      expect(
        await getDb()
          .select()
          .from(playerPoolMembers)
          .where(eq(playerPoolMembers.playerId, player.id))
      ).toHaveLength(0)
    } finally {
      await cleanupLeague(leagueId)
    }
  })

  it("anonymizes even for a cancelled game participation and keeps the round without the real name", async () => {
    const leagueId = await createLeague()
    try {
      const all = await Promise.all(
        ["Klara", "Anna", "Hannes", "Lukas"].map((name) =>
          createPlayer(leagueId, name)
        )
      )
      const target = all[0]
      const roundId = createId("block")
      await getDb().transaction(async (tx) => {
        await insertRound(
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
        await cancelAllRoundGames(tx, leagueId, roundId)
        await markRoundCommitted(tx, leagueId, roundId)
      })

      await expect(
        deletePlayerForLeague({ leagueId, playerId: target.id })
      ).resolves.toEqual({ id: target.id, kind: "anonymized" })

      const stored = await playerRow(leagueId, target.id)
      expect(stored).toMatchObject({
        firstName: "",
        lastName: "",
        markedAsDeleted: true,
        anonymizedKey: anonymizedPlayerKey(target.id),
      })
      expect(await findAllPlayers(getDb(), leagueId)).not.toContainEqual(
        expect.objectContaining({ id: target.id })
      )

      const round = await findRound(getDb(), leagueId, roundId)
      const serializedRound = JSON.stringify(round)
      expect(serializedRound).not.toContain("Klara")
      expect(serializedRound).toContain(anonymizedPlayerKey(target.id))
      expect((await findPlayerRefs(getDb(), leagueId)).get(target.id)).toEqual(
        expect.objectContaining({
          id: target.id,
          anonymizedKey: anonymizedPlayerKey(target.id),
        })
      )
    } finally {
      await cleanupLeague(leagueId)
    }
  })

  it("anonymizes a player referenced only by a pause", async () => {
    const leagueId = await createLeague()
    try {
      const player = await createPlayer(leagueId, "Pausierend")
      const roundId = createId("block")
      await getDb().insert(gameBlocks).values({
        id: roundId,
        leagueId,
        committed: true,
      })
      await getDb().insert(blockPauses).values({
        blockId: roundId,
        leagueId,
        playerId: player.id,
        reason: "assigned",
      })

      await expect(
        deletePlayerForLeague({ leagueId, playerId: player.id })
      ).resolves.toEqual({ id: player.id, kind: "anonymized" })
      expect(await playerRow(leagueId, player.id)).toMatchObject({
        firstName: "",
        lastName: "",
        markedAsDeleted: true,
      })
    } finally {
      await cleanupLeague(leagueId)
    }
  })

  it("anonymizes for a historical rating snapshot without participation", async () => {
    const leagueId = await createLeague()
    try {
      const player = await createPlayer(leagueId, "Bewertet")
      const roundId = createId("block")
      const gameId = createId("game")
      await getDb().insert(gameBlocks).values({
        id: roundId,
        leagueId,
        committed: true,
      })
      await getDb().insert(games).values({
        id: gameId,
        blockId: roundId,
        leagueId,
        localIdx: 1,
        status: "cancelled",
      })
      await getDb()
        .insert(ratingSnapshots)
        .values({
          id: createId("rating"),
          playerId: player.id,
          leagueId,
          gameId,
          rating: 1510,
          rd: 120,
          vol: 0.06,
        })

      await expect(
        deletePlayerForLeague({ leagueId, playerId: player.id })
      ).resolves.toEqual({ id: player.id, kind: "anonymized" })
      expect(await playerRow(leagueId, player.id)).toMatchObject({
        firstName: "",
        lastName: "",
        markedAsDeleted: true,
      })
    } finally {
      await cleanupLeague(leagueId)
    }
  })

  it("rolls back pool removal and anonymization together on a write error", async () => {
    const leagueId = await createLeague()
    try {
      const target = await createPlayer(leagueId, "Transaktion")
      const blockerId = createId("player")
      await getDb()
        .insert(players)
        .values({
          id: blockerId,
          leagueId,
          firstName: "",
          lastName: "",
          markedAsDeleted: true,
          anonymizedKey: anonymizedPlayerKey(target.id),
        })
      await getDb()
        .insert(ratingSnapshots)
        .values({
          id: createId("rating"),
          playerId: blockerId,
          leagueId,
          gameId: null,
          rating: 1500,
          rd: 125,
          vol: 0.06,
        })
      await getDb().insert(playerPools).values({ leagueId })
      await getDb().insert(playerPoolMembers).values({
        leagueId,
        playerId: target.id,
        status: "active",
      })
      const roundId = createId("block")
      await getDb().insert(gameBlocks).values({ id: roundId, leagueId })
      await getDb().insert(blockPauses).values({
        blockId: roundId,
        leagueId,
        playerId: target.id,
        reason: "voluntary",
      })

      await expect(
        deletePlayerForLeague({ leagueId, playerId: target.id })
      ).rejects.toThrow("Failed query")

      expect(await playerRow(leagueId, target.id)).toMatchObject({
        firstName: "Transaktion",
        lastName: "Test",
        markedAsDeleted: false,
        anonymizedKey: null,
      })
      expect(
        await getDb()
          .select()
          .from(playerPoolMembers)
          .where(eq(playerPoolMembers.playerId, target.id))
      ).toHaveLength(1)
    } finally {
      await cleanupLeague(leagueId)
    }
  })
})
