import { describe, expect, it } from "vitest"

import {
  isPublicViewPath,
  publicViewAccessPath,
  safePublicViewRedirect,
} from "./public-view"

describe("public view routes", () => {
  it("builds a URL-encoded access path", () => {
    expect(publicViewAccessPath("club name")).toBe("/view/club%20name")
  })

  it("recognizes only the public route tree", () => {
    expect(isPublicViewPath("/view/roundnet-club")).toBe(true)
    expect(isPublicViewPath("/view/roundnet-club/l/main")).toBe(true)
    expect(isPublicViewPath("/viewer/roundnet-club")).toBe(false)
  })

  it("accepts redirects only within the same club", () => {
    expect(
      safePublicViewRedirect(
        "roundnet-club",
        "/view/roundnet-club/l/main/history"
      )
    ).toBe("/view/roundnet-club/l/main/history")
    expect(
      safePublicViewRedirect("roundnet-club", "/view/other/l/main")
    ).toBeNull()
    expect(
      safePublicViewRedirect("roundnet-club", "//attacker.example")
    ).toBeNull()
  })
})
