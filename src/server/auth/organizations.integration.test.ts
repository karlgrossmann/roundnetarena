// @vitest-environment node

import { and, eq, inArray } from "drizzle-orm"
import { afterAll, describe, expect, it, vi } from "vitest"

import { closeAuthDb, getAuthDb } from "@/server/db/auth-client"
import { invitation, organization, user } from "@/server/db/auth-schema"
import { closeDb, getDb } from "@/server/db/client"
import { leagueSettings, leagues, playerPools } from "@/server/db/schema"
import { provisionOrganizationDefaults } from "@/server/repositories/organization-onboarding"

import { createAuth } from "./auth"

const databaseDescribe = process.env.DATABASE_URL ? describe : describe.skip
const origin = "http://localhost:3000"
let requestNumber = 0

process.env.BETTER_AUTH_SECRET ??=
  "organization-test-secret-with-at-least-32-characters"
process.env.BETTER_AUTH_URL ??= origin

interface TestAccount {
  cookie: string
  email: string
}

interface CapturedEmails {
  verification: Map<string, string>
}

function createTestAuth(captured: CapturedEmails) {
  return createAuth(
    {
      verification: (email, url) => captured.verification.set(email, url),
      passwordReset: () => undefined,
      invitation: () => undefined,
    },
    { allowDirectOrganizationMutations: true }
  )
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
  requestNumber += 1
  const headers = new Headers({
    origin,
    "x-forwarded-for": `2001:db8:${crypto.randomUUID().slice(0, 4)}::${requestNumber}`,
  })
  if (options.body) headers.set("content-type", "application/json")
  if (options.cookie) headers.set("cookie", options.cookie)

  return auth.handler(
    new Request(
      pathOrUrl.startsWith("http")
        ? pathOrUrl
        : `${origin}/api/auth${pathOrUrl}`,
      {
        method: options.method ?? (options.body ? "POST" : "GET"),
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        redirect: "manual",
      }
    )
  )
}

function responseCookies(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(";", 1)[0])
    .join("; ")
}

async function createAccount(
  auth: ReturnType<typeof createAuth>,
  captured: CapturedEmails,
  label: string
): Promise<TestAccount> {
  const email = `${label.toLowerCase()}-${crypto.randomUUID()}@example.com`
  const password = "correct horse battery staple"
  const registration = await authRequest(auth, "/sign-up/email", {
    body: {
      name: label,
      email,
      password,
      callbackURL: "/verify-email?verified=1",
    },
  })
  if (registration.status !== 200) {
    throw new Error(
      `Registration failed (${registration.status}): ${await registration.text()}`
    )
  }
  await vi.waitFor(() => {
    expect(captured.verification.has(email)).toBe(true)
  })
  const verificationUrl = captured.verification.get(email)
  if (!verificationUrl) throw new Error("Verification email is missing.")
  await authRequest(auth, verificationUrl)
  const login = await authRequest(auth, "/sign-in/email", {
    body: { email, password },
  })
  return { email, cookie: responseCookies(login) }
}

afterAll(async () => {
  await Promise.all([closeAuthDb(), closeDb()])
})

// Four registrations with scrypt hashing plus roughly 25 auth requests against the
// real database exceed Vitest's 5-second default.
const scenarioTimeout = 30_000

databaseDescribe("Better Auth organizations", () => {
  it(
    "provisions once and enforces roles and invitations",
    async () => {
      const captured: CapturedEmails = { verification: new Map() }
      const auth = createTestAuth(captured)
      const owner = await createAccount(auth, captured, "Owner")
      const admin = await createAccount(auth, captured, "Admin")
      const manager = await createAccount(auth, captured, "Manager")
      const guest = await createAccount(auth, captured, "Guest")
      const accounts = [owner, admin, manager, guest]
      const slug = `club-${crypto.randomUUID()}`
      let organizationId = ""
      let additionalOrganizationIds: string[] = []

      try {
        const createdResponse = await authRequest(
          auth,
          "/organization/create",
          {
            cookie: owner.cookie,
            body: { name: "Integration Club", slug },
          }
        )
        expect(createdResponse.status).toBe(200)
        const created = (await createdResponse.json()) as {
          id: string
          members: Array<{ id: string }>
        }
        organizationId = created.id

        await provisionOrganizationDefaults({
          id: organizationId,
          name: "Integration Club",
          slug,
        })
        await provisionOrganizationDefaults({
          id: organizationId,
          name: "Integration Club",
          slug,
        })
        const [leagueRows, settingsRows, poolRows] = await Promise.all([
          getDb()
            .select()
            .from(leagues)
            .where(eq(leagues.id, `league_${organizationId}`)),
          getDb()
            .select()
            .from(leagueSettings)
            .where(eq(leagueSettings.leagueId, `league_${organizationId}`)),
          getDb()
            .select()
            .from(playerPools)
            .where(eq(playerPools.leagueId, `league_${organizationId}`)),
        ])
        expect([
          leagueRows.length,
          settingsRows.length,
          poolRows.length,
        ]).toEqual([1, 1, 1])

        const adminInvitation = await invite(
          auth,
          owner.cookie,
          organizationId,
          admin.email,
          "admin"
        )
        expect(
          (
            await authRequest(auth, "/organization/accept-invitation", {
              cookie: admin.cookie,
              body: { invitationId: adminInvitation.id },
            })
          ).status
        ).toBe(200)

        const managerInvitation = await invite(
          auth,
          admin.cookie,
          organizationId,
          manager.email,
          "manager"
        )
        const acceptedManager = await authRequest(
          auth,
          "/organization/accept-invitation",
          {
            cookie: manager.cookie,
            body: { invitationId: managerInvitation.id },
          }
        )
        expect(acceptedManager.status).toBe(200)
        const managerMember = (
          (await acceptedManager.json()) as { member: { id: string } }
        ).member

        const deniedInvite = await authRequest(
          auth,
          "/organization/invite-member",
          {
            cookie: manager.cookie,
            body: {
              organizationId,
              email: guest.email,
              role: "manager",
            },
          }
        )
        expect(deniedInvite.status).toBe(403)

        const guestInvitation = await invite(
          auth,
          admin.cookie,
          organizationId,
          guest.email,
          "manager"
        )
        const wrongRecipient = await authRequest(
          auth,
          "/organization/accept-invitation",
          {
            cookie: manager.cookie,
            body: { invitationId: guestInvitation.id },
          }
        )
        expect(wrongRecipient.status).toBe(403)
        expect(
          (
            await authRequest(auth, "/organization/cancel-invitation", {
              cookie: admin.cookie,
              body: { invitationId: guestInvitation.id },
            })
          ).status
        ).toBe(200)
        expect(
          (
            await authRequest(auth, "/organization/accept-invitation", {
              cookie: guest.cookie,
              body: { invitationId: guestInvitation.id },
            })
          ).status
        ).toBe(400)

        await getAuthDb()
          .update(invitation)
          .set({ createdAt: new Date(Date.now() - 181 * 24 * 60 * 60 * 1000) })
          .where(eq(invitation.id, guestInvitation.id))
        const expiredInvitation = await invite(
          auth,
          owner.cookie,
          organizationId,
          guest.email,
          "manager"
        )
        expect(
          await getAuthDb()
            .select({ id: invitation.id })
            .from(invitation)
            .where(eq(invitation.id, guestInvitation.id))
        ).toEqual([])
        await getAuthDb()
          .update(invitation)
          .set({ expiresAt: new Date(Date.now() - 60_000) })
          .where(
            and(
              eq(invitation.id, expiredInvitation.id),
              eq(invitation.organizationId, organizationId)
            )
          )
        expect(
          (
            await authRequest(auth, "/organization/accept-invitation", {
              cookie: guest.cookie,
              body: { invitationId: expiredInvitation.id },
            })
          ).status
        ).toBe(400)

        expect(
          (
            await authRequest(auth, "/organization/update-member-role", {
              cookie: owner.cookie,
              body: {
                organizationId,
                memberId: created.members[0].id,
                role: "admin",
              },
            })
          ).status
        ).toBe(400)

        expect(
          (
            await authRequest(auth, "/organization/remove-member", {
              cookie: admin.cookie,
              body: {
                organizationId,
                memberIdOrEmail: managerMember.id,
              },
            })
          ).status
        ).toBe(200)
        const organizationsAfterRemoval = await authRequest(
          auth,
          "/organization/list",
          { cookie: manager.cookie }
        )
        expect(await organizationsAfterRemoval.json()).toEqual([])

        for (const index of [1, 2, 3]) {
          const additional = await authRequest(auth, "/organization/create", {
            cookie: admin.cookie,
            body: {
              name: `Admin Club ${index}`,
              slug: `admin-club-${index}-${crypto.randomUUID()}`,
            },
          })
          expect(additional.status).toBe(200)
          const createdAdditional = (await additional.json()) as { id: string }
          additionalOrganizationIds = [
            ...additionalOrganizationIds,
            createdAdditional.id,
          ]
        }
        expect(
          (
            await authRequest(auth, "/organization/create", {
              cookie: admin.cookie,
              body: {
                name: "Admin Club 4",
                slug: `admin-club-4-${crypto.randomUUID()}`,
              },
            })
          ).status
        ).toBe(403)
      } finally {
        const organizationIds = [
          organizationId,
          ...additionalOrganizationIds,
        ].filter(Boolean)
        const leagueIds = (
          await getDb()
            .select({ id: leagues.id })
            .from(leagues)
            .where(inArray(leagues.organizationId, organizationIds))
        ).map((league) => league.id)
        if (leagueIds.length > 0) {
          await getDb()
            .delete(leagueSettings)
            .where(inArray(leagueSettings.leagueId, leagueIds))
          await getDb()
            .delete(playerPools)
            .where(inArray(playerPools.leagueId, leagueIds))
          await getDb().delete(leagues).where(inArray(leagues.id, leagueIds))
        }
        await Promise.all(
          organizationIds.map((id) =>
            getAuthDb().delete(organization).where(eq(organization.id, id))
          )
        )
        await Promise.all(
          accounts.map((account) =>
            getAuthDb().delete(user).where(eq(user.email, account.email))
          )
        )
      }
    },
    scenarioTimeout
  )
})

async function invite(
  auth: ReturnType<typeof createAuth>,
  cookie: string,
  organizationId: string,
  email: string,
  role: "admin" | "manager"
): Promise<{ id: string }> {
  const response = await authRequest(auth, "/organization/invite-member", {
    cookie,
    body: { organizationId, email, role },
  })
  expect(response.status).toBe(200)
  return response.json() as Promise<{ id: string }>
}
