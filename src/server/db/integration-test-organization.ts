import "@tanstack/react-start/server-only"

import { organization } from "./auth-schema"
import { getDb } from "./client"

export const INTEGRATION_TEST_ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000000099"

export async function ensureIntegrationTestOrganization(): Promise<void> {
  await getDb()
    .insert(organization)
    .values({
      id: INTEGRATION_TEST_ORGANIZATION_ID,
      name: "Integration tests",
      slug: "integration-tests",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    .onConflictDoNothing({ target: organization.id })
}
