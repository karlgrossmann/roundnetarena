import {
  IconAlertTriangle,
  IconBuildingCommunity,
  IconPlus,
} from "@/components/icons"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"

import { OrganizationMutationError } from "./OrganizationMutationError"
import { useOrganizationBrand } from "./OrganizationBrandProvider"
import { OrganizationLogo } from "./OrganizationLogo"
import { OrganizationRoleBadge } from "./OrganizationRoleBadge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  retryOrganizationProvisioning,
  setActiveOrganization,
} from "@/lib/api/mutations"
import { organizationSettingsRoute } from "@/lib/api/league-route"
import { organizationsQueryOptions, queryKeys } from "@/lib/api/queries"
import type { OrganizationSummary } from "@/lib/types"
import {
  organization_active,
  organization_create,
  organization_empty_description,
  organization_empty_title,
  organization_list_description,
  organization_manage,
  organization_provisioning_error,
  organization_provisioning_pending,
  organization_provisioning_retry,
  organization_select,
  organization_select_error,
} from "@/paraglide/messages.js"

export function OrganizationList() {
  const queryClient = useQueryClient()
  const { setBrandColor } = useOrganizationBrand()
  const navigate = useNavigate()
  const { data: organizations } = useSuspenseQuery(organizationsQueryOptions())
  const selectOrganization = useMutation({
    mutationFn: (organization: OrganizationSummary) =>
      setActiveOrganization(organization.id),
    onSuccess: (result, organization) => {
      queryClient.setQueryData(queryKeys.organizations, result)
      setBrandColor(organization.brandColor)
      if (organization.defaultLeagueId) {
        void navigate({
          to: "/o/$organizationSlug/l/$leagueId",
          params: {
            organizationSlug: organization.slug,
            leagueId: organization.defaultLeagueId,
          },
        })
      }
    },
  })
  const retryProvisioning = useMutation({
    mutationFn: retryOrganizationProvisioning,
    onSuccess: async ({ organizationId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.organizations }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.organization(organizationId),
        }),
      ])
    },
  })

  if (organizations.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconBuildingCommunity />
          </EmptyMedia>
          <EmptyTitle>{organization_empty_title()}</EmptyTitle>
          <EmptyDescription>
            {organization_empty_description()}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link to="/clubs/new" />}>
            <IconPlus />
            {organization_create()}
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {organization_list_description()}
        </p>
        <Button
          nativeButton={false}
          size="sm"
          render={<Link to="/clubs/new" />}
        >
          <IconPlus />
          {organization_create()}
        </Button>
      </div>

      {retryProvisioning.isError ? (
        <OrganizationMutationError
          error={retryProvisioning.error}
          fallback={organization_provisioning_error()}
        />
      ) : null}
      {selectOrganization.isError ? (
        <OrganizationMutationError
          error={selectOrganization.error}
          fallback={organization_select_error()}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {organizations.map((organization) => {
          const settingsRoute = organizationSettingsRoute(organization)
          return (
            <Card key={organization.id}>
              <CardHeader>
                <div className="flex min-w-0 items-center gap-3">
                  <OrganizationLogo
                    name={organization.name}
                    logo={organization.logo}
                    className="size-11"
                  />
                  <div className="min-w-0">
                    <CardTitle className="truncate">
                      {organization.name}
                    </CardTitle>
                    <CardDescription>/{organization.slug}</CardDescription>
                  </div>
                </div>
                <CardAction>
                  <OrganizationRoleBadge role={organization.role} />
                </CardAction>
              </CardHeader>
              <CardContent>
                {!organization.provisioned ? (
                  <Alert>
                    <IconAlertTriangle />
                    <AlertTitle>
                      {organization_provisioning_pending()}
                    </AlertTitle>
                    <AlertDescription>
                      <Button
                        variant="link"
                        className="h-auto p-0"
                        disabled={retryProvisioning.isPending}
                        onClick={() =>
                          retryProvisioning.mutate(organization.id)
                        }
                      >
                        {organization_provisioning_retry()}
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
              <CardFooter className="gap-2">
                {settingsRoute ? (
                  <Button
                    nativeButton={false}
                    variant="outline"
                    size="sm"
                    render={<Link {...settingsRoute} />}
                  >
                    {organization_manage()}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    {organization_manage()}
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={
                    organization.isActive || selectOrganization.isPending
                  }
                  onClick={() => selectOrganization.mutate(organization)}
                >
                  {organization.isActive
                    ? organization_active()
                    : organization_select()}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
