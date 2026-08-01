import { createAccessControl } from "better-auth/plugins/access"
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access"

import type { OrganizationRole } from "./types"

const statements = {
  ...defaultStatements,
  league: ["create", "update"] as const,
  player: ["manage"] as const,
  round: ["manage"] as const,
} as const

export const organizationAccessControl = createAccessControl(statements)

export const ownerRole = organizationAccessControl.newRole({
  ...ownerAc.statements,
  league: ["create", "update"],
  player: ["manage"],
  round: ["manage"],
})

export const adminRole = organizationAccessControl.newRole({
  ...adminAc.statements,
  league: ["create", "update"],
  player: ["manage"],
  round: ["manage"],
})

export const managerRole = organizationAccessControl.newRole({
  ...memberAc.statements,
  player: ["manage"],
  round: ["manage"],
})

export const organizationRoles = {
  owner: ownerRole,
  admin: adminRole,
  manager: managerRole,
}

export const ORGANIZATION_ROLES = [
  "owner",
  "admin",
  "manager",
] as const satisfies ReadonlyArray<OrganizationRole>

export type OrganizationPermission =
  | "organization:update"
  | "member:invite"
  | "member:update-role"
  | "member:remove"
  | "league:manage"
  | "play:manage"
  | "public-view:manage"

const permissionsByRole: Readonly<
  Record<OrganizationRole, ReadonlySet<OrganizationPermission>>
> = {
  owner: new Set([
    "organization:update",
    "member:invite",
    "member:update-role",
    "member:remove",
    "league:manage",
    "play:manage",
    "public-view:manage",
  ]),
  admin: new Set([
    "organization:update",
    "member:invite",
    "member:update-role",
    "member:remove",
    "league:manage",
    "play:manage",
  ]),
  manager: new Set(["play:manage"]),
}

export function isOrganizationRole(value: string): value is OrganizationRole {
  return ORGANIZATION_ROLES.some((role) => role === value)
}

export function hasOrganizationPermission(
  role: OrganizationRole,
  permission: OrganizationPermission
): boolean {
  return permissionsByRole[role].has(permission)
}

export function assignableOrganizationRoles(
  actorRole: OrganizationRole
): ReadonlyArray<OrganizationRole> {
  return actorRole === "owner" ? ORGANIZATION_ROLES : ["admin", "manager"]
}

export function canChangeOrganizationRole(
  actorRole: OrganizationRole,
  targetRole: OrganizationRole,
  nextRole: OrganizationRole
): boolean {
  if (!hasOrganizationPermission(actorRole, "member:update-role")) return false
  if (
    actorRole !== "owner" &&
    (targetRole === "owner" || nextRole === "owner")
  ) {
    return false
  }
  return true
}

export function canRemoveOrganizationMember(
  actorRole: OrganizationRole,
  targetRole: OrganizationRole
): boolean {
  if (!hasOrganizationPermission(actorRole, "member:remove")) return false
  return actorRole === "owner" || targetRole !== "owner"
}
