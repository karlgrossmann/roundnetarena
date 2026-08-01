//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"

export default [
  ...tanstackConfig,
  {
    rules: {
      "import/no-cycle": "off",
      "import/order": "off",
      "sort-imports": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/require-await": "off",
      "pnpm/json-enforce-catalog": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/server/**", "src/start.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/server/db/*",
                "@/server/repositories/*",
                "@/server/middleware/*",
              ],
              message:
                "Outside of src/server, only server functions are allowed.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      "eslint.config.js",
      ".prettierrc",
      "src/components/ui/**",
      "src/paraglide/**",
      "src/routeTree.gen.ts",
      // Storybook build output — bundled third-party files, not source.
      "storybook-static/**",
      // Nitro build output and the Vercel CLI's working directory.
      ".output/**",
      ".vercel/**",
    ],
  },
]
