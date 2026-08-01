import { IconLoader } from "@/components/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"

import { OrganizationMutationError } from "./OrganizationMutationError"
import { OrganizationRoleBadge } from "./OrganizationRoleBadge"
import { AuthPage } from "@/components/auth/AuthPage"
import { AuthStatus } from "@/components/auth/AuthStatus"
import { Button } from "@/components/ui/button"
import { acceptOrganizationInvitation } from "@/lib/api/mutations"
import {
  organizationInvitationQueryOptions,
  queryKeys,
} from "@/lib/api/queries"
import { authClient } from "@/lib/auth-client"
import {
  invitation_accept,
  invitation_accept_description,
  invitation_accept_description_generic,
  invitation_accept_error,
  invitation_accept_pending,
  invitation_accept_success_description,
  invitation_accept_success_title,
  invitation_invalid_description,
  invitation_invalid_title,
  invitation_register,
  invitation_sign_in,
  invitation_sign_in_description,
  route_title_accept_invitation,
} from "@/paraglide/messages.js"

export function InvitationAcceptance({
  invitationId,
}: {
  invitationId: string | undefined
}) {
  const queryClient = useQueryClient()
  const session = authClient.useSession()
  const invitation = useQuery({
    ...organizationInvitationQueryOptions(invitationId ?? ""),
    enabled: Boolean(session.data && invitationId),
  })
  const accept = useMutation({
    mutationFn: () => acceptOrganizationInvitation(invitationId ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations })
    },
  })
  const redirect = invitationId
    ? `/accept-invitation?id=${encodeURIComponent(invitationId)}`
    : "/accept-invitation"

  if (!invitationId) {
    return (
      <InvitationPage>
        <AuthStatus
          kind="error"
          title={invitation_invalid_title()}
          description={invitation_invalid_description()}
        />
      </InvitationPage>
    )
  }

  if (session.isPending) {
    return (
      <InvitationPage>
        <div className="flex justify-center p-6">
          <IconLoader className="size-5 animate-spin" />
        </div>
      </InvitationPage>
    )
  }

  if (!session.data) {
    return (
      <InvitationPage description={invitation_sign_in_description()}>
        <div className="grid gap-2">
          <Button render={<Link to="/login" search={{ redirect }} />}>
            {invitation_sign_in()}
          </Button>
          <Button
            variant="outline"
            render={<Link to="/register" search={{ redirect }} />}
          >
            {invitation_register()}
          </Button>
        </div>
      </InvitationPage>
    )
  }

  if (invitation.isPending) {
    return (
      <InvitationPage>
        <div className="flex justify-center p-6">
          <IconLoader className="size-5 animate-spin" />
        </div>
      </InvitationPage>
    )
  }

  if (invitation.isError) {
    return (
      <InvitationPage>
        <AuthStatus
          kind="error"
          title={invitation_invalid_title()}
          description={invitation_invalid_description()}
        />
      </InvitationPage>
    )
  }

  if (accept.isSuccess) {
    return (
      <InvitationPage>
        <div className="space-y-4">
          <AuthStatus
            kind="success"
            title={invitation_accept_success_title()}
            description={invitation_accept_success_description({
              organization: invitation.data.organizationName,
            })}
          />
          <Button
            className="w-full"
            render={
              <Link
                to="/clubs/$organizationId"
                params={{ organizationId: accept.data.organizationId }}
              />
            }
          >
            {invitation.data.organizationName}
          </Button>
        </div>
      </InvitationPage>
    )
  }

  return (
    <InvitationPage>
      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-heading text-lg font-semibold">
              {invitation.data.organizationName}
            </p>
            <OrganizationRoleBadge role={invitation.data.role} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {invitation_accept_description({
              email: invitation.data.email,
            })}
          </p>
        </div>
        {accept.isError ? (
          <OrganizationMutationError
            error={accept.error}
            fallback={invitation_accept_error()}
          />
        ) : null}
        <Button
          className="w-full"
          disabled={accept.isPending}
          onClick={() => accept.mutate()}
        >
          {accept.isPending ? invitation_accept_pending() : invitation_accept()}
        </Button>
      </div>
    </InvitationPage>
  )
}

function InvitationPage({
  children,
  description = invitation_accept_description_generic(),
}: {
  children: React.ReactNode
  description?: string
}) {
  return (
    <AuthPage title={route_title_accept_invitation()} description={description}>
      {children}
    </AuthPage>
  )
}
