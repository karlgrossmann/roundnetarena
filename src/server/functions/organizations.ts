import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { DomainError } from "@/lib/domain-errors"
import {
  ORGANIZATION_BRAND_COLORS,
  withOrganizationBrandColor,
} from "@/lib/organization-brand"
import {
  hasOrganizationPermission,
  isOrganizationRole,
} from "@/lib/organization-permissions"
import type { OrganizationPermission } from "@/lib/organization-permissions"
import type {
  InvitationDetails,
  OrganizationDetails,
  OrganizationRole,
  OrganizationSummary,
} from "@/lib/types"
import {
  PUBLIC_VIEW_PASSWORD_MAX_LENGTH,
  PUBLIC_VIEW_PASSWORD_MIN_LENGTH,
} from "@/lib/public-view"

import {
  acceptOrganizationInvitationAction,
  inviteOrganizationMemberAction,
  resendOrganizationInvitationAction,
  revokeOrganizationInvitationAction,
} from "./organization-invitation-actions.server"
import {
  removeOrganizationMemberAction,
  updateOrganizationMemberRoleAction,
} from "./organization-member-actions.server"
import { throwOrganizationApiError } from "./organization-api-error.server"
import { getAuth } from "../auth/auth"
import { sendInvitationEmail } from "../auth/email"
import { getAuthEnvironment } from "../config"
import { getDb } from "../db/client"
import { authed } from "../middleware/auth"
import { provisionOrganizationDefaults } from "../repositories/organization-onboarding"
import {
  findOrganizationDetails,
  findOrganizationMembership,
  findOrganizationRecord,
  findOrganizationsForUser,
} from "../repositories/organizations"
import {
  disableOrganizationPublicView,
  enableOrganizationPublicView,
} from "../repositories/organization-public-view"
import { hashPublicViewPassword } from "../public-view-password.server"

const OrganizationIdSchema = z.object({ organizationId: z.uuid() })
const InvitationIdSchema = z.object({ invitationId: z.uuid() })
const OrganizationRoleSchema = z.enum(["owner", "admin", "manager"])
const OrganizationBrandColorSchema = z.enum(ORGANIZATION_BRAND_COLORS)
const SlugSchema = z
  .string()
  .trim()
  .min(3)
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const OrganizationInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: SlugSchema,
})
const CreateOrganizationInputSchema = OrganizationInputSchema.extend({
  brandColor: OrganizationBrandColorSchema,
})
const PublicViewInputSchema = z.discriminatedUnion("action", [
  z.object({
    organizationId: z.uuid(),
    action: z.literal("enable"),
    password: z
      .string()
      .min(PUBLIC_VIEW_PASSWORD_MIN_LENGTH)
      .max(PUBLIC_VIEW_PASSWORD_MAX_LENGTH),
  }),
  z.object({
    organizationId: z.uuid(),
    action: z.literal("disable"),
  }),
])

export const fetchOrganizations = createServerFn({ method: "GET" })
  .middleware([authed])
  .handler(async ({ context }) =>
    findOrganizationsForUser(
      getDb(),
      context.auth.user.id,
      context.auth.session.activeOrganizationId ?? null
    )
  )

export const fetchOrganization = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(OrganizationIdSchema)
  .handler(async ({ context, data }) => {
    const details = await requireOrganizationDetails(
      data.organizationId,
      context.auth.user.id,
      context.auth.session.activeOrganizationId ?? null
    )
    return hasOrganizationPermission(details.organization.role, "member:invite")
      ? details
      : { ...details, joinLinks: [] }
  })

export const createOrganization = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(CreateOrganizationInputSchema)
  .handler(async ({ context, data }): Promise<OrganizationSummary> => {
    const headers = await requestHeaders()
    const created = await callOrganizationApi(() =>
      getAuth().api.createOrganization({
        headers,
        body: {
          name: data.name,
          slug: data.slug,
          metadata: { brandColor: data.brandColor },
        },
      })
    )
    const provisioned = await tryProvisionOrganization(created)
    const organizations = await findOrganizationsForUser(
      getDb(),
      context.auth.user.id,
      created.id
    )
    const result = organizations.find(
      (organization) => organization.id === created.id
    )
    if (!result) throw new DomainError("organization.action_failed")
    await setBrandColorCookie(result.brandColor)
    return { ...result, provisioned }
  })

export const retryOrganizationProvisioning = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(OrganizationIdSchema)
  .handler(async ({ context, data }) => {
    await requirePermission(
      data.organizationId,
      context.auth.user.id,
      "organization:update"
    )
    const organization = await findOrganizationRecord(
      getDb(),
      data.organizationId
    )
    if (!organization) throw new DomainError("organization.not_found")
    await provisionOrganizationDefaults(organization)
    return { organizationId: organization.id, provisioned: true as const }
  })

export const setActiveOrganization = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(OrganizationIdSchema)
  .handler(async ({ context, data }) => {
    await requireMembership(data.organizationId, context.auth.user.id)
    const headers = await requestHeaders()
    await callOrganizationApi(() =>
      getAuth().api.setActiveOrganization({
        headers,
        body: { organizationId: data.organizationId },
      })
    )
    const organizations = await findOrganizationsForUser(
      getDb(),
      context.auth.user.id,
      data.organizationId
    )
    const selected = organizations.find(
      (organization) => organization.id === data.organizationId
    )
    if (selected) await setBrandColorCookie(selected.brandColor)
    return organizations
  })

export const updateOrganization = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(OrganizationIdSchema.extend(OrganizationInputSchema.shape))
  .handler(async ({ context, data }) => {
    await requirePermission(
      data.organizationId,
      context.auth.user.id,
      "organization:update"
    )
    const headers = await requestHeaders()
    await callOrganizationApi(() =>
      getAuth().api.updateOrganization({
        headers,
        body: {
          organizationId: data.organizationId,
          data: { name: data.name, slug: data.slug },
        },
      })
    )
    return requireOrganizationDetails(
      data.organizationId,
      context.auth.user.id,
      context.auth.session.activeOrganizationId ?? null
    )
  })

export const updateOrganizationBrandColor = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(
    OrganizationIdSchema.extend({
      brandColor: OrganizationBrandColorSchema,
    })
  )
  .handler(async ({ context, data }) => {
    await requirePermission(
      data.organizationId,
      context.auth.user.id,
      "organization:update"
    )
    const organization = await findOrganizationRecord(
      getDb(),
      data.organizationId
    )
    if (!organization) throw new DomainError("organization.not_found")
    const headers = await requestHeaders()
    await callOrganizationApi(() =>
      getAuth().api.updateOrganization({
        headers,
        body: {
          organizationId: data.organizationId,
          data: {
            metadata: withOrganizationBrandColor(
              organization.metadata,
              data.brandColor
            ),
          },
        },
      })
    )
    const details = await requireOrganizationDetails(
      data.organizationId,
      context.auth.user.id,
      context.auth.session.activeOrganizationId ?? null
    )
    await setBrandColorCookie(details.organization.brandColor)
    return details
  })

export const updateOrganizationPublicView = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(PublicViewInputSchema)
  .handler(async ({ context, data }) => {
    await requirePermission(
      data.organizationId,
      context.auth.user.id,
      "public-view:manage"
    )
    const now = new Date()
    if (data.action === "enable") {
      const passwordHash = await hashPublicViewPassword(data.password)
      await getDb().transaction((tx) =>
        enableOrganizationPublicView(
          tx,
          {
            actorUserId: context.auth.user.id,
            organizationId: data.organizationId,
            passwordHash,
          },
          now
        )
      )
    } else {
      await getDb().transaction((tx) =>
        disableOrganizationPublicView(
          tx,
          {
            actorUserId: context.auth.user.id,
            organizationId: data.organizationId,
          },
          now
        )
      )
    }
    return requireOrganizationDetails(
      data.organizationId,
      context.auth.user.id,
      context.auth.session.activeOrganizationId ?? null
    )
  })

export const inviteOrganizationMember = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(
    OrganizationIdSchema.extend({
      email: z.email(),
      role: OrganizationRoleSchema,
    })
  )
  .handler(async ({ context, data }) => {
    const result = await inviteOrganizationMemberAction(
      {
        actorUserId: context.auth.user.id,
        organizationId: data.organizationId,
        email: data.email,
        role: data.role,
      },
      new Date()
    )
    sendOrganizationInvitation(
      result.invitation,
      result.organizationName,
      context.auth.user.name,
      await requestHeaders()
    )
    return { organizationId: data.organizationId }
  })

export const resendOrganizationInvitation = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(OrganizationIdSchema.extend(InvitationIdSchema.shape))
  .handler(async ({ context, data }) => {
    const result = await resendOrganizationInvitationAction(
      {
        actorUserId: context.auth.user.id,
        organizationId: data.organizationId,
        invitationId: data.invitationId,
      },
      new Date()
    )
    sendOrganizationInvitation(
      result.invitation,
      result.organizationName,
      context.auth.user.name,
      await requestHeaders()
    )
    return { organizationId: data.organizationId }
  })

export const revokeOrganizationInvitation = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(OrganizationIdSchema.extend(InvitationIdSchema.shape))
  .handler(async ({ context, data }) => {
    await revokeOrganizationInvitationAction(
      {
        actorUserId: context.auth.user.id,
        organizationId: data.organizationId,
        invitationId: data.invitationId,
      },
      new Date()
    )
    return { organizationId: data.organizationId }
  })

export const updateOrganizationMemberRole = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(
    OrganizationIdSchema.extend({
      memberId: z.uuid(),
      role: OrganizationRoleSchema,
    })
  )
  .handler(async ({ context, data }) => {
    await updateOrganizationMemberRoleAction(
      {
        actorUserId: context.auth.user.id,
        organizationId: data.organizationId,
        memberId: data.memberId,
        role: data.role,
      },
      new Date()
    )
    return { organizationId: data.organizationId }
  })

export const removeOrganizationMember = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(
    OrganizationIdSchema.extend({
      memberId: z.uuid(),
    })
  )
  .handler(async ({ context, data }) => {
    await removeOrganizationMemberAction(
      {
        actorUserId: context.auth.user.id,
        organizationId: data.organizationId,
        memberId: data.memberId,
      },
      new Date()
    )
    return { organizationId: data.organizationId }
  })

export const fetchOrganizationInvitation = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(InvitationIdSchema)
  .handler(async ({ data }): Promise<InvitationDetails> => {
    const headers = await requestHeaders()
    const invitation = await callOrganizationApi(() =>
      getAuth().api.getInvitation({
        headers,
        query: { id: data.invitationId },
      })
    )
    const role: string = invitation.role
    if (!isOrganizationRole(role)) {
      throw new DomainError("organization.invitation_invalid")
    }
    return {
      id: invitation.id,
      organizationId: invitation.organizationId,
      organizationName: invitation.organizationName,
      organizationSlug: invitation.organizationSlug,
      inviterEmail: invitation.inviterEmail,
      email: invitation.email,
      role,
      expiresAt: new Date(invitation.expiresAt).toISOString(),
    }
  })

export const acceptOrganizationInvitation = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(InvitationIdSchema)
  .handler(async ({ context, data }) => {
    const accepted = await acceptOrganizationInvitationAction(
      {
        actorUserId: context.auth.user.id,
        actorEmail: context.auth.user.email,
        invitationId: data.invitationId,
      },
      new Date()
    )
    const organization = await findOrganizationRecord(
      getDb(),
      accepted.organizationId
    )
    if (!organization) throw new DomainError("organization.not_found")
    const provisioned = await tryProvisionOrganization(organization)
    return {
      organizationId: organization.id,
      organizationSlug: organization.slug,
      provisioned,
    }
  })

async function requireOrganizationDetails(
  organizationId: string,
  userId: string,
  activeOrganizationId: string | null
): Promise<OrganizationDetails> {
  const details = await findOrganizationDetails(
    getDb(),
    organizationId,
    userId,
    activeOrganizationId,
    new Date()
  )
  if (!details) throw new DomainError("organization.not_found")
  return details
}

async function requireMembership(
  organizationId: string,
  userId: string
): Promise<OrganizationRole> {
  const membership = await findOrganizationMembership(
    getDb(),
    organizationId,
    userId
  )
  if (!membership) throw new DomainError("organization.forbidden")
  return membership.role
}

async function requirePermission(
  organizationId: string,
  userId: string,
  permission: OrganizationPermission
): Promise<OrganizationRole> {
  const role = await requireMembership(organizationId, userId)
  if (!hasOrganizationPermission(role, permission)) {
    throw new DomainError("organization.forbidden")
  }
  return role
}

async function requestHeaders(): Promise<Headers> {
  const { getRequestHeaders } = await import("@tanstack/react-start/server")
  return getRequestHeaders()
}

async function setBrandColorCookie(
  brandColor: OrganizationSummary["brandColor"]
) {
  const { setOrganizationBrandColorCookie } =
    await import("../organization-brand-cookie.server")
  await setOrganizationBrandColorCookie(
    brandColor,
    process.env.NODE_ENV === "production"
  )
}

async function callOrganizationApi<TResult>(
  operation: () => Promise<TResult>
): Promise<TResult> {
  try {
    return await operation()
  } catch (error) {
    throwOrganizationApiError(error)
  }
}

async function tryProvisionOrganization(organization: {
  id: string
  name: string
  slug: string
}): Promise<boolean> {
  try {
    await provisionOrganizationDefaults(organization)
    return true
  } catch (error) {
    const reason = error instanceof Error ? error.name : "UnknownError"
    process.stderr.write(
      `[organization-onboarding] provisioning will be offered again (${reason}).\n`
    )
    return false
  }
}

function sendOrganizationInvitation(
  invitation: {
    expiresAt: Date
    id: string
    email: string
    role: OrganizationRole
  },
  organizationName: string,
  inviterName: string,
  headers: Headers
): void {
  const baseUrl = getAuthEnvironment().baseUrl
  const url = new URL("/accept-invitation", baseUrl)
  url.searchParams.set("id", invitation.id)
  sendInvitationEmail(
    invitation.email,
    organizationName,
    inviterName,
    url.toString(),
    invitation.role,
    invitation.expiresAt,
    new Request(baseUrl, { headers })
  )
}
