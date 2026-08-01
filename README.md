<div align="center">

<img src="public/roundnet-arena-full.png" alt="Roundnet Arena" width="420" />

**Fair 2v2 matchmaking for roundnet**

Put everyone who showed up into a pool, let the solver build balanced teams that
don't repeat, enter the scores, and watch Glicko-2 ratings take care of themselves.

![License MIT](https://shieldcn.dev/badge/license-MIT-green.svg?variant=outline&mode=light)
![GitHub Last Commit](https://shieldcn.dev/github/last-commit/vercel/next.js.svg?variant=outline&mode=light)
![GitHub CI](https://shieldcn.dev/github/ci/vercel/next.js.svg?variant=outline&mode=light)
![Built in Germany](https://shieldcn.dev/flag/de.svg?mode=light)
![Claude badge](https://shieldcn.dev/badge/Built%20with%20Claude.svg?variant=branded&brand=claude&mode=light)

Hosted Instance: _coming soon_

</div>

---

## What it is

Roundnet is played 2 vs 2, and a session is usually the same problem over and
over: who plays with whom, who plays against whom, and who sits out this round.
Doing that by hand gets unfair fast — the strong players end up together, the
same pairs keep repeating, and nobody tracks who has already paused twice.

Roundnet Arena solves that round by round. Organizers manage their club, its
leagues and its players; every session starts with a pool of the people who
are actually there. The app computes the matchups, records the results, and
updates each player's Glicko-2 rating when the round is committed.

The project is a full rewrite of an earlier Python tool. Domain logic, database
and UI all live in this repository.

## Features

**Session**

- **Pool per session** — mark who is present; the pool survives multiple rounds.
- **Fair matchups** — an exact solver builds the round from rating balance, team
  balance and how often players have already met (see [How it works](#how-it-works)).
- **Fixed teams** — pin pairs that must play together, the solver works around them.
- **Pause handling** — when the player count doesn't fill every court, the app
  picks who sits out and shows a preview before the round starts. Pausing is a
  normal state, not an error.
- **Explained pairings** — every matchup can say *why* it was chosen.
- **Score entry built for the sideline** — mobile-first, large tap targets,
  plausibility warnings on odd results.
- **Immutable history** — a committed round can't be edited, because that would
  falsify every rating that came after it.

**Ratings and stats**

- **Glicko-2 for doubles** — rating, rating deviation and volatility per player,
  updated only on round commit. Everything before that is a reversible preview.
- **Leaderboard** with sortable columns, time ranges and rating deltas.
- **Player profiles** with rating history charts and per-player statistics.

**Clubs and access**

- **Multi-tenant** — clubs (organizations) with multiple leagues, strictly
  isolated data.
- **Accounts for organizers only** — email/password sign-up, email verification,
  password reset. Players are records, they don't need an account.
- **Invitations and join links** for additional organizers, with roles and an
  audit trail.
- **Public read-only view** — a password-protected `/view/<club>` route so club
  members can follow dashboard, running round and history without an account.
- **Club branding** — logo upload and a shared primary color that applies across
  the club's leagues.

**Platform**

- **German and English** throughout the UI and in transactional emails.
- **Light and dark theme**, mobile-first layouts, accessible focus handling.

## How it works

Two pieces of domain logic carry the product. Both are pure, I/O-free modules in
`src/lib/` and are covered by unit tests.

### Matchmaking — `src/lib/matchmaking/`

Building a round is solved as a **set-partitioning problem**, not with a greedy
heuristic. Every combination of four players in the pool becomes a candidate
quartet with a binary variable; the constraint is that each player ends up in
exactly one selected quartet. [glpk.js](https://github.com/jvail/glpk.js) — a
WebAssembly build of the GNU Linear Programming Kit — minimizes the total cost,
with a time limit and an automatic retry on a longer budget.

For each quartet the cheapest of the three possible 2v2 splits is used. A
matchup's cost combines three terms:

| Term                 | What it punishes                                                  |
| -------------------- | ----------------------------------------------------------------- |
| **Rating range**     | The gap between the strongest and weakest player in the game       |
| **Team difference**  | Imbalance between the two teams' combined ratings                  |
| **Repeated players** | Playing with or against the same people again too soon             |

Repetition comes from two decaying weight matrices — one for *same team*, one for
*same game*. Each historical round halves the accumulated weights before adding
its own, so last week's pairing barely matters while the previous round's still
does. A configurable *higher rating weight* lets a club decide how much the
stronger players' balance should dominate the cost.

### Ratings — `src/lib/glicko.ts`

A Glicko-2 implementation adapted for doubles: the two players of a team are
combined into a team rating for the calculation, then each player gets their own
delta back. Rating deviation starts high for new players and shrinks with every
game, so a newcomer's rating moves fast and a regular's moves slowly. Ratings
only change when a round is committed.

## Tech stack

| Area           | Choice                                                                             |
| -------------- | ---------------------------------------------------------------------------------- |
| Framework      | [TanStack Start](https://tanstack.com/start) + React 19 (SSR)                       |
| Routing        | [TanStack Router](https://tanstack.com/router) — file-based, `src/routes/`          |
| Server state   | [TanStack Query](https://tanstack.com/query) for all persisted data                 |
| Server access  | Server Functions (`createServerFn`) — no server routes                              |
| Database       | [PostgreSQL](https://www.postgresql.org) + [Drizzle ORM](https://orm.drizzle.team)  |
| Auth           | [Better Auth](https://better-auth.com) with the organization plugin                 |
| Tables         | [TanStack Table](https://tanstack.com/table)                                        |
| Charts         | [Recharts](https://recharts.org)                                                    |
| Styling        | [Tailwind CSS v4](https://tailwindcss.com) — no `tailwind.config.js`                |
| Components     | [shadcn/ui](https://ui.shadcn.com) v4 (`base-nova`) on [Base UI](https://base-ui.com) |
| Icons          | [HugeIcons](https://hugeicons.com) via `@/components/icons`                         |
| i18n           | [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)             |
| Email          | [React Email](https://react.email) + [Resend](https://resend.com)                   |
| File storage   | [Supabase Storage](https://supabase.com/storage) for club logos                     |
| Optimization   | [glpk.js](https://github.com/jvail/glpk.js) (GLPK compiled to WebAssembly)           |
| Validation     | [Zod](https://zod.dev)                                                              |
| Tests          | [Vitest](https://vitest.dev) + Testing Library                                      |
| Component docs | [Storybook](https://storybook.js.org)                                               |
| Package manager| [pnpm](https://pnpm.io)                                                             |

## Getting started

**Prerequisites:** Node.js 22+, [pnpm](https://pnpm.io/installation), and Docker
(for the local PostgreSQL).

```bash
git clone https://github.com/your-org/roundnet-arena.git
cd roundnet-arena
pnpm install
cp .env.example .env
```

Fill in `.env`. The minimum for local development:

```dotenv
DATABASE_URL=postgresql://roundnet:roundnet@localhost:54329/roundnet
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=a-random-secret-with-at-least-32-characters
```

`RESEND_API_KEY` and `MAIL_FROM` are validated at startup and are needed for
sign-up, verification and invitation mails. `SUPABASE_*` is only required for club
logo uploads, `AUTH_DATABASE_URL` only if Better Auth should connect through its
own database role.

Then bring up the database and the dev server:

```bash
pnpm db:up        # PostgreSQL via Docker on port 54329
pnpm db:migrate   # apply migrations
pnpm db:seed      # idempotent: default group + eight test players
pnpm dev          # http://localhost:3000
```

### Commands

```bash
pnpm dev              # dev server on port 3000
pnpm build            # production build
pnpm test             # Vitest
pnpm typecheck        # tsc --noEmit
pnpm lint             # ESLint
pnpm format           # Prettier (write)

pnpm storybook        # component catalog on port 6006
pnpm email:dev        # React Email preview on port 3001
pnpm i18n:compile     # regenerate Paraglide output

pnpm db:up            # start PostgreSQL
pnpm db:down          # stop it
pnpm db:generate      # generate a migration after schema changes
pnpm db:migrate       # apply migrations
pnpm db:seed          # seed development data
```

Integration tests are skipped unless a database is reachable:

```bash
DATABASE_URL=postgresql://roundnet:roundnet@localhost:54329/roundnet pnpm test
```

Schema changes go through `pnpm db:generate`, and the generated migration is
committed. Existing databases are only ever touched with `pnpm db:migrate`.
The Better Auth schema is regenerated reproducibly with `pnpm auth:generate`.

## Project structure

```
├── src/
│   ├── routes/              # TanStack Router files, one per page
│   ├── components/
│   │   ├── ui/              # shadcn — generated, not hand-edited
│   │   ├── layout/          # AppShell, navigation, responsive panels
│   │   └── <domain>/        # game, round, player, league, organization, …
│   ├── lib/                 # pure domain logic — no I/O, no database
│   │   ├── matchmaking/     # cost function, weight matrices, GLPK solver
│   │   ├── glicko.ts        # Glicko-2 for doubles
│   │   ├── api/             # query options and mutation wrappers
│   │   ├── types.ts         # domain types — single source of truth for the UI
│   │   └── fixtures/        # test data builders
│   ├── server/              # server-only, left exclusively via functions/
│   │   ├── db/              # Drizzle schema, migrations, client, seed, import
│   │   ├── repositories/    # SQL access
│   │   ├── functions/       # server functions — the boundary to the client
│   │   ├── middleware/      # auth and public-view middleware
│   │   └── auth/            # Better Auth setup, email rendering
│   ├── hooks/
│   └── paraglide/           # generated i18n output — not hand-edited
├── emails/                  # React Email templates (de/en)
├── messages/                # Paraglide messages (de.json, en.json)
├── docs/                    # architecture, feature and page specs
│   ├── features/            # auth, i18n, branding, public view, theme
│   ├── ui/pages/            # binding spec per page
│   ├── server-data-access.md
│   └── tanstack-patterns.md
├── public/                  # logos, favicons, manifest
├── .storybook/              # Storybook config, decorators, server stubs
└── drizzle/                 # generated SQL migrations
```

The layering is the rule that matters most: `src/lib/` is pure and testable
without a database, `src/server/repositories/` owns SQL, and
`src/server/functions/` is the only way in or out of `src/server/`.

## Deployment

The app runs on Vercel, and every deployment goes through
[`.github/workflows/ci.yml`](.github/workflows/ci.yml). Automatic Git deployments
are switched off in `vercel.json`, so a push that fails the checks cannot reach
production.

| Job                  | When                | What it does                                                              |
| -------------------- | ------------------- | ------------------------------------------------------------------------- |
| `quality`            | every PR and push   | `i18n:compile`, `lint`, `check`, `typecheck`, `build`                     |
| `test`               | every PR and push   | starts a throwaway PostgreSQL, applies all migrations, runs the full suite |
| `migrate-production` | push to `main` only | `drizzle-kit migrate` against the production database                     |
| `deploy`             | push to `main` only | `vercel build --prod` and `vercel deploy --prebuilt --prod`               |

`quality` and `test` run in parallel; the production jobs only start once both are
green. Because the test job provides `DATABASE_URL`, the integration suites really
run there instead of skipping themselves — against an empty database, which
verifies the migration chain in `drizzle/` along the way.

**Environment variables in Vercel (Production):** `DATABASE_URL`,
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RESEND_API_KEY`, `MAIL_FROM`,
`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, optionally `AUTH_TRUSTED_ORIGINS`.
Serverless functions scale out, so `DATABASE_URL` points at Supabase's transaction
pooler (port 6543) and each pool stays small (`src/server/db/pool-options.ts`).

**GitHub secrets** in the `production` environment: `VERCEL_TOKEN`,
`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and `PRODUCTION_DATABASE_URL` — the latter a
session-mode connection (port 5432 on the pooler host), because migrations need a
session and GitHub runners have no IPv6 for the direct connection.

## Contributing

Contributions are welcome — bug reports, feature ideas and pull requests alike.

1. **Open an issue first** for anything larger than a fix, so the approach can be
   agreed on before you spend time on it.
2. **Fork and branch** off `main`.
3. **Read the guidelines.** [`CLAUDE.md`](CLAUDE.md) documents the house rules, [`docs/server-data-access.md`](docs/server-data-access.md)
   is required reading before your first server function, and
   [`docs/tanstack-patterns.md`](docs/tanstack-patterns.md) before your first route.
4. **Write tests** for anything in `src/lib/` and for components with state logic.
   Test data comes from `src/lib/fixtures/`.
5. **Keep the checks green** — `pnpm typecheck`, `pnpm test`, `pnpm lint` and
   `pnpm build` must all pass.
6. **Commit conventionally** — `feat:`, `fix:`, `refactor:`, `docs:`, `test:`,
   `chore:`, `perf:`, `ci:`.
7. **Open a pull request** describing what changed and how to verify it.

A few conventions are easy to trip over:

- **Base UI, not Radix.** Never install or import `@radix-ui/*`.
- **Icons come from `@/components/icons`**, never directly from `@hugeicons/*`.
- **Tailwind v4 has no config file.** Theme values live in `src/styles.css`.
- **Design tokens only** — `bg-primary`, not `bg-violet-600` or a raw hex value.
- **No data fetching in `useEffect`** — server state goes through TanStack Query,
  a page's main data through its route `loader`.
- **Never mutate state.** New objects via spread, arrays via `map`/`filter`/`toSorted`.
- **No `console.log`** in committed files.
- `src/components/ui/` and `src/paraglide/` are generated. Don't hand-edit them.

## License

[MIT](LICENSE) © Karl Grossmann
