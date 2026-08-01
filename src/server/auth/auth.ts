import "@tanstack/react-start/server-only"

import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { betterAuth } from "better-auth/minimal"
import { organization } from "better-auth/plugins/organization"
import { tanstackStartCookies } from "better-auth/tanstack-start"

import { APP_NAME } from "@/lib/brand"
import {
  organizationAccessControl,
  organizationRoles,
} from "@/lib/organization-permissions"
import { getAuthDb } from "@/server/db/auth-client"
import * as authSchema from "@/server/db/auth-schema"
import { getAuthEnvironment } from "@/server/config"
import {
  countOwnedOrganizationsForUser,
  pruneOrganizationInvitationHistory,
} from "@/server/repositories/auth-organizations"
import {
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "./email"
import type { EmailRole } from "../../../emails/_lib/copy"
import {
  INVITATION_EMAIL_EXPIRES_IN_SECONDS,
  PASSWORD_RESET_EMAIL_EXPIRES_IN_SECONDS,
  VERIFICATION_EMAIL_EXPIRES_IN_SECONDS,
} from "./email-settings"

const DAY_IN_SECONDS = 24 * 60 * 60
const AUDITED_ORGANIZATION_MUTATION_PATHS = [
  "/organization/accept-invitation",
  "/organization/cancel-invitation",
  "/organization/invite-member",
  "/organization/leave",
  "/organization/reject-invitation",
  "/organization/remove-member",
  "/organization/update-member-role",
] as const

export interface AuthEmailDelivery {
  verification: (
    email: string,
    url: string,
    recipientName?: string,
    request?: Request
  ) => void
  passwordReset: (
    email: string,
    url: string,
    recipientName?: string,
    request?: Request
  ) => void
  invitation: (
    email: string,
    organizationName: string,
    inviterName: string,
    url: string,
    role: EmailRole,
    expiresAt: Date,
    request?: Request
  ) => void
}

const defaultEmailDelivery: AuthEmailDelivery = {
  verification: sendVerificationEmail,
  passwordReset: sendPasswordResetEmail,
  invitation: sendInvitationEmail,
}

export function createAuth(
  emailDelivery: AuthEmailDelivery = defaultEmailDelivery,
  options: { allowDirectOrganizationMutations?: boolean } = {}
) {
  const environment = getAuthEnvironment()

  return betterAuth({
    appName: APP_NAME,
    baseURL: environment.baseUrl,
    secret: environment.secret,
    trustedOrigins: environment.trustedOrigins,
    disabledPaths: options.allowDirectOrganizationMutations
      ? []
      : [...AUDITED_ORGANIZATION_MUTATION_PATHS],
    database: drizzleAdapter(getAuthDb(), {
      provider: "pg",
      schema: authSchema,
      transaction: true,
    }),
    advanced: {
      database: {
        generateId: "uuid",
      },
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: PASSWORD_RESET_EMAIL_EXPIRES_IN_SECONDS,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }, request) => {
        emailDelivery.passwordReset(user.email, url, user.name, request)
      },
    },
    emailVerification: {
      expiresIn: VERIFICATION_EMAIL_EXPIRES_IN_SECONDS,
      sendOnSignUp: true,
      sendOnSignIn: false,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }, request) => {
        emailDelivery.verification(user.email, url, user.name, request)
      },
    },
    session: {
      expiresIn: 30 * DAY_IN_SECONDS,
      updateAge: DAY_IN_SECONDS,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 10,
      max: 100,
    },
    plugins: [
      organization({
        ac: organizationAccessControl,
        roles: organizationRoles,
        creatorRole: "owner",
        allowUserToCreateOrganization: async (user) =>
          (await countOwnedOrganizationsForUser(user.id)) < 3,
        invitationLimit: 50,
        invitationExpiresIn: INVITATION_EMAIL_EXPIRES_IN_SECONDS,
        cancelPendingInvitationsOnReInvite: true,
        requireEmailVerificationOnInvitation: true,
        disableOrganizationDeletion: true,
        organizationHooks: {
          afterCreateInvitation: async ({ organization: targetOrganization }) =>
            pruneOrganizationInvitationHistory(
              targetOrganization.id,
              new Date()
            ),
          afterAcceptInvitation: async ({ organization: targetOrganization }) =>
            pruneOrganizationInvitationHistory(
              targetOrganization.id,
              new Date()
            ),
          afterRejectInvitation: async ({ organization: targetOrganization }) =>
            pruneOrganizationInvitationHistory(
              targetOrganization.id,
              new Date()
            ),
          afterCancelInvitation: async ({ organization: targetOrganization }) =>
            pruneOrganizationInvitationHistory(
              targetOrganization.id,
              new Date()
            ),
        },
        sendInvitationEmail: async (data, request) => {
          const url = new URL("/accept-invitation", environment.baseUrl)
          url.searchParams.set("id", data.id)
          emailDelivery.invitation(
            data.email,
            data.organization.name,
            data.inviter.user.name,
            url.toString(),
            emailRole(data.role),
            new Date(data.invitation.expiresAt),
            request
          )
        },
      }),
      tanstackStartCookies(),
    ],
  })
}

function emailRole(value: string): EmailRole {
  if (value === "owner" || value === "admin" || value === "manager") {
    return value
  }
  throw new Error("Unsupported invitation role.")
}

export type Auth = ReturnType<typeof createAuth>

let auth: Auth | undefined

export function getAuth(): Auth {
  auth ??= createAuth()
  return auth
}
