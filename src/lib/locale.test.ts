import { describe, expect, it } from "vitest"

import { paraglideMiddleware } from "@/paraglide/server.js"
import {
  extractLocaleFromRequest,
  getLocale,
  setLocale,
} from "@/paraglide/runtime.js"
import { documentLocaleAttributes } from "./locale"

function request(headers: HeadersInit): Request {
  return new Request("https://roundnet.test/login", { headers })
}

describe("locale strategy", () => {
  it("uses the supported browser language on the first request", () => {
    expect(
      extractLocaleFromRequest(request({ "accept-language": "en-US,en;q=0.9" }))
    ).toBe("en")
  })

  it("lets the locale cookie override the browser language", () => {
    expect(
      extractLocaleFromRequest(
        request({
          "accept-language": "en",
          cookie: "PARAGLIDE_LOCALE=de",
        })
      )
    ).toBe("de")
  })

  it("falls back to German for unsupported browser languages and cookies", () => {
    expect(
      extractLocaleFromRequest(
        request({
          "accept-language": "fr-FR",
          cookie: "PARAGLIDE_LOCALE=unsupported",
        })
      )
    ).toBe("de")
  })

  it("persists a manual selection in the locale cookie for later requests", async () => {
    await setLocale("en", { reload: false })

    expect(document.cookie).toContain("PARAGLIDE_LOCALE=en")
    expect(extractLocaleFromRequest(request({ cookie: document.cookie }))).toBe(
      "en"
    )
  })

  it("keeps locale and document direction request-scoped during SSR", async () => {
    const render = (language: "de" | "en") =>
      paraglideMiddleware(
        request({ "accept-language": language }),
        async () => {
          await Promise.resolve()
          return Response.json({
            locale: getLocale(),
            attributes: documentLocaleAttributes(),
          })
        }
      )

    const [english, german] = await Promise.all([render("en"), render("de")])

    await expect(english.json()).resolves.toEqual({
      locale: "en",
      attributes: { lang: "en", dir: "ltr" },
    })
    await expect(german.json()).resolves.toEqual({
      locale: "de",
      attributes: { lang: "de", dir: "ltr" },
    })
  })
})
