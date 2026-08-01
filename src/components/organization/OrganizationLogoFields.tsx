import { useState } from "react"
import { IconPhoto, IconTrash } from "@/components/icons"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { OrganizationLogo } from "./OrganizationLogo"
import { OrganizationLogoFileField } from "./OrganizationLogoFileField"
import { OrganizationMutationError } from "./OrganizationMutationError"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import {
  removeOrganizationLogo,
  uploadOrganizationLogo,
} from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import type { OrganizationSummary } from "@/lib/types"
import {
  organization_logo_error,
  organization_logo_remove,
  organization_logo_removing,
  organization_logo_replace,
  organization_logo_upload,
  organization_logo_uploading,
} from "@/paraglide/messages.js"

export function OrganizationLogoFields({
  organization,
  editable,
}: {
  organization: OrganizationSummary
  editable: boolean
}) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const upload = useMutation({
    mutationFn: (selectedFile: File) =>
      uploadOrganizationLogo(organization.id, selectedFile),
    onSuccess: async (details) => {
      setFile(null)
      queryClient.setQueryData(queryKeys.organization(organization.id), details)
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations })
    },
  })
  const remove = useMutation({
    mutationFn: () => removeOrganizationLogo(organization.id),
    onSuccess: async (details) => {
      queryClient.setQueryData(queryKeys.organization(organization.id), details)
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations })
    },
  })
  const isPending = upload.isPending || remove.isPending
  const error = upload.error ?? remove.error

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <OrganizationLogo
        name={organization.name}
        logo={organization.logo}
        className="size-16 self-center sm:self-start"
      />
      {editable ? (
        <FieldGroup className="min-w-0 flex-1 gap-3">
          <OrganizationLogoFileField
            file={file}
            disabled={isPending}
            label={
              organization.logo
                ? organization_logo_replace()
                : organization_logo_upload()
            }
            onChange={setFile}
          />
          {error ? (
            <OrganizationMutationError
              error={error}
              fallback={organization_logo_error()}
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!file || isPending}
              onClick={() => {
                if (file) upload.mutate(file)
              }}
            >
              <IconPhoto />
              {upload.isPending
                ? organization_logo_uploading()
                : organization.logo
                  ? organization_logo_replace()
                  : organization_logo_upload()}
            </Button>
            {organization.logo ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => remove.mutate()}
              >
                <IconTrash />
                {remove.isPending
                  ? organization_logo_removing()
                  : organization_logo_remove()}
              </Button>
            ) : null}
          </div>
        </FieldGroup>
      ) : null}
    </div>
  )
}
