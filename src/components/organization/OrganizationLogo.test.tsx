import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { OrganizationLogo } from "./OrganizationLogo"
import { overwriteGetLocale } from "@/paraglide/runtime.js"

afterEach(() => {
  overwriteGetLocale(() => "de")
})

describe("OrganizationLogo", () => {
  it("uses the app logo as a fallback", () => {
    render(<OrganizationLogo name="Roundnet Club" logo={null} />)

    expect(
      screen
        .getByRole("img", { name: "Logo von Roundnet Club" })
        .getAttribute("src")
    ).toBe("/logo.png")
  })

  it("falls back when the club logo cannot be loaded", () => {
    render(
      <OrganizationLogo
        name="Roundnet Club"
        logo="https://storage.example/missing.webp"
      />
    )
    const image = screen.getByRole("img", { name: "Logo von Roundnet Club" })

    fireEvent.error(image)

    expect(image.getAttribute("src")).toMatch(/\/logo\.png$/)
  })

  it("localizes the alt text in English", () => {
    overwriteGetLocale(() => "en")
    render(<OrganizationLogo name="Roundnet Club" logo={null} />)

    expect(
      screen.getByRole("img", { name: "Logo of Roundnet Club" })
    ).toBeTruthy()
  })
})
