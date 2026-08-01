import { email_brand } from "@/paraglide/messages/email_brand.js"
import { email_expiry } from "@/paraglide/messages/email_expiry.js"
import { email_footer } from "@/paraglide/messages/email_footer.js"
import { email_greeting_generic } from "@/paraglide/messages/email_greeting_generic.js"
import { email_greeting_named } from "@/paraglide/messages/email_greeting_named.js"
import { email_ignore_notice } from "@/paraglide/messages/email_ignore_notice.js"
import { email_invitation_action } from "@/paraglide/messages/email_invitation_action.js"
import { email_invitation_body } from "@/paraglide/messages/email_invitation_body.js"
import { email_invitation_eyebrow } from "@/paraglide/messages/email_invitation_eyebrow.js"
import { email_invitation_organization } from "@/paraglide/messages/email_invitation_organization.js"
import { email_invitation_preview } from "@/paraglide/messages/email_invitation_preview.js"
import { email_invitation_role } from "@/paraglide/messages/email_invitation_role.js"
import { email_invitation_subject } from "@/paraglide/messages/email_invitation_subject.js"
import { email_invitation_title } from "@/paraglide/messages/email_invitation_title.js"
import { email_link_fallback } from "@/paraglide/messages/email_link_fallback.js"
import { email_password_reset_action } from "@/paraglide/messages/email_password_reset_action.js"
import { email_password_reset_body } from "@/paraglide/messages/email_password_reset_body.js"
import { email_password_reset_eyebrow } from "@/paraglide/messages/email_password_reset_eyebrow.js"
import { email_password_reset_preview } from "@/paraglide/messages/email_password_reset_preview.js"
import { email_password_reset_subject } from "@/paraglide/messages/email_password_reset_subject.js"
import { email_password_reset_title } from "@/paraglide/messages/email_password_reset_title.js"
import { email_role_admin } from "@/paraglide/messages/email_role_admin.js"
import { email_role_manager } from "@/paraglide/messages/email_role_manager.js"
import { email_role_owner } from "@/paraglide/messages/email_role_owner.js"
import { email_verification_action } from "@/paraglide/messages/email_verification_action.js"
import { email_verification_body } from "@/paraglide/messages/email_verification_body.js"
import { email_verification_eyebrow } from "@/paraglide/messages/email_verification_eyebrow.js"
import { email_verification_preview } from "@/paraglide/messages/email_verification_preview.js"
import { email_verification_subject } from "@/paraglide/messages/email_verification_subject.js"
import { email_verification_title } from "@/paraglide/messages/email_verification_title.js"

export type EmailLocale = "de" | "en"
export type EmailRole = "owner" | "admin" | "manager"

function options(locale: EmailLocale) {
  return { locale }
}

export function commonEmailCopy(
  locale: EmailLocale,
  recipientName: string,
  expiresAt: string
) {
  const messageOptions = options(locale)
  return {
    brand: email_brand({}, messageOptions),
    expiry: email_expiry(
      { expiresAt: formatEmailExpiry(expiresAt, locale) },
      messageOptions
    ),
    footer: email_footer({}, messageOptions),
    greeting: recipientName.trim()
      ? email_greeting_named({ name: recipientName.trim() }, messageOptions)
      : email_greeting_generic({}, messageOptions),
    ignoreNotice: email_ignore_notice({}, messageOptions),
    linkFallback: email_link_fallback({}, messageOptions),
  }
}

export function verificationEmailCopy(locale: EmailLocale) {
  const messageOptions = options(locale)
  return {
    action: email_verification_action({}, messageOptions),
    body: email_verification_body({}, messageOptions),
    eyebrow: email_verification_eyebrow({}, messageOptions),
    preview: email_verification_preview({}, messageOptions),
    subject: email_verification_subject({}, messageOptions),
    title: email_verification_title({}, messageOptions),
  }
}

export function passwordResetEmailCopy(locale: EmailLocale) {
  const messageOptions = options(locale)
  return {
    action: email_password_reset_action({}, messageOptions),
    body: email_password_reset_body({}, messageOptions),
    eyebrow: email_password_reset_eyebrow({}, messageOptions),
    preview: email_password_reset_preview({}, messageOptions),
    subject: email_password_reset_subject({}, messageOptions),
    title: email_password_reset_title({}, messageOptions),
  }
}

export function invitationEmailCopy(
  locale: EmailLocale,
  inviterName: string,
  organizationName: string,
  role: EmailRole
) {
  const messageOptions = options(locale)
  return {
    action: email_invitation_action({}, messageOptions),
    body: email_invitation_body(
      { inviter: inviterName, organization: organizationName },
      messageOptions
    ),
    eyebrow: email_invitation_eyebrow({}, messageOptions),
    organizationLabel: email_invitation_organization({}, messageOptions),
    preview: email_invitation_preview(
      { inviter: inviterName, organization: organizationName },
      messageOptions
    ),
    roleLabel: email_invitation_role({}, messageOptions),
    roleValue: roleName(role, locale),
    subject: email_invitation_subject(
      { organization: organizationName },
      messageOptions
    ),
    title: email_invitation_title({}, messageOptions),
  }
}

function roleName(role: EmailRole, locale: EmailLocale): string {
  const messageOptions = options(locale)
  if (role === "owner") return email_role_owner({}, messageOptions)
  if (role === "admin") return email_role_admin({}, messageOptions)
  return email_role_manager({}, messageOptions)
}

function formatEmailExpiry(value: string, locale: EmailLocale): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error("Email expiry must be a valid ISO timestamp.")
  }

  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    timeZone: "Europe/Berlin",
    timeZoneName: "short",
    year: "numeric",
  }).format(date)
}
