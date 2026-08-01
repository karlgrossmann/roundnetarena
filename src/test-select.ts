import { fireEvent, screen } from "@testing-library/react"

/**
 * Opens a `Select` and picks an option.
 *
 * Base UI resolves the selection through pointer events — a plain `click` on the option
 * does nothing. The sequence lives here once instead of being rebuilt in every test file.
 */
export async function selectOption(
  trigger: HTMLElement,
  optionName: string
): Promise<void> {
  fireEvent.click(trigger)

  const option = await screen.findByRole("option", { name: optionName })
  fireEvent.pointerDown(option, { pointerType: "mouse", button: 0 })
  fireEvent.pointerUp(option, { pointerType: "mouse", button: 0 })
  fireEvent.click(option, { button: 0 })
}
