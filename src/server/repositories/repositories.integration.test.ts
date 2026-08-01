// @vitest-environment node

import { eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { buildWeightMatrices } from "@/lib/matchmaking/weights"
import { generateMatchExplanation } from "@/lib/matchmaking/explanation"
import { solveMatching } from "@/lib/matchmaking/solver"
import { activeFixedTeams } from "@/lib/pool"

import { closeDb, getDb } from "../db/client"
import { createId } from "../db/ids"
import {
  ensureIntegrationTestOrganization,
  INTEGRATION_TEST_ORGANIZATION_ID,
} from "../db/integration-test-organization"
import {
  gameBlocks,
  leagueSettings,
  leagues,
  playerPools,
  players,
  ratingSnapshots,
} from "../db/schema"
import {
  findAllPlayers,
  insertPlayer,
  PlayerNameConstraintError,
} from "./players"
import { findPauseStatsToday, findPool, replacePool } from "./pool"
import {
  cancelAllRoundGames,
  cancelOpenRoundGames,
  findPlayedGameRatingInputs,
  findHistory,
  findRound,
  insertRound,
  markRoundCommitted,
  ratingsForPlayers,
  updateGameCancellation,
  updateGameResult,
  writeRatingResults,
} from "./rounds"

const databaseDescribe = process.env.DATABASE_URL ? describe : describe.skip

beforeAll(async () => {
  if (process.env.DATABASE_URL) await ensureIntegrationTestOrganization()
})

afterAll(async () => {
  await closeDb()
})

databaseDescribe("PostgreSQL repositories", () => {
  it("translates the unique constraint for normalized active names", async () => {
    const leagueId = createId("league")
    const database = getDb()
    await database.insert(leagues).values({
      id: leagueId,
      organizationId: INTEGRATION_TEST_ORGANIZATION_ID,
      name: leagueId,
    })

    try {
      await database.transaction((tx) =>
        insertPlayer(tx, {
          leagueId,
          firstName: "  Lea ",
          lastName: "Winter",
          rating: 1500,
          rd: 125,
        })
      )

      await expect(
        database.transaction((tx) =>
          insertPlayer(tx, {
            leagueId,
            firstName: "lea",
            lastName: " WINTER ",
            rating: 1900,
            rd: 80,
          })
        )
      ).rejects.toBeInstanceOf(PlayerNameConstraintError)
    } finally {
      await database
        .delete(ratingSnapshots)
        .where(eq(ratingSnapshots.leagueId, leagueId))
      await database.delete(players).where(eq(players.leagueId, leagueId))
      await database.delete(leagues).where(eq(leagues.id, leagueId))
    }
  })

  it("runs pool, matching, result and rating commit atomically", async () => {
    await expect(
      getDb().transaction(async (tx) => {
        const leagueId = createId("league")
        await tx.insert(leagues).values({
          id: leagueId,
          organizationId: INTEGRATION_TEST_ORGANIZATION_ID,
          name: leagueId,
        })
        await tx.insert(leagueSettings).values({
          leagueId,
          tableColumns: ["rating"],
          tableSortBy: "rating",
        })
        await tx.insert(playerPools).values({ leagueId })

        for (const [index, rating] of [
          1700, 1600, 1400, 1300, 1200,
        ].entries()) {
          await insertPlayer(tx, {
            leagueId,
            firstName: `Player${index}`,
            lastName: "Test",
            rating,
            rd: 125,
          })
        }
        const allPlayers = await findAllPlayers(tx, leagueId)
        await replacePool(tx, leagueId, {
          updatedAt: new Date().toISOString(),
          entries: allPlayers.map((player) => ({
            player: {
              id: player.id,
              displayName: player.displayName,
              rating: player.rating,
            },
            status: "playing",
          })),
          fixedTeams: [],
        })
        expect((await findPool(tx, leagueId)).entries).toHaveLength(4)

        const playing = allPlayers.slice(0, 4)
        const paused = allPlayers[4]
        const ids = playing.map((player) => player.id)
        const current = await ratingsForPlayers(tx, leagueId, ids)
        const matchmakingPlayers = playing.map((player) => ({
          id: player.id,
          rating: player.rating,
        }))
        const weights = buildWeightMatrices(ids, [])
        const solution = await solveMatching({
          players: matchmakingPlayers,
          weights,
          higherRatingWeight: 2,
        })
        const explanation = generateMatchExplanation({
          matchups: solution.matchups,
          players: matchmakingPlayers,
          weights,
          higherRatingWeight: 2,
        })
        const roundId = createId("block")
        await insertRound(
          tx,
          {
            id: roundId,
            leagueId,
            matchups: solution.matchups,
            assignedPauses: [paused.id],
            voluntaryPauses: [],
            explanation,
          },
          current
        )
        const active = await findRound(tx, leagueId, roundId)
        expect(active?.games).toHaveLength(1)
        expect(active?.explanation).toEqual(explanation)
        const gameId = active?.games[0].id
        if (!gameId) throw new Error("Integration test produced no game.")

        await cancelOpenRoundGames(tx, leagueId, roundId)
        expect((await findRound(tx, leagueId, roundId))?.games[0].status).toBe(
          "cancelled"
        )
        await updateGameCancellation(tx, leagueId, roundId, gameId, false)
        expect((await findRound(tx, leagueId, roundId))?.games[0].status).toBe(
          "open"
        )

        await updateGameResult(tx, leagueId, roundId, gameId, 21, 15)
        await cancelOpenRoundGames(tx, leagueId, roundId)
        expect((await findRound(tx, leagueId, roundId))?.games[0].status).toBe(
          "finished"
        )

        await cancelAllRoundGames(tx, leagueId, roundId)
        expect((await findRound(tx, leagueId, roundId))?.games[0].status).toBe(
          "cancelled"
        )
        await updateGameCancellation(tx, leagueId, roundId, gameId, false)
        expect(
          (await findRound(tx, leagueId, roundId))?.games[0].result
        ).toMatchObject({ pointsA: 21, pointsB: 15 })
        const inputs = await findPlayedGameRatingInputs(tx, leagueId, roundId)
        await writeRatingResults(tx, inputs, new Date().toISOString())
        await markRoundCommitted(tx, leagueId, roundId)

        const committed = await findRound(tx, leagueId, roundId)
        expect(committed?.status).toBe("committed")
        expect(committed?.games[0].result?.ratingChanges).toHaveLength(4)
        const pauseStats = await findPauseStatsToday(tx, leagueId, ids)
        expect(pauseStats.every((stats) => stats.gamesPlayedToday === 1)).toBe(
          true
        )
        expect(
          (await findPauseStatsToday(tx, leagueId, [paused.id]))[0]
            .gamesPausedToday
        ).toBe(1)

        const cancelledRoundId = createId("block")
        await insertRound(
          tx,
          {
            id: cancelledRoundId,
            leagueId,
            matchups: solution.matchups,
            assignedPauses: [paused.id],
            voluntaryPauses: [],
          },
          await ratingsForPlayers(tx, leagueId, ids)
        )
        await cancelAllRoundGames(tx, leagueId, cancelledRoundId)
        await markRoundCommitted(tx, leagueId, cancelledRoundId)
        expect(
          (await findPauseStatsToday(tx, leagueId, [paused.id]))[0]
            .gamesPausedToday
        ).toBe(1)
        expect(
          (await findAllPlayers(tx, leagueId)).find(
            (player) => player.id === paused.id
          )?.gamesPaused
        ).toBe(1)
        tx.rollback()
      })
    ).rejects.toThrow()
  })

  it("persists fixed teams with absent members and reactivates them", async () => {
    await expect(
      getDb().transaction(async (tx) => {
        const leagueId = createId("league")
        await tx.insert(leagues).values({
          id: leagueId,
          organizationId: INTEGRATION_TEST_ORGANIZATION_ID,
          name: leagueId,
        })
        await tx.insert(playerPools).values({ leagueId })
        for (const firstName of ["Ada", "Berta"]) {
          await insertPlayer(tx, {
            leagueId,
            firstName,
            lastName: "Pooltest",
            rating: 1500,
            rd: 125,
          })
        }
        const [first, second] = await findAllPlayers(tx, leagueId)
        const basePool = {
          updatedAt: new Date().toISOString(),
          entries: [
            {
              player: {
                id: first.id,
                displayName: first.displayName,
                rating: first.rating,
              },
              status: "absent" as const,
            },
            {
              player: {
                id: second.id,
                displayName: second.displayName,
                rating: second.rating,
              },
              status: "playing" as const,
            },
          ],
          fixedTeams: [
            {
              id: "fixed_team_persistence",
              players: [first.id, second.id] as [string, string],
            },
          ],
        }

        const inactive = await replacePool(tx, leagueId, basePool)
        expect(inactive.fixedTeams).toEqual(basePool.fixedTeams)
        expect(activeFixedTeams(inactive)).toEqual([])

        const reactivated = await replacePool(tx, leagueId, {
          ...inactive,
          entries: inactive.entries.map((entry) =>
            entry.player.id === first.id
              ? { ...entry, status: "playing" }
              : entry
          ),
        })
        expect(activeFixedTeams(reactivated)).toEqual(reactivated.fixedTeams)
        tx.rollback()
      })
    ).rejects.toThrow()
  })

  it("filters custom statistics ranges by the Berlin 05:00 boundary", async () => {
    let verified = false
    const rollback = new Error("rollback after statistics range test")
    await expect(
      getDb().transaction(async (tx) => {
        const leagueId = createId("league")
        await tx.insert(leagues).values({
          id: leagueId,
          organizationId: INTEGRATION_TEST_ORGANIZATION_ID,
          name: leagueId,
        })
        await tx.insert(gameBlocks).values([
          {
            id: createId("block"),
            leagueId,
            committed: true,
            createdAt: new Date("2026-07-20T04:59:00+02:00"),
          },
          {
            id: createId("block"),
            leagueId,
            committed: true,
            createdAt: new Date("2026-07-20T05:00:00+02:00"),
          },
          {
            id: createId("block"),
            leagueId,
            committed: true,
            createdAt: new Date("2026-07-21T04:59:00+02:00"),
          },
        ])

        const history = await findHistory(tx, leagueId, {
          kind: "custom",
          from: "2026-07-20",
          to: "2026-07-20",
        })

        expect(history).toHaveLength(1)
        expect(history[0].date).toBe("2026-07-20")
        expect(history[0].rounds).toHaveLength(2)
        verified = true
        throw rollback
      })
    ).rejects.toBe(rollback)
    expect(verified).toBe(true)
  })
})
