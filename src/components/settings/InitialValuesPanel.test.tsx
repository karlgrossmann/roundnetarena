import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { InitialValuesPanel } from "./InitialValuesPanel"

describe("InitialValuesPanel", () => {
  it("explains the scope and shows understandable field errors", () => {
    const onSave = vi.fn()
    render(
      <InitialValuesPanel
        open
        onOpenChange={vi.fn()}
        initialRating={1500}
        initialRd={125}
        saving={false}
        onSave={onSave}
      />
    )

    expect(
      screen.getByText(/nur für neu angelegte Spieler verwendet/)
    ).toBeDefined()
    expect(
      screen.getByText(/Bestehende Ratings bleiben unverändert/)
    ).toBeDefined()

    fireEvent.change(screen.getByLabelText("Start-Rating"), {
      target: { value: "99" },
    })
    fireEvent.change(screen.getByLabelText("Start-RD"), {
      target: { value: "351" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }))

    expect(
      screen.getByText(
        "Das Start-Rating muss eine ganze Zahl zwischen 100 und 3.000 sein."
      )
    ).toBeDefined()
    expect(
      screen.getByText(
        "Die Start-RD muss eine ganze Zahl zwischen 30 und 350 sein."
      )
    ).toBeDefined()
    expect(onSave).not.toHaveBeenCalled()
  })

  it("submits valid initial values together", () => {
    const onSave = vi.fn()
    render(
      <InitialValuesPanel
        open
        onOpenChange={vi.fn()}
        initialRating={1500}
        initialRd={125}
        saving={false}
        onSave={onSave}
      />
    )

    fireEvent.change(screen.getByLabelText("Start-Rating"), {
      target: { value: "1725" },
    })
    fireEvent.change(screen.getByLabelText("Start-RD"), {
      target: { value: "100" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }))

    expect(onSave).toHaveBeenCalledWith({
      initialRating: 1725,
      initialRd: 100,
    })
  })
})
