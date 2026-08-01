import { ActionEmail } from "../_components/ActionEmail"
import { commonEmailCopy, passwordResetEmailCopy } from "../_lib/copy"
import type { EmailLocale } from "../_lib/copy"

export interface PasswordResetEmailProps {
  actionUrl: string
  expiresAt: string
  locale: EmailLocale
  logoUrl: string
  recipientName: string
}

export function PasswordResetEmail({
  actionUrl,
  expiresAt,
  locale,
  logoUrl,
  recipientName,
}: PasswordResetEmailProps) {
  const common = commonEmailCopy(locale, recipientName, expiresAt)
  const copy = passwordResetEmailCopy(locale)

  return (
    <ActionEmail
      actionLabel={copy.action}
      actionUrl={actionUrl}
      body={copy.body}
      brand={common.brand}
      eyebrow={copy.eyebrow}
      expiry={common.expiry}
      footer={common.footer}
      greeting={common.greeting}
      ignoreNotice={common.ignoreNotice}
      linkFallback={common.linkFallback}
      locale={locale}
      logoUrl={logoUrl}
      preview={copy.preview}
      title={copy.title}
    />
  )
}

export const passwordResetPreviewProps = {
  actionUrl:
    "http://localhost:3000/api/auth/reset-password/preview-token?callbackURL=%2Freset-password",
  expiresAt: "2026-07-28T19:30:00.000Z",
  logoUrl: "/static/roundnet-arena-full.png",
  recipientName: "Alex Morgan",
} satisfies Omit<PasswordResetEmailProps, "locale">
