// @vitest-environment node

import { inArray } from "drizzle-orm"
import { afterAll, describe, expect, it } from "vitest"

import { DomainError } from "@/lib/domain-errors"

import { requireLeagueAccess } from "./league-access.server"
import { closeDb, getDb } from "../db/client"
import { member, organization, user } from "../db/auth-schema"
import {
  leagueSettings,
  leagues,
  playerPools,
  players,
  ratingSnapshots,
} from "../db/schema"
import { createId } from "../db/ids"
import { provisionLeagueDefaults } from "../repositories/organization-onboarding"
import {
  findLeaguesForOrganization,
  insertLeague,
} from "../repositories/leagues"
import { insertPlayer } from "../repositories/players"

const databaseDescribe = process.env.DATABASE_URL ? describe : describe.skip

afterAll(async () => {
  await closeDb()
})

databaseDescribe("fachliche Mandantengrenze", () => {
  it("separates organizations and leagues and rejects tampered combinations", async () => {
    const db = getDb()
    const organizationA = crypto.randomUUID()
    const organizationB = crypto.randomUUID()
    const ownerA = crypto.randomUUID()
    const ownerB = crypto.randomUUID()
    const managerA = crypto.randomUUID()
    const leagueA1 = createId("league")
    const leagueA2 = createId("league")
    const leagueB = createId("league")
    const organizationIds = [organizationA, organizationB]
    const userIds = [ownerA, ownerB, managerA]
    const leagueIds = [leagueA1, leagueA2, leagueB]

    try {
      await db.insert(organization).values([
        {
          id: organizationA,
          name: "Club A",
          slug: `club-a-${organizationA}`,
          createdAt: new Date(),
        },
        {
          id: organizationB,
          name: "Club B",
          slug: `club-b-${organizationB}`,
          createdAt: new Date(),
        },
      ])
      await db.insert(user).values(
        userIds.map((id, index) => ({
          id,
          name: `User ${index}`,
          email: `${id}@example.com`,
          emailVerified: true,
        }))
      )
      await db.insert(member).values([
        {
          organizationId: organizationA,
          userId: ownerA,
          role: "owner",
          createdAt: new Date(),
        },
        {
          organizationId: organizationB,
          userId: ownerB,
          role: "owner",
          createdAt: new Date(),
        },
        {
          organizationId: organizationA,
          userId: managerA,
          role: "manager",
          createdAt: new Date(),
        },
      ])

      await db.transaction(async (tx) => {
        await insertLeague(tx, {
          id: leagueA1,
          organizationId: organizationA,
          name: "Liga 1",
        })
        await insertLeague(tx, {
          id: leagueA2,
          organizationId: organizationA,
          name: "Liga 2",
        })
        await insertLeague(tx, {
          id: leagueB,
          organizationId: organizationB,
          name: "Liga 1",
        })
        await Promise.all(
          leagueIds.map((leagueId) => provisionLeagueDefaults(tx, leagueId))
        )
        await insertPlayer(tx, {
          leagueId: leagueA1,
          firstName: "Ada",
          lastName: "A",
          rating: 1500,
          rd: 125,
        })
        await insertPlayer(tx, {
          leagueId: leagueA2,
          firstName: "Berta",
          lastName: "A",
          rating: 1500,
          rd: 125,
        })
        await insertPlayer(tx, {
          leagueId: leagueB,
          firstName: "Carla",
          lastName: "B",
          rating: 1500,
          rd: 125,
        })
      })

      const leaguesA = await findLeaguesForOrganization(db, organizationA)
      expect(leaguesA.map((league) => league.id)).toEqual([leagueA1, leagueA2])
      expect(leaguesA.map((league) => league.playerCount)).toEqual([1, 1])

      await expect(
        requireLeagueAccess(db, {
          organizationId: organizationA,
          leagueId: leagueA2,
          userId: ownerA,
          permission: "play:manage",
        })
      ).resolves.toMatchObject({ organizationId: organizationA, id: leagueA2 })

      await expect(
        requireLeagueAccess(db, {
          organizationId: organizationA,
          leagueId: leagueB,
          userId: ownerA,
        })
      ).rejects.toEqual(new DomainError("league.not_found"))
      await expect(
        requireLeagueAccess(db, {
          organizationId: organizationA,
          leagueId: leagueA1,
          userId: ownerB,
        })
      ).rejects.toEqual(new DomainError("league.not_found"))
      await expect(
        requireLeagueAccess(db, {
          organizationId: organizationA,
          leagueId: leagueA1,
          userId: managerA,
          permission: "league:manage",
        })
      ).rejects.toEqual(new DomainError("league.forbidden"))
    } finally {
      await db
        .delete(ratingSnapshots)
        .where(inArray(ratingSnapshots.leagueId, leagueIds))
      await db.delete(players).where(inArray(players.leagueId, leagueIds))
      await db
        .delete(playerPools)
        .where(inArray(playerPools.leagueId, leagueIds))
      await db
        .delete(leagueSettings)
        .where(inArray(leagueSettings.leagueId, leagueIds))
      await db.delete(leagues).where(inArray(leagues.id, leagueIds))
      await db
        .delete(member)
        .where(inArray(member.organizationId, organizationIds))
      await db.delete(user).where(inArray(user.id, userIds))
      await db
        .delete(organization)
        .where(inArray(organization.id, organizationIds))
    }
  })
})
