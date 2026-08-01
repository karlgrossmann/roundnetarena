import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { OrganizationHeader } from "./OrganizationHeader"

describe("OrganizationHeader", () => {
  it("puts the club name as the heading above the subline", () => {
    render(
      <OrganizationHeader
        name="Roundnet Bielefeld"
        logo={null}
        subline="Guten Morgen, Alex"
      />
    )

    expect(
      screen.getByRole("heading", { name: "Roundnet Bielefeld" })
    ).toBeTruthy()
    expect(screen.getByText("Guten Morgen, Alex")).toBeTruthy()
  })

  it("stays on a single line without a subline", () => {
    const { container } = render(
      <OrganizationHeader name="Roundnet Bielefeld" logo={null} />
    )

    expect(container.querySelector("p")).toBeNull()
  })
})
