import "@tanstack/react-start/server-only"

import { Resend } from "resend"

import type { EmailRole } from "../../../emails/_lib/copy"
import { getAuthEnvironment, getEmailEnvironment } from "../config"
import { localizeEmailActionUrl, resolveEmailLocale } from "./email-locale"
import { renderAuthEmail } from "./email-renderer"
import {
  PASSWORD_RESET_EMAIL_EXPIRES_IN_SECONDS,
  VERIFICATION_EMAIL_EXPIRES_IN_SECONDS,
} from "./email-settings"
import type { AuthEmailInput } from "./email-renderer"

export function sendVerificationEmail(
  to: string,
  url: string,
  recipientName = "",
  request?: Request
): void {
  const locale = resolveEmailLocale(request)
  queueEmail(to, {
    actionUrl: localizeEmailActionUrl(url, locale),
    expiresAt: expiresAt(VERIFICATION_EMAIL_EXPIRES_IN_SECONDS),
    kind: "verification",
    locale,
    logoUrl: emailLogoUrl(),
    recipientName,
  })
}

export function sendPasswordResetEmail(
  to: string,
  url: string,
  recipientName = "",
  request?: Request
): void {
  const locale = resolveEmailLocale(request)
  queueEmail(to, {
    actionUrl: localizeEmailActionUrl(url, locale),
    expiresAt: expiresAt(PASSWORD_RESET_EMAIL_EXPIRES_IN_SECONDS),
    kind: "password-reset",
    locale,
    logoUrl: emailLogoUrl(),
    recipientName,
  })
}

export function sendInvitationEmail(
  to: string,
  organizationName: string,
  inviterName: string,
  url: string,
  role: EmailRole,
  invitationExpiresAt: Date,
  request?: Request
): void {
  const locale = resolveEmailLocale(request)
  queueEmail(to, {
    actionUrl: localizeEmailActionUrl(url, locale),
    expiresAt: invitationExpiresAt.toISOString(),
    inviterName,
    kind: "invitation",
    locale,
    logoUrl: emailLogoUrl(),
    organizationName,
    recipientName: "",
    role,
  })
}

function queueEmail(to: string, email: AuthEmailInput): void {
  void deliverEmail(to, email).catch((error: unknown) => {
    const reason = error instanceof Error ? error.name : "UnknownError"
    process.stderr.write(
      `[auth-email] ${email.kind} could not be handed to Resend (${reason}).\n`
    )
  })
}

async function deliverEmail(to: string, email: AuthEmailInput): Promise<void> {
  const [rendered, environment] = await Promise.all([
    renderAuthEmail(email),
    Promise.resolve(getEmailEnvironment()),
  ])
  const resend = new Resend(environment.apiKey)
  const { error } = await resend.emails.send({
    from: environment.from,
    html: rendered.html,
    subject: rendered.subject,
    text: rendered.text,
    to,
  })
  if (error) throw new Error("Resend rejected the email request.")
}

/**
 * Deliberately the dark variant with wordmark: email clients cannot pick up the
 * application's color scheme, and their default background is light.
 */
function emailLogoUrl(): string {
  return new URL(
    "/roundnet-arena-full.png",
    getAuthEnvironment().baseUrl
  ).toString()
}

function expiresAt(seconds: number): string {
  return new Date(Date.now() + seconds * 1_000).toISOString()
}
