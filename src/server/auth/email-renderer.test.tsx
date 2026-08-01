// @vitest-environment node

import { describe, expect, it } from "vitest"

import type { AuthEmailInput } from "./email-renderer"
import { renderAuthEmail } from "./email-renderer"

const baseInput = {
  actionUrl:
    "https://roundnet.example/api/auth/verify-email?token=safe-token&callbackURL=%2Fverify-email",
  expiresAt: "2026-08-04T18:30:00.000Z",
  logoUrl: "https://roundnet.example/logo.png",
  recipientName: "Alex Morgan",
} as const

describe("React Email auth templates", () => {
  const cases: Array<{
    expectedSubject: Record<"de" | "en", string>
    input: AuthEmailInput
  }> = [
    {
      expectedSubject: {
        de: "E-Mail-Adresse bestätigen",
        en: "Confirm your email address",
      },
      input: { ...baseInput, kind: "verification", locale: "de" },
    },
    {
      expectedSubject: {
        de: "Passwort zurücksetzen",
        en: "Reset your password",
      },
      input: { ...baseInput, kind: "password-reset", locale: "de" },
    },
    {
      expectedSubject: {
        de: "Einladung zu Roundnet Bielefeld",
        en: "Invitation to Roundnet Bielefeld",
      },
      input: {
        ...baseInput,
        inviterName: "Mara Klein",
        kind: "invitation",
        locale: "de",
        organizationName: "Roundnet Bielefeld",
        role: "manager",
      },
    },
  ]

  for (const testCase of cases) {
    for (const locale of ["de", "en"] as const) {
      it(`rendert ${testCase.input.kind} vollständig auf ${locale}`, async () => {
        const rendered = await renderAuthEmail({
          ...testCase.input,
          locale,
        })

        expect(rendered.subject).toBe(testCase.expectedSubject[locale])
        expect(rendered.html).toMatch(new RegExp(`<html[^>]*lang="${locale}"`))
        expect(rendered.html).not.toMatch(
          new RegExp(`<body[^>]*lang="${locale === "de" ? "en" : "de"}"`)
        )
        expect(rendered.html).toContain(baseInput.logoUrl)
        expect(rendered.html).toContain("safe-token")
        expect(rendered.text).toContain("safe-token")
        expect(rendered.html).not.toMatch(/\{[a-zA-Z]+\}/)
        expect(rendered.text).not.toContain("undefined")
      })
    }
  }

  it("escaped Namen und Vereinswerte im HTML und bereinigt den Betreff", async () => {
    const rendered = await renderAuthEmail({
      ...baseInput,
      inviterName: 'Mara"><script>alert(1)</script>',
      kind: "invitation",
      locale: "de",
      organizationName:
        "Roundnet Bielefeld\r\nBcc: attacker@example.com <unsafe>",
      role: "admin",
    })

    expect(rendered.html).not.toContain("<script>alert(1)</script>")
    expect(rendered.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
    expect(rendered.html).toContain("&lt;unsafe&gt;")
    expect(rendered.subject).not.toMatch(/[\r\n]/)
    expect(rendered.subject).toContain(
      "Roundnet Bielefeld Bcc: attacker@example.com"
    )
  })

  it("weist ausführbare oder ungültige Links zurück", async () => {
    await expect(
      renderAuthEmail({
        ...baseInput,
        actionUrl: "javascript:alert(1)",
        kind: "verification",
        locale: "de",
      })
    ).rejects.toThrow("Email URLs must use HTTP or HTTPS.")

    await expect(
      renderAuthEmail({
        ...baseInput,
        expiresAt: "not-a-date",
        kind: "verification",
        locale: "de",
      })
    ).rejects.toThrow("Email expiry must be a valid ISO timestamp.")
  })
})
