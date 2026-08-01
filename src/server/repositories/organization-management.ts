import "@tanstack/react-start/server-only"

import { and, count, eq, gt, sql } from "drizzle-orm"

import { isOrganizationRole } from "@/lib/organization-permissions"
import type { OrganizationRole } from "@/lib/types"

import { invitation, member, organization, user } from "../db/auth-schema"
import type { Executor, Transaction } from "../db/client"

export interface LockedOrganizationMember {
  id: string
  role: OrganizationRole
  userId: string
}

export interface OrganizationInvitationRecord {
  id: string
  organizationId: string
  email: string
  role: OrganizationRole
  status: string
  expiresAt: Date
}

export async function lockOrganizationMembers(
  tx: Transaction,
  organizationId: string
): Promise<Array<LockedOrganizationMember>> {
  const rows = await tx
    .select({ id: member.id, role: member.role, userId: member.userId })
    .from(member)
    .where(eq(member.organizationId, organizationId))
    .for("update")

  return rows.map((row) => ({
    ...row,
    role: organizationRole(row.role),
  }))
}

export async function updateOrganizationMemberRoleRecord(
  tx: Transaction,
  memberId: string,
  role: OrganizationRole
): Promise<void> {
  await tx.update(member).set({ role }).where(eq(member.id, memberId))
}

export async function deleteOrganizationMemberRecord(
  tx: Transaction,
  memberId: string
): Promise<void> {
  await tx.delete(member).where(eq(member.id, memberId))
}

export async function findOrganizationInvitationRecord(
  executor: Executor,
  invitationId: string,
  organizationId?: string
): Promise<OrganizationInvitationRecord | null> {
  const conditions = [eq(invitation.id, invitationId)]
  if (organizationId) {
    conditions.push(eq(invitation.organizationId, organizationId))
  }
  const row = (
    await executor
      .select({
        id: invitation.id,
        organizationId: invitation.organizationId,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      })
      .from(invitation)
      .where(and(...conditions))
      .limit(1)
  ).at(0)

  if (!row || !row.role || !isOrganizationRole(row.role)) return null
  return { ...row, role: row.role }
}

export async function lockOrganizationInvitationRecord(
  tx: Transaction,
  invitationId: string,
  organizationId?: string
): Promise<OrganizationInvitationRecord | null> {
  const conditions = [eq(invitation.id, invitationId)]
  if (organizationId) {
    conditions.push(eq(invitation.organizationId, organizationId))
  }
  const row = (
    await tx
      .select({
        id: invitation.id,
        organizationId: invitation.organizationId,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      })
      .from(invitation)
      .where(and(...conditions))
      .for("update")
  ).at(0)

  if (!row || !row.role || !isOrganizationRole(row.role)) return null
  return { ...row, role: row.role }
}

export async function countPendingOrganizationInvitations(
  executor: Executor,
  organizationId: string,
  now: Date
): Promise<number> {
  return (
    (
      await executor
        .select({ value: count() })
        .from(invitation)
        .where(
          and(
            eq(invitation.organizationId, organizationId),
            eq(invitation.status, "pending"),
            gt(invitation.expiresAt, now)
          )
        )
    ).at(0)?.value ?? 0
  )
}

export async function cancelPendingOrganizationInvitationsForEmail(
  tx: Transaction,
  organizationId: string,
  email: string
): Promise<void> {
  await tx
    .update(invitation)
    .set({ status: "canceled" })
    .where(
      and(
        eq(invitation.organizationId, organizationId),
        sql`lower(${invitation.email}) = lower(${email})`,
        eq(invitation.status, "pending")
      )
    )
}

export async function findOrganizationMemberByEmail(
  executor: Executor,
  organizationId: string,
  email: string
): Promise<{ id: string } | null> {
  return (
    (
      await executor
        .select({ id: member.id })
        .from(member)
        .innerJoin(user, eq(user.id, member.userId))
        .where(
          and(
            eq(member.organizationId, organizationId),
            sql`lower(${user.email}) = lower(${email})`
          )
        )
        .limit(1)
    ).at(0) ?? null
  )
}

export async function insertOrganizationInvitationRecord(
  tx: Transaction,
  input: {
    email: string
    expiresAt: Date
    inviterId: string
    organizationId: string
    role: OrganizationRole
    now: Date
  }
): Promise<OrganizationInvitationRecord> {
  const row = (
    await tx
      .insert(invitation)
      .values({
        organizationId: input.organizationId,
        email: input.email.toLowerCase(),
        role: input.role,
        status: "pending",
        expiresAt: input.expiresAt,
        createdAt: input.now,
        inviterId: input.inviterId,
      })
      .returning({
        id: invitation.id,
        organizationId: invitation.organizationId,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      })
  ).at(0)
  if (!row || !row.role || !isOrganizationRole(row.role)) {
    throw new Error("Invitation could not be stored.")
  }
  return { ...row, role: row.role }
}

export async function renewOrganizationInvitationRecord(
  tx: Transaction,
  invitationId: string,
  expiresAt: Date,
  now: Date
): Promise<void> {
  await tx
    .update(invitation)
    .set({ expiresAt, createdAt: now })
    .where(eq(invitation.id, invitationId))
}

export async function setOrganizationInvitationStatus(
  tx: Transaction,
  invitationId: string,
  status: "accepted" | "canceled"
): Promise<void> {
  await tx
    .update(invitation)
    .set({ status })
    .where(eq(invitation.id, invitationId))
}

export async function lockOrganizationMembershipPair(
  tx: Transaction,
  organizationId: string,
  userId: string
): Promise<void> {
  await tx.execute(
    sql`select pg_advisory_xact_lock(
      hashtextextended(${`${organizationId}:${userId}`}, 0)
    )`
  )
}

export async function countOrganizationMembers(
  executor: Executor,
  organizationId: string
): Promise<number> {
  return (
    (
      await executor
        .select({ value: count() })
        .from(member)
        .where(eq(member.organizationId, organizationId))
    ).at(0)?.value ?? 0
  )
}

export async function insertOrganizationMemberRecord(
  tx: Transaction,
  input: {
    organizationId: string
    role: OrganizationRole
    userId: string
    now: Date
  }
): Promise<string> {
  const row = (
    await tx
      .insert(member)
      .values({
        organizationId: input.organizationId,
        userId: input.userId,
        role: input.role,
        createdAt: input.now,
      })
      .returning({ id: member.id })
  ).at(0)
  if (!row) throw new Error("Membership could not be stored.")
  return row.id
}

export async function findOrganizationName(
  executor: Executor,
  organizationId: string
): Promise<string | null> {
  return (
    (
      await executor
        .select({ name: organization.name })
        .from(organization)
        .where(eq(organization.id, organizationId))
        .limit(1)
    ).at(0)?.name ?? null
  )
}

function organizationRole(value: string): OrganizationRole {
  if (!isOrganizationRole(value)) {
    throw new Error("Unknown static organization role in the database.")
  }
  return value
}
