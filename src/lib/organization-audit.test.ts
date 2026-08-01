import { describe, expect, it } from "vitest"

import {
  ORGANIZATION_AUDIT_EVENT_TYPES,
  ORGANIZATION_AUDIT_PAGE_SIZE,
  isOrganizationAuditEventType,
  isOrganizationAuditTargetType,
} from "./organization-audit"

describe("organization audit contract", () => {
  it("uses a bounded page and a stable event catalog", () => {
    expect(ORGANIZATION_AUDIT_PAGE_SIZE).toBe(20)
    expect(new Set(ORGANIZATION_AUDIT_EVENT_TYPES).size).toBe(
      ORGANIZATION_AUDIT_EVENT_TYPES.length
    )
    expect(isOrganizationAuditEventType("organization.member_removed")).toBe(
      true
    )
    expect(isOrganizationAuditEventType("organization.unknown")).toBe(false)
  })

  it("only exposes non-secret target categories", () => {
    expect(isOrganizationAuditTargetType("member")).toBe(true)
    expect(isOrganizationAuditTargetType("invitation")).toBe(true)
    expect(isOrganizationAuditTargetType("token")).toBe(false)
    expect(isOrganizationAuditTargetType("email")).toBe(false)
  })
})
