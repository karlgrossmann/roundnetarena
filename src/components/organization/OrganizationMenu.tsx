import {
  IconAlertTriangle,
  IconBuildingCommunity,
  IconCheck,
  IconPlus,
} from "@/components/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "@tanstack/react-router"

import { useOrganizationBrand } from "./OrganizationBrandProvider"
import { OrganizationLogo } from "./OrganizationLogo"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { setActiveOrganization } from "@/lib/api/mutations"
import { organizationsQueryOptions, queryKeys } from "@/lib/api/queries"
import {
  organization_create,
  organization_manage,
  organization_load_error,
  organization_menu_label,
  organization_none,
  organization_select_error,
} from "@/paraglide/messages.js"
import type { OrganizationSummary } from "@/lib/types"

export function OrganizationMenu() {
  const queryClient = useQueryClient()
  const { setBrandColor } = useOrganizationBrand()
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const activeSlug =
    "organizationSlug" in params ? params.organizationSlug : undefined
  const organizations = useQuery(organizationsQueryOptions())
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

  if (organizations.isPending) {
    return (
      <div className="px-1.5 py-1">
        <Skeleton className="h-5 w-full" />
      </div>
    )
  }
  if (organizations.isError) {
    return (
      <DropdownMenuItem disabled title={organization_load_error()}>
        <IconAlertTriangle />
        {organization_none()}
      </DropdownMenuItem>
    )
  }

  const items = organizations.data
  const activeOrganization =
    items.length === 0
      ? null
      : (items.find((organization) => organization.slug === activeSlug) ??
        items.find((organization) => organization.isActive) ??
        items[0])
  const activeName = activeOrganization?.name ?? organization_none()

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger aria-label={organization_menu_label()}>
        {activeOrganization ? (
          <OrganizationLogo
            name={activeOrganization.name}
            logo={activeOrganization.logo}
            className="size-6 border-0"
          />
        ) : (
          <IconBuildingCommunity />
        )}
        <span className="min-w-0 flex-1 truncate">{activeName}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{organization_menu_label()}</DropdownMenuLabel>
          {selectOrganization.isError ? (
            <DropdownMenuLabel className="text-destructive">
              {organization_select_error()}
            </DropdownMenuLabel>
          ) : null}
          {items.map((organization) => (
            <DropdownMenuItem
              key={organization.id}
              disabled={
                organization.slug === activeSlug ||
                !organization.defaultLeagueId ||
                selectOrganization.isPending
              }
              onClick={() => selectOrganization.mutate(organization)}
            >
              <OrganizationLogo
                name={organization.name}
                logo={organization.logo}
                className="size-7"
              />
              <span className="min-w-0 flex-1 truncate">
                {organization.name}
              </span>
              {organization.slug === activeSlug ? <IconCheck /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/clubs" />}>
          <IconBuildingCommunity />
          {organization_manage()}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/clubs/new" />}>
          <IconPlus />
          {organization_create()}
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
