import { describe, expect, it } from "vitest"

import { domainIssue } from "./domain-errors"
import { localizedRouteHead, pageTitle, translateDomainIssue } from "./i18n"

describe("pageTitle", () => {
  it("translates stable route title keys at render time", () => {
    expect(pageTitle("settings", "de")).toBe("Einstellungen")
    expect(pageTitle("settings", "en")).toBe("Settings")
    expect(pageTitle("organizations", "de")).toBe("Vereine")
    expect(pageTitle("organizations", "en")).toBe("Clubs")
  })

  it("localizes document metadata together with the route title", () => {
    const head = localizedRouteHead("history")
    expect(head.meta[0]).toEqual({
      title: "Historie · Roundnet Arena",
    })
    expect(head.meta[1]?.content).toContain("Roundnet-Spieltage")
  })
})

describe("translateDomainIssue", () => {
  it("translates stable validation codes in German and English", () => {
    const issue = domainIssue("score.draw_not_allowed")
    expect(translateDomainIssue(issue, "de")).toBe(
      "Ein Spiel kann nicht unentschieden enden."
    )
    expect(translateDomainIssue(issue, "en")).toBe(
      "A game cannot end in a draw."
    )
  })

  it("keeps structured values available for localized messages", () => {
    const issue = domainIssue("score.minimum_not_reached", { minimum: 15 })
    expect(translateDomainIssue(issue, "de")).toContain("15 Punkte")
    expect(translateDomainIssue(issue, "en")).toContain("15 points")
  })

  it("translates time-range validation without coupling the validator to a locale", () => {
    const issue = domainIssue("time_range.invalid_order")
    expect(translateDomainIssue(issue, "de")).toBe(
      "Das Von-Datum darf nicht nach dem Bis-Datum liegen."
    )
    expect(translateDomainIssue(issue, "en")).toBe(
      "The start date must not be after the end date."
    )
  })

  it("translates organization authorization failures at the UI boundary", () => {
    const issue = domainIssue("organization.last_owner")
    expect(translateDomainIssue(issue, "de")).toContain("letzte Owner")
    expect(translateDomainIssue(issue, "en")).toContain("last owner")
  })

  it("translates logo validation without exposing storage details", () => {
    const issue = domainIssue("organization.logo_too_large")
    expect(translateDomainIssue(issue, "de")).toContain("2 MB")
    expect(translateDomainIssue(issue, "en")).toContain("2 MB")
  })
})
