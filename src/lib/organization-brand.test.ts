import { describe, expect, it } from "vitest"

import {
  DEFAULT_ORGANIZATION_BRAND_COLOR,
  applyInitialOrganizationBrand,
  applyOrganizationBrandColor,
  organizationBrandColorForPath,
  organizationBrandColorFromCookie,
  organizationBrandColorFromMetadata,
  withOrganizationBrandColor,
} from "./organization-brand"

describe("organization branding", () => {
  it("reads a valid color and falls back safely for invalid metadata", () => {
    expect(organizationBrandColorFromMetadata('{"brandColor":"indigo"}')).toBe(
      "indigo"
    )
    expect(organizationBrandColorFromMetadata({ brandColor: "cyan" })).toBe(
      DEFAULT_ORGANIZATION_BRAND_COLOR
    )
    expect(organizationBrandColorFromMetadata("not-json")).toBe(
      DEFAULT_ORGANIZATION_BRAND_COLOR
    )
  })

  it("preserves unrelated metadata while changing the brand color", () => {
    expect(
      withOrganizationBrandColor(
        { externalReference: "club-42", brandColor: "blue" },
        "lime"
      )
    ).toEqual({ externalReference: "club-42", brandColor: "lime" })
  })

  it("accepts only known cookie values", () => {
    expect(
      organizationBrandColorFromCookie(
        "session=safe; roundnet-brand-color=orange"
      )
    ).toBe("orange")
    expect(
      organizationBrandColorFromCookie("roundnet-brand-color=oklch(0.5 1 20)")
    ).toBe(DEFAULT_ORGANIZATION_BRAND_COLOR)
  })

  it("prefers the URL organization over the active organization", () => {
    const organizations = [
      {
        id: "first",
        slug: "first-club",
        brandColor: "green" as const,
        isActive: true,
      },
      {
        id: "second",
        slug: "second-club",
        brandColor: "red" as const,
      },
    ]

    expect(
      organizationBrandColorForPath(
        "/o/second-club/l/main",
        organizations,
        "first"
      )
    ).toBe("red")
    expect(
      organizationBrandColorForPath("/clubs/second", organizations, "first")
    ).toBe("red")
    expect(
      organizationBrandColorForPath("/clubs", organizations, "first")
    ).toBe("green")
  })

  it("applies one validated data attribute to the document root", () => {
    applyOrganizationBrandColor(document.documentElement, "yellow")
    expect(document.documentElement.dataset.brandColor).toBe("yellow")
  })

  it("applies the cookie before hydration and resets public auth pages", () => {
    document.cookie = "roundnet-brand-color=indigo; path=/"
    window.history.replaceState({}, "", "/o/club/l/main")

    applyInitialOrganizationBrand(["/login"])
    expect(document.documentElement.dataset.brandColor).toBe("indigo")

    window.history.replaceState({}, "", "/login")
    applyInitialOrganizationBrand(["/login"])
    // Against the constant rather than a literal: `applyInitialOrganizationBrand`
    // writes the value a second time in serialized form, and the two must not drift
    // apart.
    expect(document.documentElement.dataset.brandColor).toBe(
      DEFAULT_ORGANIZATION_BRAND_COLOR
    )
  })
})
