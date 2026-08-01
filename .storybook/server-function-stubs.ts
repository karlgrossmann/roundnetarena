import { readFileSync } from "node:fs"
import path from "node:path"
import type { Plugin } from "vite"

/**
 * Cuts off the server layer for Storybook.
 *
 * Every path through `src/lib/api/` ends at a server function, which pulls in
 * repositories, Drizzle and `pg`. In the application `@tanstack/react-start/server-only`
 * keeps that out of the client bundle; Storybook has no such mechanism and would
 * otherwise need a database to start.
 *
 * Instead of a hand-maintained list of replacements, this plugin reads the export names
 * from the real file and creates a function for each that throws when called. Storybook
 * therefore does not break on the next new server function — and a call happening at all
 * is always a defect in the story: data belongs in the QueryClient via `parameters.query`.
 *
 * One hook suffices because of the layering in `docs/server-data-access.md`: `src/server/`
 * is only ever left through `functions/`.
 */

/** Everything under this alias is replaced — server functions, auth, middleware. */
const SERVER_PREFIX = "@/server/"

/** `\0` marks the id as virtual, which makes Vite leave it alone. */
const VIRTUAL_PREFIX = "\0storybook-server-stub:"

/** `export const x =` and `export function x(` — not `export type` or `interface`. */
const EXPORTED_VALUE = /^export (?:const|(?:async )?function) (\w+)/gm

function stubModuleSource(names: Array<string>, specifier: string): string {
  const unavailable = [
    `const unavailable = (name) => () => {`,
    `  throw new Error(`,
    `    \`"\${name}" from ${specifier} is not available in Storybook. \` +`,
    `      "The story has to put its data into the QueryClient via parameters.query."`,
    `  )`,
    `}`,
  ].join("\n")

  const exports = names.map(
    (name) => `export const ${name} = unavailable(${JSON.stringify(name)})`
  )

  return [unavailable, ...exports].join("\n")
}

export function serverFunctionStubs(rootDir: string): Plugin {
  return {
    name: "storybook-server-function-stubs",
    // Before tsconfigPaths resolves `@/*` — otherwise the real file lands in the graph
    // before this plugin sees it.
    enforce: "pre",

    resolveId(source) {
      if (!source.startsWith(SERVER_PREFIX)) return null
      return `${VIRTUAL_PREFIX}${source.slice(SERVER_PREFIX.length)}`
    },

    load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) return null

      const relativePath = id.slice(VIRTUAL_PREFIX.length)
      const file = path.join(rootDir, "src", "server", `${relativePath}.ts`)
      const source = readFileSync(file, "utf8")
      const names = [...source.matchAll(EXPORTED_VALUE)].map(
        (match) => match[1]
      )

      return stubModuleSource(names, `@/server/${relativePath}`)
    },
  }
}
