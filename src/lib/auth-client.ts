import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

import {
  organizationAccessControl,
  organizationRoles,
} from "./organization-permissions"

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac: organizationAccessControl,
      roles: organizationRoles,
    }),
  ],
})

export async function requestPasswordResetEmail(email: string): Promise<void> {
  const { error } = await authClient.requestPasswordReset({
    email,
    redirectTo: "/reset-password",
  })
  if (error) throw new Error(error.code ?? "PASSWORD_RESET_REQUEST_FAILED")
}
