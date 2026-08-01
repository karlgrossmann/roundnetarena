import { useMutation, useQueryClient } from "@tanstack/react-query"

import { OrganizationInvitationForm } from "./OrganizationInvitationForm"
import { OrganizationInvitationList } from "./OrganizationInvitationList"
import { OrganizationMutationError } from "./OrganizationMutationError"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  inviteOrganizationMember,
  resendOrganizationInvitation,
  revokeOrganizationInvitation,
} from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import { hasOrganizationPermission } from "@/lib/organization-permissions"
import type { OrganizationInvitation, OrganizationRole } from "@/lib/types"
import {
  organization_invitation_action_error,
  organization_invitation_empty,
  organization_invitations,
  organization_invitations_description,
} from "@/paraglide/messages.js"

interface OrganizationInvitationsProps {
  organizationId: string
  actorRole: OrganizationRole
  invitations: Array<OrganizationInvitation>
}

export function OrganizationInvitations({
  organizationId,
  actorRole,
  invitations,
}: OrganizationInvitationsProps) {
  const queryClient = useQueryClient()
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization(organizationId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizationAuditRoot(organizationId),
      }),
    ])
  const invite = useMutation({
    mutationFn: inviteOrganizationMember,
    onSuccess: refresh,
  })
  const resend = useMutation({
    mutationFn: (invitationId: string) =>
      resendOrganizationInvitation(organizationId, invitationId),
    onSuccess: refresh,
  })
  const revoke = useMutation({
    mutationFn: (invitationId: string) =>
      revokeOrganizationInvitation(organizationId, invitationId),
    onSuccess: refresh,
  })
  const manageable = hasOrganizationPermission(actorRole, "member:invite")
  const pending = invite.isPending || resend.isPending || revoke.isPending
  const error = invite.error ?? resend.error ?? revoke.error

  return (
    <Card>
      <CardHeader>
        <CardTitle>{organization_invitations()}</CardTitle>
        <CardDescription>
          {organization_invitations_description()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        {manageable ? (
          <div className="px-4">
            <OrganizationInvitationForm
              actorRole={actorRole}
              pending={pending}
              onInvite={(email, role) =>
                invite.mutate({ organizationId, email, role })
              }
            />
          </div>
        ) : null}
        {error ? (
          <div className="px-4">
            <OrganizationMutationError
              error={error}
              fallback={organization_invitation_action_error()}
            />
          </div>
        ) : null}
        {invitations.length > 0 ? (
          <OrganizationInvitationList
            invitations={invitations}
            manageable={manageable}
            pending={pending}
            onResend={(invitationId) => resend.mutate(invitationId)}
            onRevoke={(invitationId) => revoke.mutate(invitationId)}
          />
        ) : (
          <p className="px-4 text-sm text-muted-foreground">
            {organization_invitation_empty()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
