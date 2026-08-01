import { createStart } from "@tanstack/react-start"

import { protectedPages } from "@/server/middleware/auth"

export const startInstance = createStart(() => ({
  requestMiddleware: [protectedPages],
}))
