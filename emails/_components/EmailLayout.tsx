import type { ReactNode } from "react"
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "react-email"

import type { EmailLocale } from "../_lib/copy"
import {
  bodyStyle,
  containerStyle,
  contentStyle,
  footerStyle,
  headerStyle,
  mutedTextStyle,
  valueStyle,
} from "./styles"

interface EmailLayoutProps {
  brand: string
  children: ReactNode
  footer: string
  locale: EmailLocale
  logoUrl: string
  preview: string
}

export function EmailLayout({
  brand,
  children,
  footer,
  locale,
  logoUrl,
  preview,
}: EmailLayoutProps) {
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{preview}</Preview>
      <Body lang={locale} style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            {/* The logo is a square lockup that carries the wordmark, so it
                needs more room than the bare 32px mark of the original. */}
            <Img
              src={logoUrl}
              alt={brand}
              width="72"
              height="72"
              style={{ display: "block" }}
            />
          </Section>
          <Section style={contentStyle}>{children}</Section>
          <Section style={footerStyle}>
            <Text style={valueStyle}>{brand}</Text>
            <Text style={{ ...mutedTextStyle, marginTop: "4px" }}>
              {footer}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
