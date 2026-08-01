import { describe, expect, it } from "vitest"

import { isValidOrganizationSlug, organizationSlug } from "./organization-form"

describe("organization form", () => {
  it("creates stable URL slugs from club names", () => {
    expect(organizationSlug("  Ründnët Verein Bielefeld!  ")).toBe(
      "rundnet-verein-bielefeld"
    )
  })

  it("validates only bounded lowercase URL slugs", () => {
    expect(isValidOrganizationSlug("roundnet-bielefeld")).toBe(true)
    expect(isValidOrganizationSlug("No Spaces")).toBe(false)
    expect(isValidOrganizationSlug("ab")).toBe(false)
  })
})
