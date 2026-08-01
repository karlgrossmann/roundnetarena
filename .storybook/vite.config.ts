import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"

/**
 * Vite configuration for Storybook.
 *
 * Otherwise Storybook loads the root `vite.config.ts`, including `tanstackStart()`, which
 * expects an SSR entry point and a route manifest and fails on a pure component catalog.
 *
 * Only what a story bundle really needs lives here. Storybook brings the React plugin
 * itself; Paraglide and the server stubs are added in `viteFinal` (see `main.ts`).
 */
export default defineConfig({
  // Resolves the `@/*` alias from `tsconfig.json`, just like the application.
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss()],
})
