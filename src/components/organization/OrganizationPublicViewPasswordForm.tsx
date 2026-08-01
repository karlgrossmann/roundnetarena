import { useState } from "react"
import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  PUBLIC_VIEW_PASSWORD_MAX_LENGTH,
  PUBLIC_VIEW_PASSWORD_MIN_LENGTH,
} from "@/lib/public-view"
import {
  common_cancel,
  organization_public_view_change_password,
  organization_public_view_enable,
  organization_public_view_password,
  organization_public_view_password_confirm,
  organization_public_view_password_help,
  organization_public_view_password_mismatch,
  organization_public_view_saving,
} from "@/paraglide/messages.js"

export function OrganizationPublicViewPasswordForm({
  enabled,
  saving,
  onCancel,
  onSave,
}: {
  enabled: boolean
  saving: boolean
  onCancel: () => void
  onSave: (password: string) => void
}) {
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const passwordValid =
    password.length >= PUBLIC_VIEW_PASSWORD_MIN_LENGTH &&
    password.length <= PUBLIC_VIEW_PASSWORD_MAX_LENGTH
  const passwordsMatch = password === confirmation

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (passwordValid && passwordsMatch) onSave(password)
  }

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field data-invalid={(submitted && !passwordValid) || undefined}>
          <FieldLabel htmlFor="organization-public-view-password">
            {organization_public_view_password()}
          </FieldLabel>
          <Input
            id="organization-public-view-password"
            type="password"
            autoComplete="new-password"
            value={password}
            minLength={PUBLIC_VIEW_PASSWORD_MIN_LENGTH}
            maxLength={PUBLIC_VIEW_PASSWORD_MAX_LENGTH}
            disabled={saving}
            aria-invalid={submitted && !passwordValid}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FieldDescription>
            {organization_public_view_password_help()}
          </FieldDescription>
        </Field>
        <Field data-invalid={(submitted && !passwordsMatch) || undefined}>
          <FieldLabel htmlFor="organization-public-view-confirmation">
            {organization_public_view_password_confirm()}
          </FieldLabel>
          <Input
            id="organization-public-view-confirmation"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            maxLength={PUBLIC_VIEW_PASSWORD_MAX_LENGTH}
            disabled={saving}
            aria-invalid={submitted && !passwordsMatch}
            onChange={(event) => setConfirmation(event.target.value)}
          />
          {submitted && !passwordsMatch ? (
            <FieldError>
              {organization_public_view_password_mismatch()}
            </FieldError>
          ) : null}
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving
              ? organization_public_view_saving()
              : enabled
                ? organization_public_view_change_password()
                : organization_public_view_enable()}
          </Button>
          {enabled ? (
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onCancel}
            >
              {common_cancel()}
            </Button>
          ) : null}
        </div>
      </FieldGroup>
    </form>
  )
}
