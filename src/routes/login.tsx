import { useState } from "react"
import type { FormEvent } from "react"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { z } from "zod"

import { AuthPage } from "@/components/auth/AuthPage"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { acceptOrganizationJoinLink } from "@/lib/api/mutations"
import { authClient } from "@/lib/auth-client"
import { safeAuthRedirect } from "@/lib/auth-routes"
import { localizedRouteHead } from "@/lib/i18n"
import { organizationJoinTokenFromRedirect } from "@/lib/organization-join-links"
import {
  route_title_sign_in,
  sign_in_create_account,
  sign_in_description,
  sign_in_email,
  sign_in_forgot_password,
  sign_in_invalid,
  sign_in_password,
  sign_in_pending,
  sign_in_submit,
  sign_in_unverified,
  verify_email_resend,
} from "@/paraglide/messages.js"

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  staticData: { titleKey: "signIn" },
  head: () => localizedRouteHead("signIn"),
  component: SignInPage,
})

function SignInPage() {
  const search = Route.useSearch()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
      })
      if (error) throw new Error(error.code ?? "SIGN_IN_FAILED")
      const redirect = safeAuthRedirect(search.redirect)
      const joinToken = organizationJoinTokenFromRedirect(redirect)
      if (joinToken) {
        try {
          const joined = await acceptOrganizationJoinLink(joinToken)
          return `/clubs/${joined.organizationId}`
        } catch {
          return redirect
        }
      }
      return redirect
    },
    onSuccess: (destination) => window.location.assign(destination),
  })
  const requiresVerification = mutation.error?.message === "EMAIL_NOT_VERIFIED"

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <AuthPage
      title={route_title_sign_in()}
      description={sign_in_description()}
      footer={
        <Link
          to="/register"
          search={{ redirect: search.redirect }}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {sign_in_create_account()}
        </Link>
      }
    >
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
          <Field data-invalid={mutation.isError || undefined}>
            <div className="flex items-center justify-between gap-4">
              <FieldLabel htmlFor="password">{sign_in_password()}</FieldLabel>
              <Link
                to="/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {sign_in_forgot_password()}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              required
              aria-invalid={mutation.isError}
              onChange={(event) => setPassword(event.target.value)}
            />
            {mutation.isError ? (
              <FieldError>
                {requiresVerification
                  ? sign_in_unverified()
                  : sign_in_invalid()}
              </FieldError>
            ) : null}
          </Field>
          {requiresVerification ? (
            <Button
              type="button"
              variant="outline"
              render={<Link to="/resend-verification" />}
            >
              {verify_email_resend()}
            </Button>
          ) : null}
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? sign_in_pending() : sign_in_submit()}
          </Button>
        </FieldGroup>
      </form>
    </AuthPage>
  )
}
