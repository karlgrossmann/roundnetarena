import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { DomainError } from "@/lib/domain-errors"
import type { OrganizationAuditPage } from "@/lib/types"

import { getDb } from "../db/client"
import { authed } from "../middleware/auth"
import {
  findOrganizationAuditPage,
  hasOrganizationAuditOwnerAccess,
  setOrganizationAuditActor,
} from "../repositories/organization-audit"

const OrganizationAuditPageSchema = z.object({
  organizationId: z.uuid(),
  page: z.number().int().min(1).max(10_000),
})

export const fetchOrganizationAuditPage = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(OrganizationAuditPageSchema)
  .handler(async ({ context, data }): Promise<OrganizationAuditPage> => {
    return getDb().transaction(async (tx) => {
      await setOrganizationAuditActor(tx, context.auth.user.id)
      if (
        !(await hasOrganizationAuditOwnerAccess(
          tx,
          data.organizationId,
          context.auth.user.id
        ))
      ) {
        throw new DomainError("organization.forbidden")
      }
      return findOrganizationAuditPage(tx, data.organizationId, data.page)
    })
  })
