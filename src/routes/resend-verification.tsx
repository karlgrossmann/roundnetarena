import { useState } from "react"
import type { FormEvent } from "react"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"

import { AuthPage } from "@/components/auth/AuthPage"
import { AuthStatus } from "@/components/auth/AuthStatus"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { localizedRouteHead } from "@/lib/i18n"
import {
  register_back_to_sign_in,
  resend_verification_description,
  resend_verification_pending,
  resend_verification_submit,
  resend_verification_success_description,
  resend_verification_success_title,
  route_title_resend_verification,
  sign_in_email,
} from "@/paraglide/messages.js"

export const Route = createFileRoute("/resend-verification")({
  staticData: { titleKey: "resendVerification" },
  head: () => localizedRouteHead("resendVerification"),
  component: ResendVerificationPage,
})

function ResendVerificationPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const mutation = useMutation({
    mutationFn: async () => {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/verify-email?verified=1",
      })
    },
    onSettled: () => setSubmitted(true),
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <AuthPage
      title={route_title_resend_verification()}
      description={resend_verification_description()}
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
          title={resend_verification_success_title()}
          description={resend_verification_success_description()}
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
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? resend_verification_pending()
                : resend_verification_submit()}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthPage>
  )
}
