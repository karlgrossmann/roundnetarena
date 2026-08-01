import "@tanstack/react-start/server-only"

import { DomainError } from "@/lib/domain-errors"
import { hasOrganizationPermission } from "@/lib/organization-permissions"
import type { OrganizationRole } from "@/lib/types"

import { getDb } from "../db/client"
import {
  insertOrganizationAuditEvent,
  setOrganizationAuditActor,
} from "../repositories/organization-audit"
import {
  cancelPendingOrganizationInvitationsForEmail,
  countOrganizationMembers,
  countPendingOrganizationInvitations,
  findOrganizationMemberByEmail,
  findOrganizationName,
  insertOrganizationInvitationRecord,
  insertOrganizationMemberRecord,
  lockOrganizationInvitationRecord,
  lockOrganizationMembershipPair,
  lockOrganizationMembers,
  renewOrganizationInvitationRecord,
  setOrganizationInvitationStatus,
} from "../repositories/organization-management"

const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000
const ORGANIZATION_INVITATION_LIMIT = 50
const ORGANIZATION_MEMBER_LIMIT = 100

interface InvitationActorInput {
  actorUserId: string
  organizationId: string
}

export async function inviteOrganizationMemberAction(
  input: InvitationActorInput & {
    email: string
    role: OrganizationRole
  },
  now: Date
) {
  return getDb().transaction(async (tx) => {
    await setOrganizationAuditActor(tx, input.actorUserId)
    const actor = requireActor(
      await lockOrganizationMembers(tx, input.organizationId),
      input.actorUserId
    )
    if (
      !hasOrganizationPermission(actor.role, "member:invite") ||
      (actor.role !== "owner" && input.role === "owner")
    ) {
      throw new DomainError("organization.forbidden")
    }
    if (
      await findOrganizationMemberByEmail(tx, input.organizationId, input.email)
    ) {
      throw new DomainError("organization.member_exists")
    }

    await cancelPendingOrganizationInvitationsForEmail(
      tx,
      input.organizationId,
      input.email
    )
    if (
      (await countPendingOrganizationInvitations(
        tx,
        input.organizationId,
        now
      )) >= ORGANIZATION_INVITATION_LIMIT
    ) {
      throw new DomainError("organization.invitation_limit_reached")
    }

    const invitation = await insertOrganizationInvitationRecord(tx, {
      organizationId: input.organizationId,
      inviterId: input.actorUserId,
      email: input.email,
      role: input.role,
      expiresAt: new Date(now.getTime() + INVITATION_LIFETIME_MS),
      now,
    })
    await insertOrganizationAuditEvent(tx, {
      actorUserId: input.actorUserId,
      eventType: "organization.invitation_created",
      organizationId: input.organizationId,
      targetType: "invitation",
      targetId: invitation.id,
      metadata: { role: invitation.role },
      now,
    })
    return {
      invitation,
      organizationName: await requireOrganizationName(tx, input.organizationId),
    }
  })
}

export async function resendOrganizationInvitationAction(
  input: InvitationActorInput & { invitationId: string },
  now: Date
) {
  return getDb().transaction(async (tx) => {
    await setOrganizationAuditActor(tx, input.actorUserId)
    requireInvitationPermission(
      await lockOrganizationMembers(tx, input.organizationId),
      input.actorUserId
    )
    const invitation = await lockOrganizationInvitationRecord(
      tx,
      input.invitationId,
      input.organizationId
    )
    if (
      !invitation ||
      invitation.status !== "pending" ||
      invitation.expiresAt <= now
    ) {
      throw new DomainError("organization.invitation_invalid")
    }
    const expiresAt = new Date(now.getTime() + INVITATION_LIFETIME_MS)
    await renewOrganizationInvitationRecord(tx, invitation.id, expiresAt, now)
    await insertOrganizationAuditEvent(tx, {
      actorUserId: input.actorUserId,
      eventType: "organization.invitation_resent",
      organizationId: input.organizationId,
      targetType: "invitation",
      targetId: invitation.id,
      metadata: { role: invitation.role },
      now,
    })
    return {
      invitation: { ...invitation, expiresAt },
      organizationName: await requireOrganizationName(tx, input.organizationId),
    }
  })
}

export async function revokeOrganizationInvitationAction(
  input: InvitationActorInput & { invitationId: string },
  now: Date
): Promise<void> {
  await getDb().transaction(async (tx) => {
    await setOrganizationAuditActor(tx, input.actorUserId)
    requireInvitationPermission(
      await lockOrganizationMembers(tx, input.organizationId),
      input.actorUserId
    )
    const invitation = await lockOrganizationInvitationRecord(
      tx,
      input.invitationId,
      input.organizationId
    )
    if (!invitation || invitation.status !== "pending") {
      throw new DomainError("organization.invitation_invalid")
    }
    await setOrganizationInvitationStatus(tx, invitation.id, "canceled")
    await insertOrganizationAuditEvent(tx, {
      actorUserId: input.actorUserId,
      eventType: "organization.invitation_revoked",
      organizationId: input.organizationId,
      targetType: "invitation",
      targetId: invitation.id,
      metadata: { role: invitation.role },
      now,
    })
  })
}

export async function acceptOrganizationInvitationAction(
  input: {
    actorEmail: string
    actorUserId: string
    invitationId: string
  },
  now: Date
) {
  return getDb().transaction(async (tx) => {
    await setOrganizationAuditActor(tx, input.actorUserId)
    const invitation = await lockOrganizationInvitationRecord(
      tx,
      input.invitationId
    )
    if (
      !invitation ||
      invitation.status !== "pending" ||
      invitation.expiresAt <= now
    ) {
      throw new DomainError("organization.invitation_invalid")
    }
    if (invitation.email.toLowerCase() !== input.actorEmail.toLowerCase()) {
      throw new DomainError("organization.invitation_recipient_mismatch")
    }

    await lockOrganizationMembershipPair(
      tx,
      invitation.organizationId,
      input.actorUserId
    )
    const members = await lockOrganizationMembers(tx, invitation.organizationId)
    if (members.some((candidate) => candidate.userId === input.actorUserId)) {
      throw new DomainError("organization.member_exists")
    }
    if (
      (await countOrganizationMembers(tx, invitation.organizationId)) >=
      ORGANIZATION_MEMBER_LIMIT
    ) {
      throw new DomainError("organization.action_failed")
    }

    await insertOrganizationMemberRecord(tx, {
      organizationId: invitation.organizationId,
      userId: input.actorUserId,
      role: invitation.role,
      now,
    })
    await setOrganizationInvitationStatus(tx, invitation.id, "accepted")
    await insertOrganizationAuditEvent(tx, {
      actorUserId: input.actorUserId,
      eventType: "organization.invitation_accepted",
      organizationId: invitation.organizationId,
      targetType: "invitation",
      targetId: invitation.id,
      metadata: { role: invitation.role },
      now,
    })
    return {
      organizationId: invitation.organizationId,
      role: invitation.role,
    }
  })
}

function requireActor(
  members: Awaited<ReturnType<typeof lockOrganizationMembers>>,
  actorUserId: string
) {
  const actor = members.find((candidate) => candidate.userId === actorUserId)
  if (!actor) throw new DomainError("organization.forbidden")
  return actor
}

function requireInvitationPermission(
  members: Awaited<ReturnType<typeof lockOrganizationMembers>>,
  actorUserId: string
): void {
  const actor = requireActor(members, actorUserId)
  if (!hasOrganizationPermission(actor.role, "member:invite")) {
    throw new DomainError("organization.forbidden")
  }
}

async function requireOrganizationName(
  executor: Parameters<typeof findOrganizationName>[0],
  organizationId: string
): Promise<string> {
  const name = await findOrganizationName(executor, organizationId)
  if (!name) throw new DomainError("organization.not_found")
  return name
}
