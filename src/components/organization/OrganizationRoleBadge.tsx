import { Badge } from "@/components/ui/badge"
import { ORGANIZATION_ROLES } from "@/lib/organization-permissions"
import type { OrganizationRole } from "@/lib/types"
import {
  organization_role_admin,
  organization_role_manager,
  organization_role_owner,
} from "@/paraglide/messages.js"

export function organizationRoleLabel(role: OrganizationRole): string {
  if (role === "owner") return organization_role_owner()
  if (role === "admin") return organization_role_admin()
  return organization_role_manager()
}

/**
 * Role map for a `Select`'s `items` prop. Without it the closed trigger shows the raw
 * value ("manager") instead of the label.
 *
 * Deliberately covers all roles, not just the assignable ones: the current value needs a
 * label even when it cannot be selected.
 */
export function organizationRoleItems(): Record<OrganizationRole, string> {
  return Object.fromEntries(
    ORGANIZATION_ROLES.map((role) => [role, organizationRoleLabel(role)])
  ) as Record<OrganizationRole, string>
}

export function OrganizationRoleBadge({ role }: { role: OrganizationRole }) {
  return (
    <Badge variant={role === "owner" ? "default" : "secondary"}>
      {organizationRoleLabel(role)}
    </Badge>
  )
}
