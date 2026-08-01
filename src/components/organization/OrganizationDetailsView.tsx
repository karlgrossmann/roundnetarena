import { IconAlertTriangle } from "@/components/icons"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"

import { OrganizationInvitations } from "./OrganizationInvitations"
import { OrganizationAuditLog } from "./OrganizationAuditLog"
import { useOrganizationBrand } from "./OrganizationBrandProvider"
import { OrganizationJoinLinks } from "./OrganizationJoinLinks"
import { OrganizationLogo } from "./OrganizationLogo"
import { OrganizationMembers } from "./OrganizationMembers"
import { OrganizationMutationError } from "./OrganizationMutationError"
import { OrganizationProfileForm } from "./OrganizationProfileForm"
import { OrganizationPublicViewCard } from "./OrganizationPublicViewCard"
import { OrganizationRoleBadge } from "./OrganizationRoleBadge"
import { SettingsSection } from "@/components/settings/SettingsSection"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  retryOrganizationProvisioning,
  setActiveOrganization,
} from "@/lib/api/mutations"
import { organizationQueryOptions, queryKeys } from "@/lib/api/queries"
import { hasOrganizationPermission } from "@/lib/organization-permissions"
import {
  organization_active,
  organization_appearance,
  organization_delete_disabled,
  organization_members_and_access,
  organization_provisioning_error,
  organization_provisioning_pending,
  organization_provisioning_pending_description,
  organization_provisioning_retry,
  organization_select,
  organization_select_error,
} from "@/paraglide/messages.js"

export function OrganizationDetailsView({
  organizationId,
}: {
  organizationId: string
}) {
  const queryClient = useQueryClient()
  const { setBrandColor } = useOrganizationBrand()
  const { data: details } = useSuspenseQuery(
    organizationQueryOptions(organizationId)
  )
  const selectOrganization = useMutation({
    mutationFn: setActiveOrganization,
    onSuccess: (organizations) => {
      queryClient.setQueryData(queryKeys.organizations, organizations)
      const selected = organizations.find(
        (candidate) => candidate.id === organizationId
      )
      if (selected) setBrandColor(selected.brandColor)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organization(organizationId),
      })
    },
  })
  const retry = useMutation({
    mutationFn: retryOrganizationProvisioning,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization(organizationId),
      }),
  })
  const { organization } = details
  const canEdit = hasOrganizationPermission(
    organization.role,
    "organization:update"
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <OrganizationLogo
          name={organization.name}
          logo={organization.logo}
          className="size-14"
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-heading text-xl font-semibold">
            {organization.name}
          </h2>
          <p className="text-sm text-muted-foreground">/{organization.slug}</p>
        </div>
        <OrganizationRoleBadge role={organization.role} />
        <Button
          variant={organization.isActive ? "outline" : "default"}
          disabled={organization.isActive || selectOrganization.isPending}
          onClick={() => selectOrganization.mutate(organization.id)}
        >
          {organization.isActive
            ? organization_active()
            : organization_select()}
        </Button>
      </div>

      {!organization.provisioned ? (
        <Alert>
          <IconAlertTriangle />
          <AlertTitle>{organization_provisioning_pending()}</AlertTitle>
          <AlertDescription>
            <p>{organization_provisioning_pending_description()}</p>
            {canEdit ? (
              <Button
                variant="outline"
                size="sm"
                disabled={retry.isPending}
                onClick={() => retry.mutate(organization.id)}
              >
                {organization_provisioning_retry()}
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {retry.isError ? (
        <OrganizationMutationError
          error={retry.error}
          fallback={organization_provisioning_error()}
        />
      ) : null}
      {selectOrganization.isError ? (
        <OrganizationMutationError
          error={selectOrganization.error}
          fallback={organization_select_error()}
        />
      ) : null}

      <SettingsSection label={organization_appearance()}>
        <OrganizationProfileForm
          organization={organization}
          editable={canEdit}
        />
      </SettingsSection>

      {details.publicView ? (
        <OrganizationPublicViewCard
          organizationId={organization.id}
          settings={details.publicView}
        />
      ) : null}

      <SettingsSection label={organization_members_and_access()}>
        <div className="grid gap-3">
          <OrganizationMembers
            organizationId={organization.id}
            actorRole={organization.role}
            members={details.members}
          />
          <OrganizationInvitations
            organizationId={organization.id}
            actorRole={organization.role}
            invitations={details.invitations}
          />
          {hasOrganizationPermission(organization.role, "member:invite") ? (
            <OrganizationJoinLinks
              organizationId={organization.id}
              links={details.joinLinks}
            />
          ) : null}
        </div>
      </SettingsSection>

      {organization.role === "owner" ? (
        <OrganizationAuditLog organizationId={organization.id} />
      ) : null}

      <p className="text-sm text-muted-foreground">
        {organization_delete_disabled()}
      </p>
    </div>
  )
}
