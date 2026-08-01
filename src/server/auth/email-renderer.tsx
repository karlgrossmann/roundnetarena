import "@tanstack/react-start/server-only"

import { render, toPlainText } from "react-email"

import { InvitationEmail } from "../../../emails/_templates/invitation"
import { PasswordResetEmail } from "../../../emails/_templates/password-reset"
import { VerificationEmail } from "../../../emails/_templates/verification"
import {
  invitationEmailCopy,
  passwordResetEmailCopy,
  verificationEmailCopy,
} from "../../../emails/_lib/copy"
import type { EmailLocale, EmailRole } from "../../../emails/_lib/copy"

interface BaseEmailInput {
  actionUrl: string
  expiresAt: string
  locale: EmailLocale
  logoUrl: string
  recipientName: string
}

export type AuthEmailInput =
  | (BaseEmailInput & { kind: "verification" })
  | (BaseEmailInput & { kind: "password-reset" })
  | (BaseEmailInput & {
      inviterName: string
      kind: "invitation"
      organizationName: string
      role: EmailRole
    })

export interface RenderedAuthEmail {
  html: string
  subject: string
  text: string
}

export async function renderAuthEmail(
  input: AuthEmailInput
): Promise<RenderedAuthEmail> {
  validateHttpUrl(input.actionUrl)
  validateHttpUrl(input.logoUrl)

  const subject = subjectFor(input)
  const email =
    input.kind === "verification" ? (
      <VerificationEmail {...input} />
    ) : input.kind === "password-reset" ? (
      <PasswordResetEmail {...input} />
    ) : (
      <InvitationEmail {...input} />
    )
  const html = await render(email)

  return {
    html,
    subject: safeSubject(subject),
    text: toPlainText(html, { wordwrap: false }),
  }
}

function subjectFor(input: AuthEmailInput): string {
  if (input.kind === "verification") {
    return verificationEmailCopy(input.locale).subject
  }
  if (input.kind === "password-reset") {
    return passwordResetEmailCopy(input.locale).subject
  }
  return invitationEmailCopy(
    input.locale,
    input.inviterName,
    input.organizationName,
    input.role
  ).subject
}

function safeSubject(value: string): string {
  return value
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, 180)
}

function validateHttpUrl(value: string): void {
  const url = new URL(value)
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Email URLs must use HTTP or HTTPS.")
  }
}
