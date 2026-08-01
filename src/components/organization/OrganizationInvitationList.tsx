import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { organizationRoleLabel } from "./OrganizationRoleBadge"
import type {
  OrganizationInvitation,
  OrganizationInvitationStatus,
} from "@/lib/types"
import {
  organization_invitation_resend,
  organization_invitation_revoke,
  organization_invitation_status_accepted,
  organization_invitation_status_canceled,
  organization_invitation_status_expired,
  organization_invitation_status_pending,
  organization_invitation_status_rejected,
} from "@/paraglide/messages.js"

interface OrganizationInvitationListProps {
  invitations: Array<OrganizationInvitation>
  manageable: boolean
  pending: boolean
  onResend: (invitationId: string) => void
  onRevoke: (invitationId: string) => void
}

export function OrganizationInvitationList({
  invitations,
  manageable,
  pending,
  onResend,
  onRevoke,
}: OrganizationInvitationListProps) {
  return (
    <ul className="divide-y">
      {invitations.map((invitation) => (
        <li
          key={invitation.id}
          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{invitation.email}</p>
            <p className="text-sm text-muted-foreground">
              {organizationRoleLabel(invitation.role)}
            </p>
          </div>
          <Badge
            variant={invitation.status === "pending" ? "secondary" : "outline"}
          >
            {invitationStatusLabel(invitation.status)}
          </Badge>
          {manageable && invitation.status === "pending" ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => onResend(invitation.id)}
              >
                {organization_invitation_resend()}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => onRevoke(invitation.id)}
              >
                {organization_invitation_revoke()}
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function invitationStatusLabel(status: OrganizationInvitationStatus): string {
  if (status === "pending") return organization_invitation_status_pending()
  if (status === "accepted") return organization_invitation_status_accepted()
  if (status === "rejected") return organization_invitation_status_rejected()
  if (status === "canceled") return organization_invitation_status_canceled()
  return organization_invitation_status_expired()
}
