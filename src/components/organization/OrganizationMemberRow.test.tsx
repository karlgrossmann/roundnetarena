import { render, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { selectOption } from "@/test-select"
import type { OrganizationMember, OrganizationRole } from "@/lib/types"
import {
  organization_role_manager,
  organization_role_owner,
} from "@/paraglide/messages.js"

import { OrganizationMemberRow } from "./OrganizationMemberRow"

const member: OrganizationMember = {
  id: "member-1",
  userId: "user-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "manager",
  joinedAt: "2026-01-15T18:00:00.000Z",
  isCurrentUser: false,
}

function renderRow() {
  render(
    <ul>
      <OrganizationMemberRow
        actorRole="owner"
        member={member}
        pending={false}
        onRoleChange={vi.fn()}
        onRemove={vi.fn()}
      />
    </ul>
  )

  return screen.getByLabelText(`Rolle von ${member.name}`)
}

/** The row is controlled — without state tracking along, the value would not move. */
function StatefulRow() {
  const [role, setRole] = useState<OrganizationRole>("manager")

  return (
    <ul>
      <OrganizationMemberRow
        actorRole="owner"
        member={{ ...member, role }}
        pending={false}
        onRoleChange={(_memberId, next) => setRole(next)}
        onRemove={vi.fn()}
      />
    </ul>
  )
}

describe("OrganizationMemberRow", () => {
  it("shows the role label rather than the role key on the closed trigger", () => {
    const trigger = renderRow()

    expect(trigger.textContent).toContain(organization_role_manager())
    expect(trigger.textContent).not.toContain(member.role)
  })

  it("keeps the label after switching the role", async () => {
    render(<StatefulRow />)
    const trigger = screen.getByLabelText(`Rolle von ${member.name}`)

    await selectOption(trigger, organization_role_owner())

    await waitFor(() =>
      expect(trigger.textContent).toContain(organization_role_owner())
    )
  })
})
