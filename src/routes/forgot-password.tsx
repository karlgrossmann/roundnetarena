import { useState } from "react"
import type { FormEvent } from "react"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"

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
import { requestPasswordResetEmail } from "@/lib/auth-client"
import { localizedRouteHead } from "@/lib/i18n"
import {
  forgot_password_description,
  forgot_password_error,
  forgot_password_pending,
  forgot_password_submit,
  forgot_password_success_description,
  forgot_password_success_title,
  register_back_to_sign_in,
  route_title_forgot_password,
  sign_in_email,
} from "@/paraglide/messages.js"

export const Route = createFileRoute("/forgot-password")({
  staticData: { titleKey: "forgotPassword" },
  head: () => localizedRouteHead("forgotPassword"),
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const mutation = useMutation({
    mutationFn: () => requestPasswordResetEmail(email),
    onSuccess: () => setSubmitted(true),
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <AuthPage
      title={route_title_forgot_password()}
      description={forgot_password_description()}
      footer={
        <Link
          to="/login"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {register_back_to_sign_in()}
        </Link>
      }
    >
      {submitted ? (
        <AuthStatus
          kind="success"
          title={forgot_password_success_title()}
          description={forgot_password_success_description()}
        />
      ) : (
        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">{sign_in_email()}</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                required
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            {mutation.isError ? (
              <FieldError>{forgot_password_error()}</FieldError>
            ) : null}
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? forgot_password_pending()
                : forgot_password_submit()}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthPage>
  )
}
