import { useState } from "react"
import type { FormEvent } from "react"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { z } from "zod"

import { AuthPage } from "@/components/auth/AuthPage"
import { AuthStatus } from "@/components/auth/AuthStatus"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { localizedRouteHead } from "@/lib/i18n"
import {
  register_back_to_sign_in,
  register_password_mismatch,
  reset_password_confirm,
  reset_password_description,
  reset_password_error,
  reset_password_invalid_description,
  reset_password_invalid_title,
  reset_password_new,
  reset_password_pending,
  reset_password_submit,
  reset_password_success_description,
  reset_password_success_title,
  route_title_reset_password,
} from "@/paraglide/messages.js"

export const Route = createFileRoute("/reset-password")({
  validateSearch: z.object({
    token: z.string().optional(),
    error: z.string().optional(),
  }),
  staticData: { titleKey: "resetPassword" },
  head: () => localizedRouteHead("resetPassword"),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token, error } = Route.useSearch()
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [completed, setCompleted] = useState(false)
  const passwordsMatch = password === confirmation
  const mutation = useMutation({
    mutationFn: async () => {
      if (!token || !passwordsMatch) throw new Error("INVALID_INPUT")
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      })
      if (resetError) throw new Error(resetError.code ?? "RESET_FAILED")
    },
    onSuccess: () => setCompleted(true),
  })
  const invalid = Boolean(error) || !token

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <AuthPage
      title={route_title_reset_password()}
      description={
        invalid
          ? reset_password_invalid_description()
          : reset_password_description()
      }
      footer={
        <Link
          to="/login"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {register_back_to_sign_in()}
        </Link>
      }
    >
      {invalid ? (
        <AuthStatus
          kind="error"
          title={reset_password_invalid_title()}
          description={reset_password_invalid_description()}
        />
      ) : completed ? (
        <AuthStatus
          kind="success"
          title={reset_password_success_title()}
          description={reset_password_success_description()}
        />
      ) : (
        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">{reset_password_new()}</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                value={password}
                required
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            <Field data-invalid={!passwordsMatch || undefined}>
              <FieldLabel htmlFor="password-confirmation">
                {reset_password_confirm()}
              </FieldLabel>
              <Input
                id="password-confirmation"
                name="password-confirmation"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                value={confirmation}
                required
                aria-invalid={!passwordsMatch}
                onChange={(event) => setConfirmation(event.target.value)}
              />
              {!passwordsMatch ? (
                <FieldError>{register_password_mismatch()}</FieldError>
              ) : null}
            </Field>
            {mutation.isError && mutation.error.message !== "INVALID_INPUT" ? (
              <FieldError>{reset_password_error()}</FieldError>
            ) : null}
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending || !passwordsMatch}
            >
              {mutation.isPending
                ? reset_password_pending()
                : reset_password_submit()}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthPage>
  )
}
