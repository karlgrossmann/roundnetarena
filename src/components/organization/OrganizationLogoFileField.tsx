import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  organization_logo_description,
  organization_logo_optional,
} from "@/paraglide/messages.js"

export function OrganizationLogoFileField({
  file,
  disabled,
  invalid = false,
  label = organization_logo_optional(),
  onChange,
}: {
  file: File | null
  disabled: boolean
  invalid?: boolean
  label?: string
  onChange: (file: File | null) => void
}) {
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor="organization-logo-file">{label}</FieldLabel>
      <Input
        id="organization-logo-file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.files?.item(0) ?? null)}
      />
      <FieldDescription>
        {file?.name ?? organization_logo_description()}
      </FieldDescription>
      {invalid ? (
        <FieldError>{organization_logo_description()}</FieldError>
      ) : null}
    </Field>
  )
}
