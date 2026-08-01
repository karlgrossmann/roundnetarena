import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { RoundCancellationActions } from "./RoundCancellationActions"

describe("RoundCancellationActions", () => {
  it("cancels only the open games after confirmation", () => {
    const onCancelOpen = vi.fn()
    const onAnnul = vi.fn()
    render(
      <RoundCancellationActions
        openGames={2}
        alreadyAnnulled={false}
        onCancelOpen={onCancelOpen}
        onAnnul={onAnnul}
      />
    )

    fireEvent.click(
      screen.getByRole("button", { name: "Offene Spiele absagen" })
    )
    expect(
      screen.getByText(/Bereits eingetragene Ergebnisse bleiben/)
    ).not.toBeNull()
    fireEvent.click(
      screen.getByRole("button", { name: "Offene Spiele absagen" })
    )

    expect(onCancelOpen).toHaveBeenCalledOnce()
    expect(onAnnul).not.toHaveBeenCalled()
  })

  it("annuls the whole round after its own confirmation", () => {
    const onCancelOpen = vi.fn()
    const onAnnul = vi.fn()
    render(
      <RoundCancellationActions
        openGames={1}
        alreadyAnnulled={false}
        onCancelOpen={onCancelOpen}
        onAnnul={onAnnul}
      />
    )

    fireEvent.click(
      screen.getByRole("button", { name: "Ganze Runde annullieren" })
    )
    expect(screen.getByText(/auch die bereits eingetragenen/)).not.toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Runde annullieren" }))

    expect(onAnnul).toHaveBeenCalledOnce()
    expect(onCancelOpen).not.toHaveBeenCalled()
  })

  it("disables the actions when there is nothing left to cancel", () => {
    render(
      <RoundCancellationActions
        openGames={0}
        alreadyAnnulled
        onCancelOpen={vi.fn()}
        onAnnul={vi.fn()}
      />
    )

    expect(
      screen
        .getByRole("button", {
          name: "Keine offenen Spiele",
        })
        .getAttribute("disabled")
    ).not.toBeNull()
    expect(
      screen
        .getByRole("button", {
          name: "Runde ist annulliert",
        })
        .getAttribute("disabled")
    ).not.toBeNull()
  })
})
