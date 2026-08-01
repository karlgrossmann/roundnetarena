// @vitest-environment node

import { eq, inArray, sql } from "drizzle-orm"
import { afterAll, describe, expect, it } from "vitest"

import { DomainError } from "@/lib/domain-errors"
import { ORGANIZATION_AUDIT_PAGE_SIZE } from "@/lib/organization-audit"

import { organization, invitation, member, user } from "../db/auth-schema"
import { closeDb, getDb } from "../db/client"
import { organizationAuditLogs } from "../db/schema"
import {
  findOrganizationAuditPage,
  hasOrganizationAuditOwnerAccess,
  insertOrganizationAuditEvent,
  setOrganizationAuditActor,
} from "../repositories/organization-audit"
import {
  acceptOrganizationInvitationAction,
  inviteOrganizationMemberAction,
} from "./organization-invitation-actions.server"
import {
  removeOrganizationMemberAction,
  updateOrganizationMemberRoleAction,
} from "./organization-member-actions.server"

const databaseDescribe = process.env.DATABASE_URL ? describe : describe.skip

afterAll(async () => {
  await closeDb()
})

databaseDescribe("organization security audit", () => {
  it("writes successful critical changes exactly once and rolls failures back", async () => {
    const db = getDb()
    const organizationId = crypto.randomUUID()
    const otherOrganizationId = crypto.randomUUID()
    const ownerId = crypto.randomUUID()
    const targetId = crypto.randomUUID()
    const removedUserId = crypto.randomUUID()
    const invitedUserId = crypto.randomUUID()
    const userIds = [ownerId, targetId, removedUserId, invitedUserId]
    const now = new Date("2026-07-28T14:00:00.000Z")
    const invitedEmail = `audit-invited-${invitedUserId}@example.com`

    await db.insert(user).values(
      userIds.map((id, index) => ({
        id,
        name: `Audit user ${index}`,
        email: id === invitedUserId ? invitedEmail : `audit-${id}@example.com`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      }))
    )
    await db.insert(organization).values([
      {
        id: organizationId,
        name: "Audited club",
        slug: `audit-${organizationId}`,
        createdAt: now,
      },
      {
        id: otherOrganizationId,
        name: "Other club",
        slug: `audit-other-${otherOrganizationId}`,
        createdAt: now,
      },
    ])
    const membershipRows = await db
      .insert(member)
      .values([
        {
          organizationId,
          userId: ownerId,
          role: "owner",
          createdAt: now,
        },
        {
          organizationId,
          userId: targetId,
          role: "manager",
          createdAt: now,
        },
        {
          organizationId,
          userId: removedUserId,
          role: "manager",
          createdAt: now,
        },
        {
          organizationId: otherOrganizationId,
          userId: targetId,
          role: "owner",
          createdAt: now,
        },
      ])
      .returning({ id: member.id, userId: member.userId })
    const targetMemberId = requiredMemberId(membershipRows, targetId)
    const removedMemberId = requiredMemberId(membershipRows, removedUserId)

    try {
      await updateOrganizationMemberRoleAction(
        {
          actorUserId: ownerId,
          organizationId,
          memberId: targetMemberId,
          role: "admin",
        },
        now
      )
      await expect(
        updateOrganizationMemberRoleAction(
          {
            actorUserId: targetId,
            organizationId,
            memberId: crypto.randomUUID(),
            role: "manager",
          },
          now
        )
      ).rejects.toBeInstanceOf(DomainError)
      await removeOrganizationMemberAction(
        {
          actorUserId: ownerId,
          organizationId,
          memberId: removedMemberId,
        },
        now
      )
      const createdInvitation = await inviteOrganizationMemberAction(
        {
          actorUserId: ownerId,
          organizationId,
          email: invitedEmail,
          role: "manager",
        },
        now
      )
      await acceptOrganizationInvitationAction(
        {
          actorUserId: invitedUserId,
          actorEmail: invitedEmail,
          invitationId: createdInvitation.invitation.id,
        },
        new Date(now.getTime() + 1_000)
      )

      const audits = await db
        .select({
          eventType: organizationAuditLogs.eventType,
          metadata: organizationAuditLogs.metadata,
        })
        .from(organizationAuditLogs)
        .where(eq(organizationAuditLogs.organizationId, organizationId))
      expect(audits.map((entry) => entry.eventType).toSorted()).toEqual([
        "organization.invitation_accepted",
        "organization.invitation_created",
        "organization.member_removed",
        "organization.member_role_changed",
      ])
      expect(JSON.stringify(audits)).not.toContain(invitedEmail)
      expect(JSON.stringify(audits)).not.toMatch(/token|password|secret/i)
      await expect(
        hasOrganizationAuditOwnerAccess(db, organizationId, ownerId)
      ).resolves.toBe(true)
      await expect(
        hasOrganizationAuditOwnerAccess(db, organizationId, targetId)
      ).resolves.toBe(false)
      await expect(
        hasOrganizationAuditOwnerAccess(db, otherOrganizationId, ownerId)
      ).resolves.toBe(false)
    } finally {
      await db
        .delete(organizationAuditLogs)
        .where(
          inArray(organizationAuditLogs.organizationId, [
            organizationId,
            otherOrganizationId,
          ])
        )
      await db
        .delete(invitation)
        .where(eq(invitation.organizationId, organizationId))
      await db
        .delete(member)
        .where(
          inArray(member.organizationId, [organizationId, otherOrganizationId])
        )
      await db
        .delete(organization)
        .where(inArray(organization.id, [organizationId, otherOrganizationId]))
      await db.delete(user).where(inArray(user.id, userIds))
    }
  })

  it("paginates newest first and installs owner-only append policies", async () => {
    const db = getDb()
    const organizationId = crypto.randomUUID()
    const ownerId = crypto.randomUUID()
    const now = new Date("2026-07-28T15:00:00.000Z")
    await db.insert(user).values({
      id: ownerId,
      name: "Audit owner",
      email: `audit-owner-${ownerId}@example.com`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    await db.insert(organization).values({
      id: organizationId,
      name: "Paged audit club",
      slug: `paged-audit-${organizationId}`,
      createdAt: now,
    })
    await db.insert(member).values({
      organizationId,
      userId: ownerId,
      role: "owner",
      createdAt: now,
    })

    try {
      await db.transaction(async (tx) => {
        await setOrganizationAuditActor(tx, ownerId)
        for (let index = 0; index < ORGANIZATION_AUDIT_PAGE_SIZE + 1; index++) {
          await insertOrganizationAuditEvent(tx, {
            actorUserId: ownerId,
            eventType: "organization.join_link_revoked",
            organizationId,
            targetType: "join_link",
            targetId: crypto.randomUUID(),
            metadata: {},
            now: new Date(now.getTime() + index),
          })
        }
      })
      const [firstPage, secondPage] = await db.transaction(async (tx) => {
        await setOrganizationAuditActor(tx, ownerId)
        const first = await findOrganizationAuditPage(tx, organizationId, 1)
        const second = await findOrganizationAuditPage(tx, organizationId, 2)
        return [first, second] as const
      })
      expect(firstPage.items).toHaveLength(ORGANIZATION_AUDIT_PAGE_SIZE)
      expect(secondPage.items).toHaveLength(1)
      expect(firstPage.totalPages).toBe(2)
      expect(Date.parse(firstPage.items[0].createdAt)).toBeGreaterThan(
        Date.parse(firstPage.items.at(-1)!.createdAt)
      )

      const policyRows = await db.execute<{
        policyname: string
        cmd: string
      }>(sql`
        select policyname, cmd
        from pg_policies
        where schemaname = current_schema()
          and tablename = 'organization_audit_log'
        order by policyname
      `)
      expect(policyRows.rows).toEqual([
        {
          policyname: "organization_audit_log_member_insert",
          cmd: "INSERT",
        },
        {
          policyname: "organization_audit_log_owner_select",
          cmd: "SELECT",
        },
      ])
      const tableSecurity = await db.execute<{
        relrowsecurity: boolean
        relforcerowsecurity: boolean
      }>(sql`
        select relrowsecurity, relforcerowsecurity
        from pg_class
        where oid = 'organization_audit_log'::regclass
      `)
      expect(tableSecurity.rows).toEqual([
        { relrowsecurity: true, relforcerowsecurity: true },
      ])
    } finally {
      await db
        .delete(organizationAuditLogs)
        .where(eq(organizationAuditLogs.organizationId, organizationId))
      await db.delete(member).where(eq(member.organizationId, organizationId))
      await db.delete(organization).where(eq(organization.id, organizationId))
      await db.delete(user).where(eq(user.id, ownerId))
    }
  })
})

function requiredMemberId(
  rows: Array<{ id: string; userId: string }>,
  userId: string
): string {
  const id = rows.find((row) => row.userId === userId)?.id
  if (!id) throw new Error("Test membership is missing.")
  return id
}
