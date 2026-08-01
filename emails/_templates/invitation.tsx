import { Section, Text } from "react-email"

import { ActionEmail } from "../_components/ActionEmail"
import { labelStyle, palette, valueStyle } from "../_components/styles"
import { commonEmailCopy, invitationEmailCopy } from "../_lib/copy"
import type { EmailLocale, EmailRole } from "../_lib/copy"

export interface InvitationEmailProps {
  actionUrl: string
  expiresAt: string
  inviterName: string
  locale: EmailLocale
  logoUrl: string
  organizationName: string
  recipientName: string
  role: EmailRole
}

export function InvitationEmail({
  actionUrl,
  expiresAt,
  inviterName,
  locale,
  logoUrl,
  organizationName,
  recipientName,
  role,
}: InvitationEmailProps) {
  const common = commonEmailCopy(locale, recipientName, expiresAt)
  const copy = invitationEmailCopy(locale, inviterName, organizationName, role)

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
    >
      <Section
        style={{
          border: `1px solid ${palette.border}`,
          margin: "28px 0 0",
          padding: "20px",
        }}
      >
        <Text style={labelStyle}>{copy.organizationLabel}</Text>
        <Text style={{ ...valueStyle, marginBottom: "18px" }}>
          {organizationName}
        </Text>
        <Text style={labelStyle}>{copy.roleLabel}</Text>
        <Text style={valueStyle}>{copy.roleValue}</Text>
      </Section>
    </ActionEmail>
  )
}

export const invitationPreviewProps = {
  actionUrl:
    "http://localhost:3000/accept-invitation?id=76d2457f-8c6d-4540-9848-e10e7f5d9f71",
  expiresAt: "2026-08-04T18:30:00.000Z",
  inviterName: "Mara Klein",
  logoUrl: "/static/roundnet-arena-full.png",
  organizationName: "Roundnet Bielefeld",
  recipientName: "Alex Morgan",
  role: "manager",
} satisfies Omit<InvitationEmailProps, "locale">
