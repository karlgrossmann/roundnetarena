import { access, readFile } from "node:fs/promises"

/**
 * Guards the two ways the Vercel build output has silently broken before.
 * Run it after `NITRO_PRESET=vercel pnpm build`; the deploy uploads exactly
 * what this inspects.
 */

const outputDir = new URL("../.vercel/output/", import.meta.url)
const problems = []

const config = JSON.parse(
  await readFile(new URL("config.json", outputDir), "utf8")
)
const routes = config.routes ?? []

// Every request that is not a static file has to reach the server function.
// A `handle` phase ahead of `filesystem` swallows the catch-all — that is what
// `vercel build` produces, and it answers 404 on every URL.
const filesystemIndex = routes.findIndex((route) => route.handle === "filesystem")
const catchAllIndex = routes.findIndex((route) => route.dest === "/__server")

if (filesystemIndex === -1) {
  problems.push("config.json has no `handle: filesystem` phase.")
}
if (catchAllIndex === -1) {
  problems.push("config.json routes nothing to the server function `/__server`.")
} else if (catchAllIndex < filesystemIndex) {
  problems.push(
    "The catch-all to `/__server` sits before `handle: filesystem`, so static files never win."
  )
}

const earlierPhase = routes
  .slice(0, filesystemIndex === -1 ? routes.length : filesystemIndex)
  .find((route) => route.handle)
if (earlierPhase) {
  problems.push(
    `Phase \`handle: ${earlierPhase.handle}\` comes before \`filesystem\`; everything after it only runs on errors.`
  )
}

// Routes pointing at files that were never generated turn into 404s.
for (const route of routes) {
  if (typeof route.dest !== "string" || !route.dest.endsWith(".html")) continue
  const target = new URL(`static${route.dest}`, outputDir)
  const exists = await access(target).then(
    () => true,
    () => false
  )
  if (!exists) {
    problems.push(`A route points at \`${route.dest}\`, which the build does not produce.`)
  }
}

// Matchmaking loads this at runtime; bundled into a chunk it is missing and
// every round calculation fails with ENOENT.
const wasm = new URL(
  "functions/__server.func/node_modules/glpk.js/dist/glpk.wasm",
  outputDir
)
const wasmExists = await access(wasm).then(
  () => true,
  () => false
)
if (!wasmExists) {
  problems.push(
    "glpk.wasm is missing from the function — matchmaking would fail at runtime."
  )
}

if (problems.length > 0) {
  console.error("The deployment output is not usable:\n")
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log("Deployment output looks good: routing intact, glpk.wasm present.")
