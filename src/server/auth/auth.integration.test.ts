// @vitest-environment node

import { eq } from "drizzle-orm"
import { afterAll, describe, expect, it } from "vitest"

import { closeAuthDb, getAuthDb } from "@/server/db/auth-client"
import { user, verification } from "@/server/db/auth-schema"

import { createAuth } from "./auth"

const databaseDescribe = process.env.DATABASE_URL ? describe : describe.skip
const origin = "http://localhost:3000"
let requestNumber = 0

process.env.BETTER_AUTH_SECRET ??=
  "integration-test-secret-with-at-least-32-characters"
process.env.BETTER_AUTH_URL ??= origin

interface CapturedEmails {
  verification: string[]
  passwordReset: string[]
}

function createTestAuth(capturedEmails: CapturedEmails) {
  return createAuth({
    verification: (_email, url) => capturedEmails.verification.push(url),
    passwordReset: (_email, url) => capturedEmails.passwordReset.push(url),
    invitation: () => undefined,
  })
}

function authRequest(
  auth: ReturnType<typeof createAuth>,
  pathOrUrl: string,
  options: {
    body?: Record<string, unknown>
    cookie?: string
    method?: "GET" | "POST"
  } = {}
): Promise<Response> {
  const method = options.method ?? (options.body ? "POST" : "GET")
  requestNumber += 1
  const headers = new Headers({
    origin,
    "x-forwarded-for": `192.0.2.${(requestNumber % 254) + 1}`,
  })
  if (options.body) headers.set("content-type", "application/json")
  if (options.cookie) headers.set("cookie", options.cookie)

  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${origin}/api/auth${pathOrUrl}`

  return auth.handler(
    new Request(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      redirect: "manual",
    })
  )
}

function responseCookies(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(";", 1)[0])
    .join("; ")
}

afterAll(async () => {
  await closeAuthDb()
})

databaseDescribe("Better Auth", () => {
  it("runs through registration, verification, session and logout", async () => {
    const suffix = crypto.randomUUID()
    const email = `auth-${suffix}@example.com`
    const password = "correct horse battery staple"
    const capturedEmails: CapturedEmails = {
      verification: [],
      passwordReset: [],
    }
    const auth = createTestAuth(capturedEmails)

    try {
      const registration = await authRequest(auth, "/sign-up/email", {
        body: {
          name: "Auth Test",
          email,
          password,
          callbackURL: "/verify-email?verified=1",
        },
      })
      expect(registration.status).toBe(200)
      expect(capturedEmails.verification).toHaveLength(1)

      const loginBeforeVerification = await authRequest(
        auth,
        "/sign-in/email",
        {
          body: { email, password },
        }
      )
      expect(loginBeforeVerification.status).toBe(403)
      expect(responseCookies(loginBeforeVerification)).toBe("")

      const verificationResponse = await authRequest(
        auth,
        capturedEmails.verification[0]
      )
      expect(verificationResponse.status).toBe(302)
      expect(verificationResponse.headers.get("location")).toBe(
        "/verify-email?verified=1"
      )

      const login = await authRequest(auth, "/sign-in/email", {
        body: { email, password },
      })
      expect(login.status).toBe(200)
      const cookie = responseCookies(login)
      expect(cookie).toContain("better-auth.session_token=")

      const session = await authRequest(auth, "/get-session", { cookie })
      expect(session.status).toBe(200)
      await expect(session.json()).resolves.toMatchObject({
        user: { email, emailVerified: true },
      })

      const logout = await authRequest(auth, "/sign-out", {
        method: "POST",
        cookie,
      })
      expect(logout.status).toBe(200)

      const sessionAfterLogout = await authRequest(auth, "/get-session", {
        cookie: responseCookies(logout),
      })
      expect(await sessionAfterLogout.json()).toBeNull()
    } finally {
      await removeUser(email)
    }
  })

  it("resets passwords neutrally and only once", async () => {
    const suffix = crypto.randomUUID()
    const email = `reset-${suffix}@example.com`
    const oldPassword = "old correct horse battery"
    const newPassword = "new correct horse battery"
    const capturedEmails: CapturedEmails = {
      verification: [],
      passwordReset: [],
    }
    const auth = createTestAuth(capturedEmails)

    try {
      await authRequest(auth, "/sign-up/email", {
        body: {
          name: "Reset Test",
          email,
          password: oldPassword,
          callbackURL: "/verify-email?verified=1",
        },
      })
      await authRequest(auth, capturedEmails.verification[0])

      const unknown = await authRequest(auth, "/request-password-reset", {
        body: {
          email: `unknown-${suffix}@example.com`,
          redirectTo: "/reset-password",
        },
      })
      const known = await authRequest(auth, "/request-password-reset", {
        body: { email, redirectTo: "/reset-password" },
      })
      expect(unknown.status).toBe(200)
      expect(known.status).toBe(200)
      expect(await known.clone().json()).toEqual(await unknown.json())
      expect(capturedEmails.passwordReset).toHaveLength(1)

      const resetCallback = await authRequest(
        auth,
        capturedEmails.passwordReset[0]
      )
      expect(resetCallback.status).toBe(302)
      const resetLocation = resetCallback.headers.get("location")
      expect(resetLocation).toBeTruthy()
      const token = new URL(resetLocation!).searchParams.get("token")
      expect(token).toBeTruthy()

      const reset = await authRequest(auth, "/reset-password", {
        body: { token, newPassword },
      })
      expect(reset.status).toBe(200)

      const repeatedReset = await authRequest(auth, "/reset-password", {
        body: { token, newPassword: "another secure replacement" },
      })
      expect(repeatedReset.status).toBe(400)

      const oldLogin = await authRequest(auth, "/sign-in/email", {
        body: { email, password: oldPassword },
      })
      expect(oldLogin.status).toBe(401)

      const newLogin = await authRequest(auth, "/sign-in/email", {
        body: { email, password: newPassword },
      })
      expect(newLogin.status).toBe(200)

      const [databaseUser] = await getAuthDb()
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email))
      const expiredToken = `expired-${suffix}`
      await getAuthDb()
        .insert(verification)
        .values({
          identifier: `reset-password:${expiredToken}`,
          value: databaseUser.id,
          expiresAt: new Date(Date.now() - 60_000),
        })
      const expiredCallback = await authRequest(
        auth,
        `/reset-password/${expiredToken}?callbackURL=${encodeURIComponent(
          "/reset-password"
        )}`
      )
      expect(expiredCallback.status).toBe(302)
      expect(expiredCallback.headers.get("location")).toContain(
        "error=INVALID_TOKEN"
      )
    } finally {
      await removeUser(email)
    }
  })
})

async function removeUser(email: string): Promise<void> {
  const databaseUser = (
    await getAuthDb()
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
  ).at(0)
  if (!databaseUser) return

  await getAuthDb()
    .delete(verification)
    .where(eq(verification.value, databaseUser.id))
  await getAuthDb().delete(user).where(eq(user.id, databaseUser.id))
}
