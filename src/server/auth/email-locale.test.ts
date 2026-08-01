// @vitest-environment node

import { describe, expect, it } from "vitest"

import {
  applyEmailLocaleToRequest,
  localizeEmailActionUrl,
  persistEmailLocale,
  resolveEmailLocale,
} from "./email-locale"

describe("email locale", () => {
  it("prefers the cookie, then the browser language, then German", () => {
    expect(
      resolveEmailLocale(
        new Request("https://roundnet.example/api/auth/sign-up", {
          headers: {
            "accept-language": "de",
            cookie: "PARAGLIDE_LOCALE=en",
          },
        })
      )
    ).toBe("en")
    expect(
      resolveEmailLocale(
        new Request("https://roundnet.example/api/auth/sign-up", {
          headers: { "accept-language": "en-US,en;q=0.9" },
        })
      )
    ).toBe("en")
    expect(resolveEmailLocale()).toBe("de")
  })

  it("localizes direct and nested Better Auth targets", () => {
    const invitation = new URL(
      localizeEmailActionUrl(
        "https://roundnet.example/accept-invitation?id=invitation-id",
        "en"
      )
    )
    expect(invitation.searchParams.get("id")).toBe("invitation-id")
    expect(invitation.searchParams.get("lang")).toBe("en")

    const verification = new URL(
      localizeEmailActionUrl(
        "https://roundnet.example/api/auth/verify-email?token=secret&callbackURL=%2Fverify-email%3Fverified%3D1",
        "en"
      )
    )
    expect(verification.searchParams.get("token")).toBe("secret")
    expect(verification.searchParams.get("callbackURL")).toBe(
      "/verify-email?verified=1&lang=en"
    )
  })

  it("applies the link locale request-safely and persists it as a cookie", async () => {
    const original = new Request(
      "https://roundnet.example/accept-invitation?id=invite&lang=en",
      { headers: { cookie: "session=safe; PARAGLIDE_LOCALE=de" } }
    )
    const localized = applyEmailLocaleToRequest(original)

    expect(localized.locale).toBe("en")
    expect(localized.request.headers.get("cookie")).toBe(
      "session=safe; PARAGLIDE_LOCALE=en"
    )

    const response = persistEmailLocale(
      new Response("ok"),
      original.url,
      localized.locale
    )
    expect(response.headers.get("set-cookie")).toContain("PARAGLIDE_LOCALE=en")
    expect(response.headers.get("set-cookie")).toContain("SameSite=Lax")
    expect(response.headers.get("set-cookie")).toContain("Secure")
    await expect(response.text()).resolves.toBe("ok")
  })

  it("supports request proxies from dev SSR", () => {
    const original = new Request(
      "https://roundnet.example/verify-email?verified=1&lang=de",
      { headers: { cookie: "PARAGLIDE_LOCALE=en" } }
    )
    const proxied = new Proxy(original, {
      get(target, property) {
        const value = Reflect.get(target, property, target)
        return typeof value === "function" ? value.bind(target) : value
      },
    })

    expect(() => new Request(proxied)).toThrow(
      "Cannot read private member #state"
    )

    const localized = applyEmailLocaleToRequest(proxied)

    expect(localized.locale).toBe("de")
    expect(localized.request.headers.get("cookie")).toBe("PARAGLIDE_LOCALE=de")
    expect(original.headers.get("cookie")).toBe("PARAGLIDE_LOCALE=en")
  })

  it("ignores unknown locale parameters", () => {
    const request = new Request("https://roundnet.example/verify-email?lang=fr")
    const localized = applyEmailLocaleToRequest(request)
    expect(localized.locale).toBeUndefined()
    expect(localized.request).toBe(request)
  })
})
