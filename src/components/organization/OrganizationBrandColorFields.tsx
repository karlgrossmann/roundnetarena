import { useMutation, useQueryClient } from "@tanstack/react-query"

import { OrganizationBrandColorPicker } from "./OrganizationBrandColorPicker"
import { useOrganizationBrand } from "./OrganizationBrandProvider"
import { OrganizationMutationError } from "./OrganizationMutationError"
import { FieldDescription } from "@/components/ui/field"
import { updateOrganizationBrandColor } from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import type { OrganizationBrandColor } from "@/lib/organization-brand"
import type { OrganizationSummary } from "@/lib/types"
import {
  organization_brand_color_description,
  organization_brand_color_error,
} from "@/paraglide/messages.js"

export function OrganizationBrandColorFields({
  organization,
  editable,
}: {
  organization: OrganizationSummary
  editable: boolean
}) {
  const queryClient = useQueryClient()
  const { setBrandColor } = useOrganizationBrand()
  const mutation = useMutation({
    mutationFn: (brandColor: OrganizationBrandColor) =>
      updateOrganizationBrandColor(organization.id, brandColor),
    onSuccess: async (details) => {
      queryClient.setQueryData(queryKeys.organization(organization.id), details)
      setBrandColor(details.organization.brandColor)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.organizations,
      })
    },
  })
  const selectedColor = mutation.isPending
    ? mutation.variables
    : organization.brandColor

  return (
    <div className="flex flex-col gap-3">
      <FieldDescription>
        {organization_brand_color_description()}
      </FieldDescription>
      <OrganizationBrandColorPicker
        value={selectedColor}
        disabled={!editable || mutation.isPending}
        onValueChange={(brandColor) => mutation.mutate(brandColor)}
      />
      {mutation.isError ? (
        <OrganizationMutationError
          error={mutation.error}
          fallback={organization_brand_color_error()}
        />
      ) : null}
    </div>
  )
}
