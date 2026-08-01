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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { safeAuthRedirect } from "@/lib/auth-routes"
import { localizedRouteHead } from "@/lib/i18n"
import {
  register_back_to_sign_in,
  register_description,
  register_email,
  register_error,
  register_name,
  register_password,
  register_password_confirm,
  register_password_hint,
  register_password_mismatch,
  register_pending,
  register_submit,
  register_success_description,
  register_success_title,
  route_title_register,
} from "@/paraglide/messages.js"

export const Route = createFileRoute("/register")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  staticData: { titleKey: "register" },
  head: () => localizedRouteHead("register"),
  component: RegisterPage,
})

function RegisterPage() {
  const { redirect } = Route.useSearch()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const passwordsMatch = password === confirmation
  const mutation = useMutation({
    mutationFn: async () => {
      if (!passwordsMatch) throw new Error("PASSWORD_MISMATCH")
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: verificationCallback(redirect),
      })
      if (error) throw new Error(error.code ?? "SIGN_UP_FAILED")
    },
    onSuccess: () => setSubmitted(true),
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <AuthPage
      title={route_title_register()}
      description={register_description()}
      footer={
        <Link
          to="/login"
          search={{ redirect }}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {register_back_to_sign_in()}
        </Link>
      }
    >
      {submitted ? (
        <AuthStatus
          kind="success"
          title={register_success_title()}
          description={register_success_description()}
        />
      ) : (
        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">{register_name()}</FieldLabel>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                value={name}
                required
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">{register_email()}</FieldLabel>
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
            <Field>
              <FieldLabel htmlFor="password">{register_password()}</FieldLabel>
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
              <FieldDescription>{register_password_hint()}</FieldDescription>
            </Field>
            <Field data-invalid={!passwordsMatch || undefined}>
              <FieldLabel htmlFor="password-confirmation">
                {register_password_confirm()}
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
            {mutation.isError &&
            mutation.error.message !== "PASSWORD_MISMATCH" ? (
              <FieldError>{register_error()}</FieldError>
            ) : null}
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending || !passwordsMatch}
            >
              {mutation.isPending ? register_pending() : register_submit()}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthPage>
  )
}

function verificationCallback(redirect: string | undefined): string {
  const safeRedirect = safeAuthRedirect(redirect)
  const search = new URLSearchParams({ verified: "1" })
  if (safeRedirect !== "/") search.set("redirect", safeRedirect)
  return `/verify-email?${search.toString()}`
}
