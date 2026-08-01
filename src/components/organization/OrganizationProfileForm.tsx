import { useState } from "react"
import type { FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { OrganizationBrandColorFields } from "./OrganizationBrandColorFields"
import { OrganizationLogoFields } from "./OrganizationLogoFields"
import { OrganizationMutationError } from "./OrganizationMutationError"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { updateOrganization } from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import { isValidOrganizationSlug } from "@/lib/organization-form"
import type { OrganizationSummary } from "@/lib/types"
import {
  organization_branding,
  organization_logo,
  organization_name,
  organization_profile,
  organization_profile_description,
  organization_save,
  organization_save_error,
  organization_saving,
  organization_slug,
  organization_slug_hint,
  validation_organization_name,
  validation_organization_slug,
} from "@/paraglide/messages.js"

export function OrganizationProfileForm({
  organization,
  editable,
}: {
  organization: OrganizationSummary
  editable: boolean
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(organization.name)
  const [slug, setSlug] = useState(organization.slug)
  const [submitted, setSubmitted] = useState(false)
  const mutation = useMutation({
    mutationFn: () => updateOrganization(organization.id, { name, slug }),
    onSuccess: async (details) => {
      queryClient.setQueryData(queryKeys.organization(organization.id), details)
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations })
    },
  })
  const nameValid = name.trim().length >= 2
  const slugValid = isValidOrganizationSlug(slug)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (!nameValid || !slugValid) return
    mutation.mutate()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{organization_profile()}</CardTitle>
        <CardDescription>{organization_profile_description()}</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <form onSubmit={submit} noValidate>
            <FieldGroup>
              <Field data-invalid={(submitted && !nameValid) || undefined}>
                <FieldLabel htmlFor="profile-organization-name">
                  {organization_name()}
                </FieldLabel>
                <Input
                  id="profile-organization-name"
                  value={name}
                  readOnly={!editable}
                  maxLength={100}
                  aria-invalid={submitted && !nameValid}
                  onChange={(event) => setName(event.target.value)}
                />
                {submitted && !nameValid ? (
                  <FieldError>{validation_organization_name()}</FieldError>
                ) : null}
              </Field>
              <Field data-invalid={(submitted && !slugValid) || undefined}>
                <FieldLabel htmlFor="profile-organization-slug">
                  {organization_slug()}
                </FieldLabel>
                <Input
                  id="profile-organization-slug"
                  value={slug}
                  readOnly={!editable}
                  minLength={3}
                  maxLength={48}
                  spellCheck={false}
                  aria-invalid={submitted && !slugValid}
                  onChange={(event) => setSlug(event.target.value)}
                />
                <FieldDescription>{organization_slug_hint()}</FieldDescription>
                {submitted && !slugValid ? (
                  <FieldError>{validation_organization_slug()}</FieldError>
                ) : null}
              </Field>
              {mutation.isError ? (
                <OrganizationMutationError
                  error={mutation.error}
                  fallback={organization_save_error()}
                />
              ) : null}
              {editable ? (
                <Button
                  type="submit"
                  className="self-start"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending
                    ? organization_saving()
                    : organization_save()}
                </Button>
              ) : null}
            </FieldGroup>
          </form>

          <FieldSeparator>{organization_logo()}</FieldSeparator>
          <OrganizationLogoFields
            organization={organization}
            editable={editable}
          />

          <FieldSeparator>{organization_branding()}</FieldSeparator>
          <OrganizationBrandColorFields
            organization={organization}
            editable={editable}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
