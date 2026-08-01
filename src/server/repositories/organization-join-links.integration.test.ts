// @vitest-environment node

import { and, eq, inArray } from "drizzle-orm"
import { afterAll, describe, expect, it } from "vitest"

import { member, organization, rateLimit, user } from "../db/auth-schema"
import { closeDb, getDb } from "../db/client"
import { organizationAuditLogs, organizationJoinLinks } from "../db/schema"
import {
  acceptOrganizationJoinLink,
  consumeJoinLinkRateLimit,
  createOrganizationJoinToken,
  hashOrganizationJoinToken,
  insertOrganizationJoinLink,
  inspectOrganizationJoinLink,
  JoinLinkUnavailableError,
  revokeOrganizationJoinLink,
} from "./organization-join-links"

const databaseDescribe = process.env.DATABASE_URL ? describe : describe.skip

afterAll(async () => {
  await closeDb()
})

databaseDescribe("generische Vereinsbeitrittslinks", () => {
  it("stores only hashes and enforces limit, revocation and audit atomically", async () => {
    const db = getDb()
    const organizationId = crypto.randomUUID()
    const ownerId = crypto.randomUUID()
    const guestIds = [crypto.randomUUID(), crypto.randomUUID()]
    const userIds = [ownerId, ...guestIds]
    const now = new Date("2026-07-28T12:00:00.000Z")

    await db.insert(user).values(
      userIds.map((id, index) => ({
        id,
        name: `Join link user ${index}`,
        email: `join-link-${id}@example.com`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      }))
    )
    await db.insert(organization).values({
      id: organizationId,
      name: "Join link test",
      slug: `join-link-${organizationId}`,
      createdAt: now,
    })

    try {
      const token = createOrganizationJoinToken()
      const tokenHash = hashOrganizationJoinToken(token)
      const created = await db.transaction((tx) =>
        insertOrganizationJoinLink(
          tx,
          {
            actorUserId: ownerId,
            organizationId,
            tokenHash,
            expiresAt: new Date(now.getTime() + 60_000),
            maxUses: 1,
          },
          now
        )
      )
      const stored = (
        await db
          .select({
            tokenHash: organizationJoinLinks.tokenHash,
            role: organizationJoinLinks.role,
          })
          .from(organizationJoinLinks)
          .where(eq(organizationJoinLinks.id, created.id))
      ).at(0)
      expect(stored).toEqual({ tokenHash, role: "manager" })
      expect(stored?.tokenHash).not.toContain(token)

      const acceptances = await Promise.allSettled(
        guestIds.map((userId) =>
          db.transaction((tx) =>
            acceptOrganizationJoinLink(tx, { tokenHash, userId }, now)
          )
        )
      )
      expect(
        acceptances.filter((result) => result.status === "fulfilled")
      ).toHaveLength(1)
      const rejected = acceptances.find(
        (result) => result.status === "rejected"
      )
      expect(rejected?.reason).toBeInstanceOf(JoinLinkUnavailableError)
      expect(rejected?.reason).toMatchObject({ reason: "exhausted" })

      const [linkAfterAcceptance, memberships, audits] = await Promise.all([
        db
          .select({ usedCount: organizationJoinLinks.usedCount })
          .from(organizationJoinLinks)
          .where(eq(organizationJoinLinks.id, created.id)),
        db
          .select({ userId: member.userId })
          .from(member)
          .where(
            and(
              eq(member.organizationId, organizationId),
              inArray(member.userId, guestIds)
            )
          ),
        db
          .select({ eventType: organizationAuditLogs.eventType })
          .from(organizationAuditLogs)
          .where(eq(organizationAuditLogs.organizationId, organizationId)),
      ])
      expect(linkAfterAcceptance[0]?.usedCount).toBe(1)
      expect(memberships).toHaveLength(1)
      expect(audits.map((audit) => audit.eventType).toSorted()).toEqual([
        "organization.join_link_accepted",
        "organization.join_link_created",
      ])

      const revokeTokenHash = hashOrganizationJoinToken(
        createOrganizationJoinToken()
      )
      const revocable = await db.transaction((tx) =>
        insertOrganizationJoinLink(
          tx,
          {
            actorUserId: ownerId,
            organizationId,
            tokenHash: revokeTokenHash,
            expiresAt: new Date(now.getTime() + 60_000),
            maxUses: 2,
          },
          now
        )
      )
      await db.transaction((tx) =>
        revokeOrganizationJoinLink(
          tx,
          {
            actorUserId: ownerId,
            organizationId,
            joinLinkId: revocable.id,
          },
          now
        )
      )
      expect(
        await inspectOrganizationJoinLink(db, revokeTokenHash, now)
      ).toMatchObject({ status: "revoked" })
      await expect(
        db.transaction((tx) =>
          acceptOrganizationJoinLink(
            tx,
            { tokenHash: revokeTokenHash, userId: guestIds[0] },
            now
          )
        )
      ).rejects.toMatchObject({ reason: "revoked" })

      const expiredTokenHash = hashOrganizationJoinToken(
        createOrganizationJoinToken()
      )
      await db.transaction((tx) =>
        insertOrganizationJoinLink(
          tx,
          {
            actorUserId: ownerId,
            organizationId,
            tokenHash: expiredTokenHash,
            expiresAt: new Date(now.getTime() - 1),
            maxUses: 2,
          },
          now
        )
      )
      expect(
        await inspectOrganizationJoinLink(db, expiredTokenHash, now)
      ).toMatchObject({ status: "expired" })
      await expect(
        db.transaction((tx) =>
          acceptOrganizationJoinLink(
            tx,
            { tokenHash: expiredTokenHash, userId: guestIds[0] },
            now
          )
        )
      ).rejects.toMatchObject({ reason: "expired" })

      const rateKey = `organization-join-link:test:${organizationId}`
      expect(await consumeJoinLinkRateLimit(rateKey, now, 60_000, 1)).toBe(true)
      expect(await consumeJoinLinkRateLimit(rateKey, now, 60_000, 1)).toBe(
        false
      )
    } finally {
      await db
        .delete(rateLimit)
        .where(
          eq(rateLimit.key, `organization-join-link:test:${organizationId}`)
        )
      await db
        .delete(organizationAuditLogs)
        .where(eq(organizationAuditLogs.organizationId, organizationId))
      await db
        .delete(organizationJoinLinks)
        .where(eq(organizationJoinLinks.organizationId, organizationId))
      await db.delete(member).where(eq(member.organizationId, organizationId))
      await db.delete(organization).where(eq(organization.id, organizationId))
      await db.delete(user).where(inArray(user.id, userIds))
    }
  })
})
