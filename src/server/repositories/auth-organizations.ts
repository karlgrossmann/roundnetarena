import "@tanstack/react-start/server-only"

import { and, count, eq, lt } from "drizzle-orm"

import { getAuthDb } from "../db/auth-client"
import { invitation, member } from "../db/auth-schema"

const INVITATION_HISTORY_DAYS = 180

export async function countOwnedOrganizationsForUser(
  userId: string
): Promise<number> {
  const row = (
    await getAuthDb()
      .select({ value: count() })
      .from(member)
      .where(and(eq(member.userId, userId), eq(member.role, "owner")))
  ).at(0)
  return row?.value ?? 0
}

export async function pruneOrganizationInvitationHistory(
  organizationId: string,
  now: Date
): Promise<void> {
  const cutoff = new Date(
    now.getTime() - INVITATION_HISTORY_DAYS * 24 * 60 * 60 * 1000
  )
  await getAuthDb()
    .delete(invitation)
    .where(
      and(
        eq(invitation.organizationId, organizationId),
        lt(invitation.createdAt, cutoff)
      )
    )
}
