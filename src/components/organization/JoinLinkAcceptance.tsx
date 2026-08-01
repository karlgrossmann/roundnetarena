import { IconLoader } from "@/components/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"

import { OrganizationMutationError } from "./OrganizationMutationError"
import { OrganizationRoleBadge } from "./OrganizationRoleBadge"
import { AuthPage } from "@/components/auth/AuthPage"
import { AuthStatus } from "@/components/auth/AuthStatus"
import { Button } from "@/components/ui/button"
import { acceptOrganizationJoinLink } from "@/lib/api/mutations"
import { organizationJoinLinkQueryOptions, queryKeys } from "@/lib/api/queries"
import { authClient } from "@/lib/auth-client"
import type { OrganizationJoinLinkPublicStatus } from "@/lib/types"
import {
  join_link_accept,
  join_link_accept_error,
  join_link_accept_pending,
  join_link_accept_success_description,
  join_link_accept_success_title,
  join_link_exhausted_description,
  join_link_expired_description,
  join_link_invalid_description,
  join_link_invalid_title,
  join_link_page_description,
  join_link_rate_limited_description,
  join_link_register,
  join_link_remaining,
  join_link_revoked_description,
  join_link_sign_in,
  join_link_sign_in_description,
  route_title_join_organization,
} from "@/paraglide/messages.js"

export function JoinLinkAcceptance({ token }: { token: string | undefined }) {
  const queryClient = useQueryClient()
  const session = authClient.useSession()
  const preview = useQuery({
    ...organizationJoinLinkQueryOptions(token ?? ""),
    enabled: Boolean(token),
  })
  const accept = useMutation({
    mutationFn: () => acceptOrganizationJoinLink(token ?? ""),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations }),
  })
  const redirect = token ? `/join?token=${encodeURIComponent(token)}` : "/join"

  if (!token) return <Unavailable status="invalid" />
  if (preview.isPending || session.isPending) return <Loading />
  if (preview.isError) return <Unavailable status="invalid" />
  if (preview.data.status !== "valid") {
    return <Unavailable status={preview.data.status} />
  }
  if (!session.data) {
    return (
      <JoinPage description={join_link_sign_in_description()}>
        <div className="grid gap-2">
          <Button render={<Link to="/login" search={{ redirect }} />}>
            {join_link_sign_in()}
          </Button>
          <Button
            variant="outline"
            render={<Link to="/register" search={{ redirect }} />}
          >
            {join_link_register()}
          </Button>
        </div>
      </JoinPage>
    )
  }
  if (accept.isSuccess) {
    return (
      <JoinPage>
        <div className="space-y-4">
          <AuthStatus
            kind="success"
            title={join_link_accept_success_title()}
            description={join_link_accept_success_description({
              organization: accept.data.organizationName,
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
            {accept.data.organizationName}
          </Button>
        </div>
      </JoinPage>
    )
  }

  return (
    <JoinPage>
      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-heading text-lg font-semibold">
              {preview.data.organizationName}
            </p>
            <OrganizationRoleBadge role="manager" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {join_link_remaining({
              count: preview.data.remainingUses ?? 0,
            })}
          </p>
        </div>
        {accept.isError ? (
          <OrganizationMutationError
            error={accept.error}
            fallback={join_link_accept_error()}
          />
        ) : null}
        <Button
          className="w-full"
          disabled={accept.isPending}
          onClick={() => accept.mutate()}
        >
          {accept.isPending ? join_link_accept_pending() : join_link_accept()}
        </Button>
      </div>
    </JoinPage>
  )
}

function Loading() {
  return (
    <JoinPage>
      <div className="flex justify-center p-6">
        <IconLoader className="size-5 animate-spin" />
      </div>
    </JoinPage>
  )
}

function Unavailable({ status }: { status: OrganizationJoinLinkPublicStatus }) {
  return (
    <JoinPage>
      <AuthStatus
        kind="error"
        title={join_link_invalid_title()}
        description={unavailableDescription(status)}
      />
    </JoinPage>
  )
}

function unavailableDescription(
  status: OrganizationJoinLinkPublicStatus
): string {
  switch (status) {
    case "expired":
      return join_link_expired_description()
    case "exhausted":
      return join_link_exhausted_description()
    case "revoked":
      return join_link_revoked_description()
    case "rate_limited":
      return join_link_rate_limited_description()
    case "invalid":
    case "valid":
      return join_link_invalid_description()
  }
}

function JoinPage({
  children,
  description = join_link_page_description(),
}: {
  children: React.ReactNode
  description?: string
}) {
  return (
    <AuthPage title={route_title_join_organization()} description={description}>
      {children}
    </AuthPage>
  )
}
