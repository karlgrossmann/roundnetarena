import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SettingsRow } from "./SettingsRow"
import { Switch } from "@/components/ui/switch"

describe("SettingsRow", () => {
  it("opens the panel on tap", () => {
    const onOpen = vi.fn()
    render(<SettingsRow label="Algorithmus" value="Standard" onOpen={onOpen} />)

    fireEvent.click(screen.getByRole("button"))

    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it("stays display-only without a target", () => {
    render(<SettingsRow label="Start-Rating" value="1500" />)

    expect(screen.queryByRole("button")).toBeNull()
    expect(screen.queryByText("1500")).not.toBeNull()
  })

  it("shows a control instead of a chevron", () => {
    render(
      <SettingsRow
        label="Rating-Änderung einfärben"
        control={<Switch aria-label="Rating-Änderung einfärben" checked />}
      />
    )

    // The row itself is not clickable — the switch already is the change.
    expect(screen.queryByRole("button")).toBeNull()
    expect(screen.queryByRole("switch")).not.toBeNull()
  })
})
