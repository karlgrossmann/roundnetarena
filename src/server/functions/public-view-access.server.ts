import "@tanstack/react-start/server-only"

import { DomainError } from "@/lib/domain-errors"
import type { PublicViewContext } from "@/lib/types"

import { getDb } from "../db/client"
import {
  findOrganizationPublicViewBySlug,
  findPublicViewContext,
} from "../repositories/organization-public-view"
import {
  publicViewCookieName,
  verifyPublicViewSession,
} from "../public-view-session.server"

export async function requirePublicViewLeagueAccess(
  input: {
    organizationSlug: string
    leagueId: string
  },
  cookies: Record<string, string>,
  now: Date
): Promise<PublicViewContext> {
  const database = getDb()
  const record = await findOrganizationPublicViewBySlug(
    database,
    input.organizationSlug
  )
  if (!record?.enabled || !record.passwordHash) {
    throw new DomainError("public_view.unauthorized")
  }
  const token = cookies[publicViewCookieName(record.organizationId)]
  const session = token ? verifyPublicViewSession(token, now) : null
  if (
    !session ||
    session.organizationId !== record.organizationId ||
    session.credentialVersion !== record.credentialVersion
  ) {
    throw new DomainError("public_view.unauthorized")
  }
  const context = await findPublicViewContext(database, record, input.leagueId)
  if (!context) throw new DomainError("league.not_found")
  return context
}
