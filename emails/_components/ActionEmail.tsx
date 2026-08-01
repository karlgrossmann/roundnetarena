import type { ReactNode } from "react"
import { Button, Heading, Link, Section, Text } from "react-email"

import type { EmailLocale } from "../_lib/copy"
import { EmailLayout } from "./EmailLayout"
import {
  buttonStyle,
  eyebrowStyle,
  headingStyle,
  inlineLinkStyle,
  mutedTextStyle,
  palette,
  textStyle,
} from "./styles"

interface ActionEmailProps {
  actionLabel: string
  actionUrl: string
  body: string
  brand: string
  children?: ReactNode
  eyebrow: string
  expiry: string
  footer: string
  greeting: string
  ignoreNotice: string
  linkFallback: string
  locale: EmailLocale
  logoUrl: string
  preview: string
  title: string
}

export function ActionEmail({
  actionLabel,
  actionUrl,
  body,
  brand,
  children,
  eyebrow,
  expiry,
  footer,
  greeting,
  ignoreNotice,
  linkFallback,
  locale,
  logoUrl,
  preview,
  title,
}: ActionEmailProps) {
  return (
    <EmailLayout
      brand={brand}
      locale={locale}
      logoUrl={logoUrl}
      preview={preview}
      footer={footer}
    >
      <Text style={eyebrowStyle}>{eyebrow}</Text>
      <Heading as="h1" style={headingStyle}>
        {title}
      </Heading>
      <Text style={textStyle}>{greeting}</Text>
      <Text style={{ ...textStyle, marginBottom: "18px" }}>{body}</Text>
      <Text style={mutedTextStyle}>{ignoreNotice}</Text>
      {children}
      <Section style={{ margin: "36px 0 0" }}>
        <Button href={actionUrl} style={buttonStyle}>
          {actionLabel}
        </Button>
      </Section>
      <Section
        style={{
          borderTop: `1px solid ${palette.border}`,
          margin: "40px 0 0",
          paddingTop: "24px",
        }}
      >
        <Text style={mutedTextStyle}>{expiry}</Text>
        <Text style={{ ...mutedTextStyle, margin: "16px 0 4px" }}>
          {linkFallback}
        </Text>
        <Link href={actionUrl} style={inlineLinkStyle}>
          {actionUrl}
        </Link>
      </Section>
    </EmailLayout>
  )
}
