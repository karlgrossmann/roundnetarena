import type { CSSProperties } from "react"

/**
 * Neutral email design tokens in the spirit of React Email's "Protocol"
 * template: a white surface on a light grey page, near-black type, hairline
 * borders and a solid dark button. No brand colour is used — colour renders
 * unpredictably across mail clients and buys nothing here.
 */
export const palette = {
  /** Page background around the card. */
  background: "#f2f2f2",
  /** Hairline borders and rules. */
  border: "#e6e6e6",
  /** Card surface. */
  card: "#ffffff",
  /** Primary type and button fill. */
  ink: "#131313",
  /** Type on top of `ink`. */
  inkInverted: "#ffffff",
  /** Secondary type. */
  muted: "#5a5a5a",
  /** Fine print and labels. */
  subtle: "#8a8a8a",
} as const

export const fontFamily =
  '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'

/** Headline face. Arial Narrow keeps the condensed look without a webfont. */
export const headingFontFamily =
  '"IBM Plex Sans Condensed", "Arial Narrow", Arial, sans-serif'

/** Horizontal padding shared by header, content and footer. */
const gutter = "32px"

export const bodyStyle: CSSProperties = {
  backgroundColor: palette.background,
  color: palette.ink,
  fontFamily,
  margin: 0,
  padding: "24px 0",
}

export const containerStyle: CSSProperties = {
  backgroundColor: palette.card,
  margin: "0 auto",
  maxWidth: "640px",
  width: "100%",
}

export const headerStyle: CSSProperties = {
  padding: `24px ${gutter}`,
}

export const contentStyle: CSSProperties = {
  padding: `56px ${gutter} 64px`,
}

export const footerStyle: CSSProperties = {
  borderTop: `1px solid ${palette.border}`,
  padding: `40px ${gutter} 48px`,
}

export const eyebrowStyle: CSSProperties = {
  color: palette.subtle,
  fontSize: "11px",
  fontWeight: 400,
  letterSpacing: "1.2px",
  lineHeight: "16px",
  margin: "0 0 20px",
  textTransform: "uppercase",
}

export const headingStyle: CSSProperties = {
  color: palette.ink,
  fontFamily: headingFontFamily,
  fontSize: "40px",
  fontWeight: 500,
  letterSpacing: "-0.6px",
  lineHeight: "42px",
  margin: "0 0 32px",
  textTransform: "uppercase",
}

export const textStyle: CSSProperties = {
  color: palette.muted,
  fontSize: "14px",
  letterSpacing: "0.3px",
  lineHeight: "22px",
  margin: "0 0 12px",
}

export const mutedTextStyle: CSSProperties = {
  color: palette.subtle,
  fontSize: "13px",
  letterSpacing: "0.2px",
  lineHeight: "20px",
  margin: 0,
}

export const labelStyle: CSSProperties = {
  color: palette.subtle,
  fontSize: "11px",
  fontWeight: 400,
  letterSpacing: "1.2px",
  lineHeight: "16px",
  margin: "0 0 4px",
  textTransform: "uppercase",
}

export const valueStyle: CSSProperties = {
  color: palette.ink,
  fontSize: "15px",
  fontWeight: 500,
  letterSpacing: "-0.075px",
  lineHeight: "22px",
  margin: 0,
}

export const buttonStyle: CSSProperties = {
  backgroundColor: palette.ink,
  color: palette.inkInverted,
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 500,
  letterSpacing: "-0.075px",
  padding: "14px 20px",
  textAlign: "center",
  textDecoration: "none",
}

export const inlineLinkStyle: CSSProperties = {
  color: palette.ink,
  fontSize: "13px",
  letterSpacing: "0.2px",
  lineHeight: "20px",
  overflowWrap: "anywhere",
  textDecoration: "underline",
}
