import { describe, expect, it } from "vitest"

import { APP_NAV_ITEMS, PUBLIC_NAV_ITEMS } from "./navigation"
import type { NavItem, NavParams } from "./navigation"

const params: NavParams = {
  organizationSlug: "roundnet-bielefeld",
  leagueId: "league-1",
}

function targets(items: ReadonlyArray<NavItem>) {
  return items.map((item) => item.link(params).to)
}

describe("navigation", () => {
  it("points header bar and tab bar at the same targets", () => {
    expect(APP_NAV_ITEMS.map((item) => item.labelKey)).toEqual([
      "dashboard",
      "round",
      "history",
    ])
    expect(PUBLIC_NAV_ITEMS.map((item) => item.labelKey)).toEqual(
      APP_NAV_ITEMS.map((item) => item.labelKey)
    )
  })

  // Settings live in the account menu. Pulled back into the list they take one of the tab
  // bar's thumb slots — that should stay a decision, not an accident.
  it("does not list settings as a navigation target", () => {
    expect(APP_NAV_ITEMS.map((item) => item.labelKey)).not.toContain("settings")
    expect(targets(APP_NAV_ITEMS).join(" ")).not.toContain("/settings")
  })

  it("keeps signed-in area and public view targets separate", () => {
    expect(targets(APP_NAV_ITEMS).every((to) => to?.startsWith("/o/"))).toBe(
      true
    )
    expect(
      targets(PUBLIC_NAV_ITEMS).every((to) => to?.startsWith("/view/"))
    ).toBe(true)
  })

  it("passes the route params on to every target", () => {
    for (const items of [APP_NAV_ITEMS, PUBLIC_NAV_ITEMS]) {
      for (const item of items) {
        expect(item.link(params).params).toEqual(params)
      }
    }
  })

  // Without `exact` the dashboard would be marked active on every subpage; with `exact` on
  // the others, detail pages such as a single player would be marked nowhere.
  it("marks only the dashboard as an exact target", () => {
    for (const items of [APP_NAV_ITEMS, PUBLIC_NAV_ITEMS]) {
      const exactness = items.map(
        (item) => item.link(params).activeOptions?.exact === true
      )
      expect(exactness).toEqual([true, false, false])
    }
  })
})
