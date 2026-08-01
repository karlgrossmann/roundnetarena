import "@tanstack/react-start/server-only"

import {
  cookieMaxAge,
  cookieName,
  extractLocaleFromRequest,
} from "@/paraglide/runtime.js"
import type { Locale } from "@/paraglide/runtime.js"

const EMAIL_LOCALE_PARAMETER = "lang"
const SUPPORTED_EMAIL_LOCALES = new Set<Locale>(["de", "en"])

export function resolveEmailLocale(request?: Request): Locale {
  return request ? extractLocaleFromRequest(request) : "de"
}

export function localizeEmailActionUrl(value: string, locale: Locale): string {
  const actionUrl = httpUrl(value)
  const callback = actionUrl.searchParams.get("callbackURL")

  if (callback) {
    const callbackUrl = new URL(callback, actionUrl.origin)
    callbackUrl.searchParams.set(EMAIL_LOCALE_PARAMETER, locale)
    actionUrl.searchParams.set(
      "callbackURL",
      isAbsoluteHttpUrl(callback)
        ? callbackUrl.toString()
        : `${callbackUrl.pathname}${callbackUrl.search}${callbackUrl.hash}`
    )
  } else {
    actionUrl.searchParams.set(EMAIL_LOCALE_PARAMETER, locale)
  }

  return actionUrl.toString()
}

export interface EmailLocaleRequest {
  locale?: Locale
  request: Request
}

export function applyEmailLocaleToRequest(
  request: Request
): EmailLocaleRequest {
  const url = new URL(request.url)
  const requestedLocale = url.searchParams.get(EMAIL_LOCALE_PARAMETER)
  if (!isEmailLocale(requestedLocale)) return { request }

  // TanStack Start can provide a Request proxy in dev SSR. Passing that proxy
  // to Node's Request constructor makes Undici access its private #state field
  // on the proxy and throw. Cloning through the request's own implementation
  // keeps the correct private state and also leaves the original request intact.
  const localizedRequest = request.clone()
  localizedRequest.headers.set(
    "cookie",
    localeCookieHeader(localizedRequest.headers.get("cookie"), requestedLocale)
  )
  return {
    locale: requestedLocale,
    request: localizedRequest,
  }
}

export function persistEmailLocale(
  response: Response,
  requestUrl: string,
  locale?: Locale
): Response {
  if (!locale) return response

  const headers = new Headers(response.headers)
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : ""
  headers.append(
    "Set-Cookie",
    `${cookieName}=${locale}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax${secure}`
  )
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}

function httpUrl(value: string): URL {
  const url = new URL(value)
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Email action URLs must use HTTP or HTTPS.")
  }
  return url
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    httpUrl(value)
    return true
  } catch {
    return false
  }
}

function isEmailLocale(value: string | null): value is Locale {
  return value !== null && SUPPORTED_EMAIL_LOCALES.has(value as Locale)
}

function localeCookieHeader(
  currentHeader: string | null,
  locale: Locale
): string {
  const remainingCookies = (currentHeader ?? "")
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(
      (cookie) => cookie.length > 0 && !cookie.startsWith(`${cookieName}=`)
    )
  return [...remainingCookies, `${cookieName}=${locale}`].join("; ")
}
