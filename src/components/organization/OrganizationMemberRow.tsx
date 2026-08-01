import { useState } from "react"
import { IconTrash } from "@/components/icons"

import {
  OrganizationRoleBadge,
  organizationRoleItems,
  organizationRoleLabel,
} from "./OrganizationRoleBadge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  assignableOrganizationRoles,
  canChangeOrganizationRole,
  canRemoveOrganizationMember,
} from "@/lib/organization-permissions"
import type { OrganizationMember, OrganizationRole } from "@/lib/types"
import {
  common_cancel,
  organization_member_remove,
  organization_member_remove_confirm,
  organization_member_remove_description,
  organization_member_you,
  organization_role_label,
} from "@/paraglide/messages.js"

interface OrganizationMemberRowProps {
  actorRole: OrganizationRole
  member: OrganizationMember
  pending: boolean
  onRoleChange: (memberId: string, role: OrganizationRole) => void
  onRemove: (memberId: string) => void
}

export function OrganizationMemberRow({
  actorRole,
  member,
  pending,
  onRoleChange,
  onRemove,
}: OrganizationMemberRowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const canChange = canChangeOrganizationRole(
    actorRole,
    member.role,
    member.role
  )
  const canRemove = canRemoveOrganizationMember(actorRole, member.role)

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{member.name}</span>
          {member.isCurrentUser ? (
            <Badge variant="outline">{organization_member_you()}</Badge>
          ) : null}
        </div>
        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
      </div>

      <div className="flex items-center gap-2">
        {canChange ? (
          <Select
            items={organizationRoleItems()}
            value={member.role}
            disabled={pending}
            onValueChange={(value) =>
              onRoleChange(member.id, value as OrganizationRole)
            }
          >
            <SelectTrigger
              aria-label={organization_role_label({ name: member.name })}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignableOrganizationRoles(actorRole).map((role) => (
                <SelectItem
                  key={role}
                  value={role}
                  disabled={
                    !canChangeOrganizationRole(actorRole, member.role, role)
                  }
                >
                  {organizationRoleLabel(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <OrganizationRoleBadge role={member.role} />
        )}

        {canRemove ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={organization_member_remove({ name: member.name })}
            disabled={pending}
            onClick={() => setConfirmOpen(true)}
          >
            <IconTrash />
          </Button>
        ) : null}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <IconTrash />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {organization_member_remove({ name: member.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {organization_member_remove_description({ name: member.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {common_cancel()}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => {
                onRemove(member.id)
                setConfirmOpen(false)
              }}
            >
              {organization_member_remove_confirm()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}
