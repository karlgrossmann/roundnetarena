import { fileURLToPath } from "node:url"
import { paraglideVitePlugin } from "@inlang/paraglide-js"
import type { StorybookConfig } from "@storybook/react-vite"

import { serverFunctionStubs } from "./server-function-stubs"
// With extension, because Storybook does not bundle config from outside `.storybook/`
// and Node ESM has to resolve the path itself.
import { paraglideOptions } from "../paraglide.options.ts"

const rootDir = fileURLToPath(new URL("..", import.meta.url))

const config: StorybookConfig = {
  // Stories sit next to their component, like the tests. `src/components/ui/` stays out:
  // generated shadcn code is not documented here.
  stories: ["../src/components/**/*.stories.@(ts|tsx)"],

  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],

  framework: {
    name: "@storybook/react-vite",
    options: {
      // Without this pointer Storybook loads the root `vite.config.ts` and with it
      // `tanstackStart()`, which has no business here and breaks the build.
      builder: { viteConfigPath: ".storybook/vite.config.ts" },
    },
  },

  async viteFinal(viteConfig) {
    return {
      ...viteConfig,
      plugins: [
        // Before anything else: replace the server layer before anyone reads it in.
        serverFunctionStubs(rootDir),
        // Without this, no `@/paraglide/messages.js` import resolves — and almost every
        // component uses one.
        paraglideVitePlugin({ ...paraglideOptions }),
        ...(viteConfig.plugins ?? []),
      ],
    }
  },
}

export default config
