import { ActionEmail } from "../_components/ActionEmail"
import { commonEmailCopy, verificationEmailCopy } from "../_lib/copy"
import type { EmailLocale } from "../_lib/copy"

export interface VerificationEmailProps {
  actionUrl: string
  expiresAt: string
  locale: EmailLocale
  logoUrl: string
  recipientName: string
}

export function VerificationEmail({
  actionUrl,
  expiresAt,
  locale,
  logoUrl,
  recipientName,
}: VerificationEmailProps) {
  const common = commonEmailCopy(locale, recipientName, expiresAt)
  const copy = verificationEmailCopy(locale)

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

export const verificationPreviewProps = {
  actionUrl:
    "http://localhost:3000/api/auth/verify-email?token=preview-token&callbackURL=%2Fverify-email%3Fverified%3D1",
  expiresAt: "2026-08-04T18:30:00.000Z",
  logoUrl: "/static/roundnet-arena-full.png",
  recipientName: "Alex Morgan",
} satisfies Omit<VerificationEmailProps, "locale">
