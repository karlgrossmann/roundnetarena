import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { ORGANIZATION_LOGO_INPUT_TYPES } from "@/lib/organization-logo"

import { authed } from "../middleware/auth"

const MAX_BASE64_LENGTH = Math.ceil((2 * 1024 * 1024) / 3) * 4
const OrganizationIdSchema = z.object({ organizationId: z.uuid() })
const PrepareLogoSchema = OrganizationIdSchema.extend({
  contentType: z.enum(ORGANIZATION_LOGO_INPUT_TYPES),
  base64: z
    .string()
    .min(4)
    .max(MAX_BASE64_LENGTH)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/),
})
const ConfirmLogoSchema = OrganizationIdSchema.extend({
  grant: z.string().min(20).max(4096),
})

export const prepareOrganizationLogoUpload = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(PrepareLogoSchema)
  .handler(async ({ context, data }) => {
    const { prepareOrganizationLogoUploadAction } =
      await import("./organization-logo-actions.server")
    return prepareOrganizationLogoUploadAction({
      ...data,
      userId: context.auth.user.id,
      activeOrganizationId: context.auth.session.activeOrganizationId ?? null,
    })
  })

export const confirmOrganizationLogoUpload = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(ConfirmLogoSchema)
  .handler(async ({ context, data }) => {
    const { confirmOrganizationLogoUploadAction } =
      await import("./organization-logo-actions.server")
    return confirmOrganizationLogoUploadAction({
      ...data,
      userId: context.auth.user.id,
      activeOrganizationId: context.auth.session.activeOrganizationId ?? null,
    })
  })

export const removeOrganizationLogo = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(OrganizationIdSchema)
  .handler(async ({ context, data }) => {
    const { removeOrganizationLogoAction } =
      await import("./organization-logo-actions.server")
    return removeOrganizationLogoAction({
      ...data,
      userId: context.auth.user.id,
      activeOrganizationId: context.auth.session.activeOrganizationId ?? null,
    })
  })
