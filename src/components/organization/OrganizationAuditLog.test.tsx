import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { organizationAuditEventLabel } from "./OrganizationAuditLog"
import type { OrganizationAuditEntry } from "@/lib/types"
import { overwriteGetLocale } from "@/paraglide/runtime.js"

afterEach(() => {
  overwriteGetLocale(() => "de")
})

describe("OrganizationAuditLog", () => {
  it("describes role changes without exposing target identifiers", () => {
    render(
      <>
        {organizationAuditEventLabel(
          auditEntry({
            eventType: "organization.member_role_changed",
            metadata: { previousRole: "manager", newRole: "admin" },
          })
        )}
      </>
    )

    expect(
      screen.getByText("Anna hat eine Mitgliedsrolle geändert:")
    ).toBeTruthy()
    expect(screen.getByText("Manager")).toBeTruthy()
    expect(screen.getByText("Admin")).toBeTruthy()
    expect(screen.queryByText("target-id")).toBeNull()
  })

  it("localizes invitation events in English", () => {
    overwriteGetLocale(() => "en")
    render(
      <>
        {organizationAuditEventLabel(
          auditEntry({
            eventType: "organization.invitation_revoked",
            metadata: { role: "manager" },
          })
        )}
      </>
    )

    expect(screen.getByText("Anna revoked an invitation.")).toBeTruthy()
  })
})

function auditEntry(
  overrides: Pick<OrganizationAuditEntry, "eventType" | "metadata">
): OrganizationAuditEntry {
  return {
    id: "audit-id",
    actor: { id: "actor-id", name: "Anna" },
    targetType: "member",
    targetId: "target-id",
    createdAt: "2026-07-28T12:00:00.000Z",
    ...overrides,
  }
}
