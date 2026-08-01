// `defineConfig` from Vitest rather than Vite — only that type knows the `test` block.
import { defineConfig } from "vitest/config"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { nitro } from "nitro/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { paraglideVitePlugin } from "@inlang/paraglide-js"

// Storybook builds with the same options, so they live outside this file.
import { paraglideOptions } from "./paraglide.options"

/**
 * Nitro produces the server output that Vercel deploys. Under Vitest it has no
 * job — it only slows the run down and keeps the Vite server from exiting.
 */
const deploymentPlugins = process.env.VITEST
  ? []
  : // `glpk.js` resolves its `glpk.wasm` relative to its own file. Bundled into
    // a chunk that path points nowhere, so the package stays external and Nitro
    // traces it — wasm included — into `.output/server/node_modules`.
    [nitro({ traceDeps: ["glpk.js*"] })]

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  ssr: { external: ["glpk.js"] },
  plugins: [
    paraglideVitePlugin({ ...paraglideOptions }),
    devtools(),
    tailwindcss(),
    tanstackStart(),
    ...deploymentPlugins,
    viteReact(),
  ],
  test: {
    // Components with state logic are tested too, which needs a DOM.
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
})

export default config
