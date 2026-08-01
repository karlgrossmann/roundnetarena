import "@tanstack/react-start/server-only"

import { DomainError } from "@/lib/domain-errors"
import {
  canChangeOrganizationRole,
  canRemoveOrganizationMember,
} from "@/lib/organization-permissions"
import type { OrganizationRole } from "@/lib/types"

import { getDb } from "../db/client"
import {
  insertOrganizationAuditEvent,
  setOrganizationAuditActor,
} from "../repositories/organization-audit"
import {
  deleteOrganizationMemberRecord,
  lockOrganizationMembers,
  updateOrganizationMemberRoleRecord,
} from "../repositories/organization-management"

interface MemberActionInput {
  actorUserId: string
  organizationId: string
}

export async function updateOrganizationMemberRoleAction(
  input: MemberActionInput & {
    memberId: string
    role: OrganizationRole
  },
  now: Date
): Promise<void> {
  await getDb().transaction(async (tx) => {
    await setOrganizationAuditActor(tx, input.actorUserId)
    const members = await lockOrganizationMembers(tx, input.organizationId)
    const actor = requireActor(members, input.actorUserId)
    const target = members.find((candidate) => candidate.id === input.memberId)
    if (
      !target ||
      !canChangeOrganizationRole(actor.role, target.role, input.role)
    ) {
      throw new DomainError("organization.forbidden")
    }
    if (target.role === input.role) return
    if (
      target.role === "owner" &&
      input.role !== "owner" &&
      members.filter((candidate) => candidate.role === "owner").length <= 1
    ) {
      throw new DomainError("organization.last_owner")
    }

    await updateOrganizationMemberRoleRecord(tx, target.id, input.role)
    const eventType =
      target.role === "owner" || input.role === "owner"
        ? "organization.ownership_changed"
        : "organization.member_role_changed"
    await insertOrganizationAuditEvent(tx, {
      actorUserId: input.actorUserId,
      eventType,
      organizationId: input.organizationId,
      targetType: "member",
      targetId: target.id,
      metadata: { previousRole: target.role, newRole: input.role },
      now,
    })
  })
}

export async function removeOrganizationMemberAction(
  input: MemberActionInput & { memberId: string },
  now: Date
): Promise<void> {
  await getDb().transaction(async (tx) => {
    await setOrganizationAuditActor(tx, input.actorUserId)
    const members = await lockOrganizationMembers(tx, input.organizationId)
    const actor = requireActor(members, input.actorUserId)
    const target = members.find((candidate) => candidate.id === input.memberId)
    if (!target || !canRemoveOrganizationMember(actor.role, target.role)) {
      throw new DomainError("organization.forbidden")
    }
    if (
      target.role === "owner" &&
      members.filter((candidate) => candidate.role === "owner").length <= 1
    ) {
      throw new DomainError("organization.last_owner")
    }

    await insertOrganizationAuditEvent(tx, {
      actorUserId: input.actorUserId,
      eventType: "organization.member_removed",
      organizationId: input.organizationId,
      targetType: "member",
      targetId: target.id,
      metadata: { role: target.role },
      now,
    })
    await deleteOrganizationMemberRecord(tx, target.id)
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
