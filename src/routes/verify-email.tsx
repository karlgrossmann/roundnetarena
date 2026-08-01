import { createFileRoute, Link } from "@tanstack/react-router"
import { z } from "zod"

import { AuthPage } from "@/components/auth/AuthPage"
import { AuthStatus } from "@/components/auth/AuthStatus"
import { Button } from "@/components/ui/button"
import { localizedRouteHead } from "@/lib/i18n"
import {
  register_back_to_sign_in,
  route_title_verify_email,
  verify_email_invalid_description,
  verify_email_invalid_title,
  verify_email_resend,
  verify_email_success_description,
  verify_email_success_title,
} from "@/paraglide/messages.js"

export const verifyEmailSearchSchema = z.object({
  // TanStack Router JSON-parses search parameters, so `verified=1` arrives as
  // the number 1 rather than the string "1".
  verified: z.literal(1).optional(),
  error: z.string().optional(),
  redirect: z.string().optional(),
})

export const Route = createFileRoute("/verify-email")({
  validateSearch: verifyEmailSearchSchema,
  staticData: { titleKey: "verifyEmail" },
  head: () => localizedRouteHead("verifyEmail"),
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { error, redirect, verified } = Route.useSearch()
  const invalid = Boolean(error) || verified !== 1

  return (
    <AuthPage
      title={route_title_verify_email()}
      description={
        invalid
          ? verify_email_invalid_description()
          : verify_email_success_description()
      }
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
      <div className="space-y-4">
        <AuthStatus
          kind={invalid ? "error" : "success"}
          title={
            invalid
              ? verify_email_invalid_title()
              : verify_email_success_title()
          }
          description={
            invalid
              ? verify_email_invalid_description()
              : verify_email_success_description()
          }
        />
        {invalid ? (
          <Button
            className="w-full"
            variant="outline"
            render={<Link to="/resend-verification" />}
          >
            {verify_email_resend()}
          </Button>
        ) : null}
      </div>
    </AuthPage>
  )
}
