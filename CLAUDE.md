# Roundnet Arena

Application for running roundnet sessions: add players to a pool, compute fair
2-vs-2 matchups, record results and carry Glicko-2 ratings forward. The blueprint is
an existing Python tool that is being **replaced** — database and domain logic are
moving into this repository.

**Current phase: integrated backend with a multilingual foundation.** Every screen
loads through TanStack Query from protected server functions. PostgreSQL, repositories,
Glicko-2 and matchmaking live in this repository; components stay decoupled from the
data source. Paraglide provides request-safe German and English messages; the full UI
migration follows in roadmap package 08.

As soon as server access is involved, **[docs/server-data-access.md](docs/server-data-access.md)**
applies: server functions instead of server routes, three layers (`src/lib/` pure →
`src/server/repositories/` SQL → `src/server/functions/` boundary), access control and
transactions.

## Stack

| Area           | Technology                              | Note                                                       |
| -------------- | --------------------------------------- | ---------------------------------------------------------- |
| Framework      | TanStack Start + React 19               | SSR-capable                                                |
| Routing        | TanStack Router                         | file-based, `src/routes/`                                  |
| Server state   | TanStack Query                          | for all persisted data                                     |
| Server access  | **Server functions** (`createServerFn`) | no server routes — see `docs/server-data-access.md`        |
| Database       | **Drizzle**                             | schema, migrations and client under `src/server/db/`       |
| Tables         | TanStack Table                          | leaderboard, history                                       |
| Styling        | Tailwind **v4**                         | no `tailwind.config.js`                                    |
| Components     | shadcn/ui v4, style `base-nova`         | built on **Base UI**, not Radix                            |
| Icons          | **HugeIcons** via `@/components/icons`  | not Lucide, not Tabler — see rule 2                        |
| Charts         | Recharts + `@/components/ui/chart`      |                                                            |
| i18n           | **Paraglide JS**                        | German as base locale, English configured                  |
| Font           | Geist Variable                          | via `@fontsource-variable/geist`                           |
| Tests          | Vitest + Testing Library                |                                                            |
| Package manager| **pnpm**                                |                                                            |

## Commands

```bash
pnpm dev          # dev server on port 3000
pnpm build        # production build
pnpm test         # Vitest
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint
pnpm format       # Prettier (write)
pnpm i18n:compile # regenerate the Paraglide output explicitly
pnpm email:dev    # React Email preview on port 3001
pnpm storybook    # component catalog on port 6006

pnpm dlx shadcn@latest add <name>   # new UI component
```

After every change, `pnpm typecheck` and `pnpm test` must be green. `pnpm ci:verify`
runs the same chain as the CI: `i18n:compile`, `lint`, `check`, `typecheck`.

## Deployment

Vercel, and **only** through `.github/workflows/ci.yml` — automatic Git deployments
are off in `vercel.json`. A push to `main` first runs lint, typecheck, build and the
full test suite against a throwaway PostgreSQL, then migrates the production
database, and only then deploys. The README documents the environment variables.

Three things about the build are easy to break:

- **Nitro produces the server output** (`nitro()` in `vite.config.ts`). Under Vitest
  the plugin is skipped — it has no job there and keeps the Vite server alive.
- **Never build with `vercel build`.** The CLI recognises TanStack Start from the
  dependencies and rewrites Nitro's `config.json`: it places a `handle: error`
  phase ahead of `handle: filesystem` and routes everything to a `/404.html` that
  this build never produces — every URL answers 404. The deployment artefact comes
  from `pnpm build:deployment`, and `scripts/check-deployment-output.mjs` checks it.
- **`glpk.js` stays external** (`ssr.external` plus `traceDeps`). It resolves
  `glpk.wasm` relative to its own file, so bundled into a chunk matchmaking dies at
  runtime with `ENOENT` — a failure no test catches, because tests don't use the
  build output.

## Rules this project otherwise trips over

1. **Base UI, not Radix.** The components in `src/components/ui/` build on
   `@base-ui/react`. Never install or import `@radix-ui/*`.
2. **Icons come from `@/components/icons`.** `import { IconPlus } from "@/components/icons"`.
   Behind it sits HugeIcons (`@hugeicons/core-free-icons`), which ships data objects
   rather than ready-made components — `src/components/icons.tsx` assembles the two.
   Never import from `@hugeicons/*` directly, and install neither `lucide-react` nor
   `@tabler/icons-react`. A missing icon is added to `icons.tsx`, not worked around.
3. **Tailwind v4 has no config file.** Theme values live in `src/styles.css` under
   `@theme inline` and `:root` / `.dark`. Never create a `tailwind.config.js`.
4. **Design tokens only, no color literals.** `bg-primary`, `text-muted-foreground`,
   `text-success`. No `bg-violet-600`, no `#7c3aed`, no `oklch(...)` in components.
   If a token is missing, it is added to `src/styles.css` — not worked around.
5. **`routeTree.gen.ts` is generated.** Don't edit it. Routes come from new files in
   `src/routes/`.
6. **Use `import type`.** `verbatimModuleSyntax` is on; pure type imports without
   `type` break the build.
7. **No data fetching in `useEffect`.** Server state runs through TanStack Query, and
   a route's main data through its `loader` (see below).
8. **`src/components/ui/` is generated shadcn code.** Don't adjust it to solve a project
   need — build your own component in `src/components/` on top of it instead. The one
   existing deviation: the icon imports there point at `@/components/icons` instead of
   `@tabler/icons-react`. After another `shadcn add`, that import has to be fixed up in
   the new file.
9. **`src/server/` is left only through `functions/`.** Repositories, schema and the DB
   client are never imported outside of it. `createServerFn` alone keeps no code out of
   the client bundle — `server-only` does.
10. **Public viewer functions are a narrow exception.** Regular domain access uses
    `authed`. The documented `/view/*` view uses `publicViewRequest` plus
    `requirePublicViewLeagueAccess`; its password POST is validated and rate-limited.
    See `docs/features/public-organization-view.md`.

## Data access

All data comes through TanStack Query, even while it still originates from fixtures.
The query options live in `src/lib/api/queries.ts` and call server functions
exclusively.

Components never build their own query keys — those live in `queryKeys`. Nor do they
call a server function directly: the path always leads through `queries.ts` or
`mutations.ts`.

### The canonical route pattern

Every data-driven route is built this way. Deviations need a justification:

```tsx
export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(summaryQueryOptions()),
      context.queryClient.ensureQueryData(playersQueryOptions()),
    ])
  },
  pendingComponent: DashboardSkeleton,
  errorComponent: DashboardError,
  component: Dashboard,
})

function Dashboard() {
  // Data is already in the cache — no second loading state needed.
  const { data: summary } = useSuspenseQuery(summaryQueryOptions())
  const { data: players } = useSuspenseQuery(playersQueryOptions())
  // …
}
```

A page's main data belongs in the `loader`, not in the component — otherwise you get a
waterfall of render, refetch and spinner, and preloading on `Link` hover runs into
nothing. Secondary data with a local parameter (such as the pause preview for the
selected number of courts) stays in the component with `useQuery`.

**Read `docs/tanstack-patterns.md` before your first route.** It covers mutations, SSR
pitfalls (no `new Date()` or `window` during render) and navigation.

## Project structure

```
src/
  paraglide/         # generated — don't edit by hand
  routes/            # TanStack Router files, one per page
  components/
    ui/              # shadcn — generated, don't touch
    layout/          # AppShell, navigation
    <domain>/        # GameCard, PlayerTile, RatingDelta …
  lib/
    types.ts         # domain types — the single source of truth for the UI
    format.ts        # formatting (rating, delta, names, time)
    domain-errors.ts # stable codes and structured expected errors
    api/             # query options and mutation wrappers for server functions
  server/            # server-only: db/, repositories/, middleware/, functions/
  hooks/
messages/            # Paraglide messages for de/en
project.inlang/      # locale and compiler configuration
docs/ui/             # page specs
```

Domain rules — derivations, Glicko-2, matchmaking — belong in `src/lib/`: pure, without
I/O, testable without a database. Not in a repository, not in a server function.

## Conventions

**Language.** German is the base locale and fallback, English the second configured
locale. New user-facing text is maintained in `messages/de.json` and `messages/en.json`;
roadmap package 08 migrates the remaining German legacy text completely. Pure domain
logic returns stable codes or structured results and never phrases user-facing
sentences. Code, file names, types, props and comments are **English**.

**Naming in the UI.** Describe the effect, not the implementation: "Strong player
weight", not `higher_rating_weight`. "Group", not "database".

**Mobile-first.** Without a breakpoint prefix, the phone view applies; `md:` and `lg:`
build on top of it. Score entry is operated at the edge of the court — tap targets at
least 44 px.

**Responsive overlays.** Domain components use
`src/components/layout/ResponsivePanel.tsx` when the same editing step appears as an
overlay on phone and desktop: below `md` as a drawer from the bottom with a swipe handle
and safe-area spacing, from `md` up as a centered dialog. Don't wire up a separate drawer
and dialog in parallel, and don't offer only a desktop dialog. Confirmations for
irreversible actions stay on `ui/alert-dialog`.

**Components.** One file, one responsibility; under 200 lines. Props are explicitly
typed, no `any`. Variants via `cva`, classes merged via `cn()`.

**Immutability.** State is never mutated. Create new objects via spread, arrays via
`map`/`filter`/`toSorted` — never `sort()` or `push()` on state.

**Errors and loading states.** Every query-backed view handles `isPending` and `isError`
visibly. Skeletons for loading states, `Empty` for empty lists, understandable localized
error messages with a retry option. Expected domain errors are translated only at the
presentation boundary; errors are never swallowed.

**No `console.log`** in committed files.

**Accessibility.** Focus stays visible; interactive elements are buttons or links, not
`div`s with click handlers; icons without text get an `aria-label`.

## Tests

What gets tested is what can break silently — not every piece of markup:

- **Required:** everything in `src/lib/` (formatting, sorting, derivations such as the
  pause preview or rating deltas).
- **Worthwhile:** components with state logic (pool tile with three states, result sheet
  with plausibility warnings).
- **Not needed:** pure presentational components without branching.

Tests sit next to the file as `<name>.test.ts(x)`.

Test data comes from **`src/lib/fixtures/`** — `makePlayer()`, `makePool()`, `makeRound()`
and relatives. Every builder takes `overrides` and returns a new object. No file builds
its own players and rounds a second time.

## Storybook

`pnpm storybook` shows the components in their states — in both languages, light and
dark, with the phone as the default view. Switching happens through the toolbar.

Stories sit next to the component as `<name>.stories.tsx` and follow the same rule as
tests: **state variants, not markup.** A component without branching needs no story.

Three things are different there than in the application:

1. **No server functions.** `.storybook/server-function-stubs.ts` replaces everything
   under `@/server/` — otherwise every story would pull Drizzle and `pg` into the bundle.
   If a story does call one, it fails with a clear message. That is intentional.
2. **Data goes into the QueryClient via `parameters.query`**, with the keys from
   `queryKeys`. `src/components/round/RoundPool.stories.tsx` is the template for it.
   Write actions run into the stub — the deliberately chosen boundary of this setup.
3. **Router, theme and language are provided by decorators** (`.storybook/decorators/`).
   They are applied globally; a story has to do nothing for them.
   `src/components/layout/AppShell.stories.tsx` shows the router case.

Storybook builds with its own Vite configuration (`.storybook/vite.config.ts`), because
`tanstackStart()` has no business in a component catalog. Both configs share the
Paraglide options through `paraglide.options.ts`.

## Domain knowledge that shapes the UI

- **Ratings change only when a round is committed.** Everything before that is a preview
  and reversible. That distinction has to be visible.
- **A round can only be committed once every game is entered or cancelled.**
- **Committed rounds are immutable** — a correction would falsify every later rating.
  There is no edit path in the history.
- **RD** is the rating's uncertainty: high for new players, dropping with every game.
- A **pool** is the set of people present today and survives several rounds.
- Pausing is **not an error state** and is not colored like one.

## References

- `docs/tanstack-patterns.md` — **read before your first route.** Route loaders,
  mutations, SSR pitfalls, navigation.
- `docs/server-data-access.md` — **read before your first server function.** Layering,
  repositories, Drizzle, access control, transactions, migrations.
- `docs/ui/pages/*.md` — binding spec per page.
- `docs/ui/components.md` — inventory of the domain components.
