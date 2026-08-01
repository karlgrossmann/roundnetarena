import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { OrganizationBrandColorPicker } from "./OrganizationBrandColorPicker"

describe("OrganizationBrandColorPicker", () => {
  it("renders eight round, accessible color choices", () => {
    render(
      <OrganizationBrandColorPicker value="purple" onValueChange={() => {}} />
    )

    expect(screen.getAllByRole("radio")).toHaveLength(8)
    const purple = screen.getByRole("radio", { name: "Violett" })
    expect(purple.className).toContain("size-9")
    expect(
      purple.querySelector('[data-brand-color="purple"]')?.className
    ).toContain("rounded-full")
    expect(purple.getAttribute("data-checked")).not.toBeNull()
  })

  it("reports a selected palette id", () => {
    const onValueChange = vi.fn()
    render(
      <OrganizationBrandColorPicker
        value="purple"
        onValueChange={onValueChange}
      />
    )

    fireEvent.click(screen.getByRole("radio", { name: "Limette" }))

    expect(onValueChange).toHaveBeenCalledWith("lime")
  })
})
