import type {
  OrganizationAuditEventType,
  OrganizationAuditTargetType,
} from "./types"

export const ORGANIZATION_AUDIT_PAGE_SIZE = 20

export const ORGANIZATION_AUDIT_EVENT_TYPES = [
  "organization.member_role_changed",
  "organization.ownership_changed",
  "organization.member_removed",
  "organization.invitation_created",
  "organization.invitation_resent",
  "organization.invitation_revoked",
  "organization.invitation_accepted",
  "organization.join_link_created",
  "organization.join_link_revoked",
  "organization.join_link_accepted",
  "organization.public_view_enabled",
  "organization.public_view_disabled",
  "organization.public_view_password_changed",
  "organization.archived",
] as const satisfies ReadonlyArray<OrganizationAuditEventType>

export function isOrganizationAuditEventType(
  value: string
): value is OrganizationAuditEventType {
  return ORGANIZATION_AUDIT_EVENT_TYPES.some((eventType) => eventType === value)
}

export function isOrganizationAuditTargetType(
  value: string
): value is OrganizationAuditTargetType {
  return (
    value === "organization" ||
    value === "member" ||
    value === "invitation" ||
    value === "join_link"
  )
}
