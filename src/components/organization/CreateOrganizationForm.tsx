import { useState } from "react"
import type { FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"

import { OrganizationMutationError } from "./OrganizationMutationError"
import { OrganizationBrandColorPicker } from "./OrganizationBrandColorPicker"
import { useOrganizationBrand } from "./OrganizationBrandProvider"
import { OrganizationLogoFileField } from "./OrganizationLogoFileField"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { createOrganization, uploadOrganizationLogo } from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import { domainIssueFromError } from "@/lib/domain-errors"
import { translateDomainIssue } from "@/lib/i18n"
import { DEFAULT_ORGANIZATION_BRAND_COLOR } from "@/lib/organization-brand"
import type { OrganizationBrandColor } from "@/lib/organization-brand"
import {
  ORGANIZATION_LOGO_MAX_BYTES,
  isOrganizationLogoInputType,
} from "@/lib/organization-logo"
import {
  isValidOrganizationSlug,
  organizationSlug,
} from "@/lib/organization-form"
import {
  organization_create,
  organization_create_description,
  organization_create_error,
  organization_create_pending,
  organization_brand_color_description,
  organization_brand_color_label,
  organization_name,
  organization_logo_onboarding_error,
  organization_provisioning_pending,
  organization_provisioning_pending_description,
  organization_slug,
  organization_slug_hint,
  validation_organization_name,
  validation_organization_slug,
} from "@/paraglide/messages.js"

export function CreateOrganizationForm() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { setBrandColor } = useOrganizationBrand()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)
  const [logo, setLogo] = useState<File | null>(null)
  const [brandColor, setBrandColorValue] = useState<OrganizationBrandColor>(
    DEFAULT_ORGANIZATION_BRAND_COLOR
  )
  const [submitted, setSubmitted] = useState(false)
  const mutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: async (organization) => {
      setBrandColor(organization.brandColor)
      if (logo) {
        try {
          const details = await uploadOrganizationLogo(organization.id, logo)
          queryClient.setQueryData(
            queryKeys.organization(organization.id),
            details
          )
        } catch (error) {
          const issue = domainIssueFromError(error)
          toast.add({
            title: organization_logo_onboarding_error(),
            description: issue ? translateDomainIssue(issue) : undefined,
            type: "warning",
          })
        }
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations })
      if (!organization.provisioned || !organization.defaultLeagueId) {
        setSubmitted(true)
        await navigate({
          to: "/clubs/$organizationId",
          params: { organizationId: organization.id },
        })
        return
      }
      await navigate({
        to: "/o/$organizationSlug/l/$leagueId",
        params: {
          organizationSlug: organization.slug,
          leagueId: organization.defaultLeagueId,
        },
      })
    },
  })
  const nameValid = name.trim().length >= 2
  const slugValid = isValidOrganizationSlug(slug)
  const logoValid =
    !logo ||
    (isOrganizationLogoInputType(logo.type) &&
      logo.size <= ORGANIZATION_LOGO_MAX_BYTES)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (!nameValid || !slugValid || !logoValid) return
    mutation.mutate({ name, slug, brandColor })
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>{organization_create()}</CardTitle>
        <CardDescription>{organization_create_description()}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field data-invalid={(submitted && !nameValid) || undefined}>
              <FieldLabel htmlFor="organization-name">
                {organization_name()}
              </FieldLabel>
              <Input
                id="organization-name"
                value={name}
                autoComplete="organization"
                required
                maxLength={100}
                aria-invalid={submitted && !nameValid}
                onChange={(event) => {
                  const nextName = event.target.value
                  setName(nextName)
                  if (!slugEdited) setSlug(organizationSlug(nextName))
                }}
              />
              {submitted && !nameValid ? (
                <FieldError>{validation_organization_name()}</FieldError>
              ) : null}
            </Field>
            <Field data-invalid={(submitted && !slugValid) || undefined}>
              <FieldLabel htmlFor="organization-slug">
                {organization_slug()}
              </FieldLabel>
              <Input
                id="organization-slug"
                value={slug}
                required
                minLength={3}
                maxLength={48}
                spellCheck={false}
                autoCapitalize="none"
                aria-invalid={submitted && !slugValid}
                onChange={(event) => {
                  setSlugEdited(true)
                  setSlug(organizationSlug(event.target.value))
                }}
              />
              <FieldDescription>{organization_slug_hint()}</FieldDescription>
              {submitted && !slugValid ? (
                <FieldError>{validation_organization_slug()}</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel>{organization_brand_color_label()}</FieldLabel>
              <OrganizationBrandColorPicker
                value={brandColor}
                disabled={mutation.isPending}
                onValueChange={setBrandColorValue}
              />
              <FieldDescription>
                {organization_brand_color_description()}
              </FieldDescription>
            </Field>
            <OrganizationLogoFileField
              file={logo}
              disabled={mutation.isPending}
              invalid={submitted && !logoValid}
              onChange={setLogo}
            />
            {mutation.isError ? (
              <OrganizationMutationError
                error={mutation.error}
                fallback={organization_create_error()}
              />
            ) : null}
            {mutation.data && !mutation.data.provisioned ? (
              <Alert>
                <AlertTitle>{organization_provisioning_pending()}</AlertTitle>
                <AlertDescription>
                  {organization_provisioning_pending_description()}
                </AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? organization_create_pending()
                : organization_create()}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
