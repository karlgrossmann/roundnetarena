import { describe, expect, it } from "vitest"

import {
  assignableOrganizationRoles,
  canChangeOrganizationRole,
  canRemoveOrganizationMember,
  hasOrganizationPermission,
  isOrganizationRole,
} from "./organization-permissions"

describe("organization permissions", () => {
  it("keeps organization administration away from managers", () => {
    expect(hasOrganizationPermission("owner", "organization:update")).toBe(true)
    expect(hasOrganizationPermission("admin", "organization:update")).toBe(true)
    expect(hasOrganizationPermission("manager", "play:manage")).toBe(true)
    expect(hasOrganizationPermission("manager", "organization:update")).toBe(
      false
    )
    expect(hasOrganizationPermission("manager", "member:invite")).toBe(false)
    expect(hasOrganizationPermission("owner", "public-view:manage")).toBe(true)
    expect(hasOrganizationPermission("admin", "public-view:manage")).toBe(false)
  })

  it("reserves owner assignment and owner changes for owners", () => {
    expect(assignableOrganizationRoles("admin")).toEqual(["admin", "manager"])
    expect(canChangeOrganizationRole("admin", "manager", "owner")).toBe(false)
    expect(canChangeOrganizationRole("admin", "owner", "admin")).toBe(false)
    expect(canChangeOrganizationRole("owner", "admin", "owner")).toBe(true)
  })

  it("does not let admins remove owners", () => {
    expect(canRemoveOrganizationMember("admin", "owner")).toBe(false)
    expect(canRemoveOrganizationMember("admin", "manager")).toBe(true)
    expect(canRemoveOrganizationMember("owner", "owner")).toBe(true)
  })

  it("only accepts configured static roles", () => {
    expect(isOrganizationRole("owner")).toBe(true)
    expect(isOrganizationRole("member")).toBe(false)
  })
})
