# AI/context.md

Onboarding context for any AI assistant (or new contributor) picking up this
repository. This is the "real" briefing — read it alongside `CLAUDE.md` before
touching anything.

## Project Context

This is a take-home hiring challenge (M-One Frontend Challenge, see
`Frontend-Challenge.pdf`) — a React + TypeScript frontend, not a real product.
The deliverable is a single **user management screen**: list users fetched from
the JSONPlaceholder fixture API (`GET /users`), search/sort/filter them, view a
single user's detail, and edit a user's name so the edit survives a reload.

The challenge explicitly allows using AI tools, and explicitly grades judgement
calls (how ambiguities are resolved and documented) as much as working code.
What's being demonstrated here is **production-minded frontend engineering** —
correct state ownership, honest handling of loading/error/scale, accessibility —
not unnecessary complexity, extra abstractions, or dependencies added for their
own sake.

## Current Architecture

- **React 19** — UI/component architecture, function components + hooks only.
- **TypeScript, `strict: true`** — enforced in `tsconfig.app.json`; no `any`
  anywhere in the codebase.
- **Vite** — dev server and build tooling; also the transform pipeline for
  Vitest (see Testing).
- **TanStack Query** — owns all server state (the users list). One query key,
  one query function.
- **TanStack Router** — owns navigation (which route is active, which user id
  is selected via URL params) and owns list-view state (search term, city
  filter, sort direction) via typed search params on `/users`.
- **React Hook Form** — owns the one form in the app (editing a user's name).
- **`localStorage`** — the persistence layer for local name edits (nothing
  else is persisted).
- **Tailwind CSS + shadcn/ui** — installed and in use. Tailwind utility classes
  are used directly in components; there are no more per-component CSS files.
  shadcn/ui primitives (Button, Input, Label, Select, Table, Card, Alert,
  Separator, Skeleton) live in `src/components/ui/` — copied source per the
  shadcn convention, not an installed package — used as an accessible
  component *foundation*, not a design system: no custom token/theming layer
  beyond the color variables in `src/index.css`, no component catalog beyond
  what's actually used. Toasts use `sonner` (shadcn's current recommendation)
  via `src/components/ui/sonner.tsx`.
- **Vitest + jsdom** — the test runner, added in Step 11.

Actual repo structure (don't invent directories beyond this):

```
src/
├── App.tsx                    RouterProvider + <Toaster />
├── RootLayout.tsx             root route's <Outlet /> shell + ThemeToggle
├── ThemeToggle.tsx            light/dark toggle button
├── router.ts                  route tree: '/', '/users', '/users/$userId'
├── main.tsx                   React root, QueryClientProvider
├── index.css                  Tailwind import + shadcn CSS variables ([data-theme])
├── types/
│   └── user.ts                the `User` domain type
├── lib/
│   ├── usersApi.ts            fetchUsers() — the one fetch() call in the app
│   ├── usersApi.test.ts
│   ├── queryClient.ts         new QueryClient(), no custom options
│   ├── useTheme.ts            light/dark theme state, persisted to localStorage
│   ├── utils.ts                shadcn's `cn()` class-merging helper
│   └── devNetworkSimulation.ts  dev-only slow/fail/many simulation helpers
├── components/ui/             shadcn/ui primitives only (button, input, label,
│                               select, table, card, alert, separator, skeleton,
│                               sonner) — not app-specific components
└── features/users/
    ├── api/useUsers.ts        the one useQuery() call, queryKey: ['users']
    ├── lib/
    │   ├── deriveVisibleUsers.ts    pure search+filter+sort+paginate, deriveVisibleUsers.test.ts
    │   ├── useUsersListFilters.ts   shared hook: reads/writes search/city/sort/page on the URL
    │   └── userNameEdits.ts         localStorage read/write + getEffectiveUser, .test.ts
    └── components/
        ├── UserListPage.tsx, UserList.tsx, UsersFilters.tsx
        ├── UserDetailPage.tsx, EditUserNameForm.tsx
```

`AI/context.md` (this file) lives at the repo root under `AI/`, alongside
`Frontend-Challenge.pdf`, `README.md`, and `CLAUDE.md`.

## State Ownership

This is the single most important thing to internalize before editing anything:

- **TanStack Query → server state.** The users array as fetched from the API.
  Lives in the Query cache under `queryKey: ['users']`. Never mutated in place.
- **TanStack Router → URL/navigation state, and list-view state.** Which route
  is active (list vs. detail), which user id is selected (`/users/$userId`'s
  `userId` param), and `search`/`city`/`sort`/`page` as typed search params on
  the `/users` route (`validateSearch` in `src/router.ts`). All fields are
  optional so defaults never appear in the URL; the shared
  `useUsersListFilters()` hook (`features/users/lib/useUsersListFilters.ts`)
  is the only place that reads them via `usersListRoute.useSearch()`, applying
  a local default (`''`, `ALL_CITIES`, `'asc'`, `1`) for whichever are absent
  — both `UserList.tsx` and `UsersFilters.tsx` consume this hook rather than
  each re-deriving the defaulting logic. Updates go through the hook's
  `updateSearch`/`updateCity`/`updateSort`/`setPage`, all calling
  `usersListRoute.useNavigate()` with `replace: true`, so typing in the search
  box, changing a filter/sort, or flipping pages never creates a new history
  entry — only navigating to a detail page (and back) does. Changing
  search/city/sort also resets `page` to 1, since the result set (and
  therefore what "page 2" means) has changed.
- **`localStorage` → persisted local name edits.** Keyed by user id, holding
  `{ name, editedAt }`. Nothing else is persisted.
- **React Hook Form → the edit form's own field/validation state.** Local to
  `EditUserNameForm`, not lifted anywhere else.
- **Derived functions** (`deriveVisibleUsers.ts`, `getEffectiveUser` in
  `userNameEdits.ts`) compute what's actually rendered from (server users) +
  (local edits) + (view state) — the "visible users" the UI shows are never a
  separately-stored piece of state, always a fresh computation.

Explicit rules, already enforced in the current code and in `CLAUDE.md`:

- **DO NOT** reintroduce a client state library (Zustand, Redux, etc.) for
  view state — the URL already owns `search`/`city`/`sort`, and there is
  nothing else left that needs one.
- **DO NOT** store `selectedUserId` anywhere but the route path — it lives
  only in the router.
- **DO NOT** use the browser History API directly (`window.history`,
  `window.location`) for navigation — TanStack Router owns this, including
  the `replace: true` semantics for list-view search param updates.

## User Data and Local Edits

- Server `User` shape (`src/types/user.ts`), intentionally trimmed to only the
  fields the app actually uses (not every JSONPlaceholder field):
  ```ts
  interface User {
    id: number
    name: string
    email: string
    phone: string
    address: { city: string }
    company: { name: string }
  }
  ```
- The API response is runtime-validated (`isUser` type guard in
  `usersApi.ts`) before being trusted as `User[]` — no blind `as User[]` cast.
- **Only `name` is editable.** No other field has an edit UI.
- Edits are persisted in `localStorage` under key `'users:name-edits'`, as
  `{ [userId]: { name, editedAt } }` — never the whole user object, never the
  whole dataset.
- Raw server data is never mutated: `getEffectiveUser(user)` always returns a
  **new** object when an edit exists, leaving the input untouched.
- **Conflict policy: LOCAL EDIT WINS, unconditionally.** If a local edit exists
  for a user, it is shown instead of the server's value for that field —
  regardless of how recent the server response is, with no timestamp
  comparison. This is a deliberate, documented decision (see the comment on
  `getEffectiveUser` in `userNameEdits.ts`), not a placeholder. Do not silently
  change this policy — see "Things Future AI Assistants Must Never Do."

## Networking

- `GET https://jsonplaceholder.typicode.com/users` — the only network call in
  the app (`src/lib/usersApi.ts`).
- TanStack Query owns the entire query lifecycle via `useUsers()`
  (`src/features/users/api/useUsers.ts`), `queryKey: ['users']`.
- Loading/error/empty states are handled explicitly and distinctly in both
  `UserList.tsx` and `UserDetailPage.tsx` (`isPending` / `isError` / a
  dedicated "no users found" vs. "no results match your filters" distinction).
- Retry is wired to TanStack Query's own `refetch()`, gated by `isFetching` so
  it can't be double-triggered — no custom retry machinery.

**Stale-response / race strategy**: search/sort/filter are 100% client-side
transformations of already-fetched data (`deriveVisibleUsers.ts`) — they never
trigger a network request. There is therefore **no custom debounce,
request-id, or `AbortController` logic for typing**, because there is nothing
for it to guard against in this architecture. For the one real network call
that exists, TanStack Query's own query-identity tracking is what prevents a
stale/superseded fetch from ever overwriting newer state. **Do not add custom
race-management code unless the networking architecture actually changes**
(e.g., if search ever becomes server-side).

## Development Network Simulation

`src/lib/devNetworkSimulation.ts`, wired into `fetchUsers()` behind
`import.meta.env.DEV`:

- `?slow=3000` — delays resolution by the given milliseconds.
- `?fail=1` — throws a deterministic simulated error, without calling the real
  endpoint at all.
- `?many=500` — expands the real 10 users into a larger synthetic set with
  stable, unique ids.

Important properties:
- These are **development/debug tools only** — dead-code-eliminated from the
  production bundle (verified by grepping the build output for
  distinguishing strings; zero matches).
- They are **not application state** and **not part of the TanStack Query
  key** — changing `?slow=`/`?fail=`/`?many=` on an already-cached `/users`
  visit won't retrigger a fetch by itself; a fresh load or the Retry button is
  needed to pick up a changed flag.
- Production behavior and the real API contract are completely unaffected.

## Routing

- `/` — redirects to `/users` (`beforeLoad` + `redirect`, not a manual
  history call).
- `/users` — the list route (`UserListPage` → `UserList`).
- `/users/$userId` — the detail route (`UserDetailPage`), reading `userId`
  from the route param via `userDetailRoute.useParams()`.
- Direct navigation to a detail URL works: `UserDetailPage` calls the same
  `useUsers()` query independently, so it doesn't depend on the list having
  been visited first — it shows the same loading/error states while the query
  resolves.
- Browser Back/Forward work through TanStack Router's own history
  integration — no manual `window.history`/`popstate` handling anywhere.
- A user id with no match in the loaded data renders an explicit "No user
  found" state with a link back to the list — never a crash, never a blank
  page.

**Do not** introduce React Router or any raw History API usage — TanStack
Router is the sole navigation mechanism.

## UI / Accessibility

- The user list renders as a real shadcn `<Table>` (semantic `<table>`, not a
  styled `<ul>`) — appropriate now that each row has multiple genuinely
  tabular fields (name/email/phone/city/company). Each row is a mouse-clickable
  `<TableRow>`, but the actual keyboard/screen-reader affordance is a real
  `<Link>` in the name cell — the row click is a convenience layered on top,
  never a replacement for it.
- Radix UI (via shadcn's `Select`, used for the city filter and sort control)
  provides its own keyboard interaction, focus management, and ARIA — not
  reimplemented by this project.
- Visible `:focus-visible` rings everywhere, via shadcn's shared `--ring`
  token — buttons, inputs, and the select trigger all use the same ring.
- Responsive: the table hides lower-priority columns (Company, then Phone) at
  narrower breakpoints via Tailwind's `hidden`/`table-cell` utilities; Name and
  City stay visible at every width. The table's own container scrolls
  horizontally as a fallback rather than ever forcing the page to scroll.
- **Fixed filters, scrollable content, paginated rows.** `RootLayout.tsx` is a
  bounded `h-svh` shell (not `min-h-svh`) so the routed page gets exactly the
  remaining viewport height, not more. `UserList.tsx` splits that height into:
  heading/filters/count (`shrink-0`, never scrolls), the table
  (`overflow-y-auto`, with its own `sticky` header row), and pagination
  (`shrink-0`, always visible below the scroll region). This means the filter
  toolbar and search box are never scrolled out of view even with hundreds of
  rows (`?many=`) — only the row content scrolls. Pagination is 20 users per
  page (`USERS_PAGE_SIZE`, `getTotalPages`/`paginateUsers` in
  `deriveVisibleUsers.ts`), with the current page held in the URL (`?page=`)
  via `useUsersListFilters`. Do not revert this to a `min-h-svh`/page-scrolls
  layout without re-establishing an equivalent "controls always visible" story.
- Distinct loading (shadcn `Skeleton`, respecting `prefers-reduced-motion` via
  Tailwind's `motion-safe:` variant) / error+retry (shadcn `Alert` +
  `Button`) / empty / success states everywhere data is shown, never
  conflated. The "no matches" empty state has a "Clear search and filters"
  recovery action.
- Invalid form input gets a real visual marker (border/ring change via
  `aria-invalid`), not just adjacent text; the validation message is styled
  with the `destructive` (red) token, not color alone — the message text
  itself already states the problem.
- shadcn/ui is used as a component *foundation* here, not a design system: nine
  primitives, each backing a real interaction, composed with Tailwind classes
  specific to this app — no custom token/theming architecture beyond
  `src/index.css`'s color variables.
- Light/dark theme is a manual toggle (`ThemeToggle.tsx` + `lib/useTheme.ts`),
  persisted to `localStorage` under `theme-preference`, applied via a
  `data-theme` attribute on `<html>`. `index.css` defines light tokens on
  `:root` and overrides them under `[data-theme='dark']`; an inline bootstrap
  script in `index.html` sets the attribute before first paint to avoid a
  flash of the wrong theme. `sonner`'s `Toaster` reads the same hook so toasts
  match the active theme.

## Testing

**Stack**: Vitest + jsdom (`vite.config.ts`'s `test: { environment: 'jsdom' }`
block; `npm run test` → `vitest run`).

**What is actually tested** (3 files, 36 tests):
- `deriveVisibleUsers.test.ts` — search by name/email (case-insensitive,
  trimmed), city filtering, ascending/descending sort, combined
  search+filter+sort, no-mutation of the input array, `getAvailableCities`,
  and pagination (`getTotalPages`, `paginateUsers`: even/partial/out-of-range
  pages).
- `userNameEdits.test.ts` — save/read roundtrip, local-edit-wins-over-server,
  and malformed `localStorage` (invalid JSON, non-object, malformed
  individual entries, `setItem` throwing) never crashing the app.
- `usersApi.test.ts` — valid response parsing, non-ok/malformed response
  rejection, and the dev-simulation branches (`?fail=1`, `?many=`).

**What is explicitly NOT tested**:
- No component-level React Testing Library suite (no RTL/jest-dom installed).
- No Playwright/E2E suite.
- No visual regression tests.
- "Survives reload" is tested honestly as **write → read persistence** within
  a test, using jsdom's real `localStorage` — not a literal browser reload,
  which a unit test cannot perform. The actual browser-reload behavior was
  verified manually during implementation, not by this suite.

No coverage percentage is claimed anywhere — none has been measured (no
coverage tool is installed).

## Git / Commit Rules

Claude **MUST NOT**:
- `git commit`
- `git push`
- `git reset`
- rewrite history (rebase, amend, force-push)
- discard user changes (`checkout --`, `restore`, `clean -f` on tracked work)
- blindly run `git add .`
- modify unrelated files while implementing a specific task

Claude **MAY**:
- inspect `git status`
- inspect `git diff`
- inspect `git log`
- recommend exact staging/commit commands for the human to run

**The human developer owns every commit and push.** Prefer small, incremental
commits that match their diffs — this repo's own history (`git log
--oneline`) already follows that pattern; keep it up.

## Important Traps

- `localStorage` is browser-only, per-device, per-browser storage — it is
  **not real persistence** and is explicitly out of scope for anything beyond
  what it already does here.
- Because local-edit-wins is unconditional, a local edit can become
  permanently stale relative to whatever the server later returns for that
  field — this is a known, accepted tradeoff of the chosen policy, not a bug
  to silently "fix."
- The API (`jsonplaceholder.typicode.com`) is a fixture: it always returns the
  same 10 users, instantly, and never fails for real. The app still has to
  visibly handle loading/error/scale — see Development Network Simulation for
  how those states are actually demonstrated.
- Do not treat the fixture's in-memory/idempotent behavior as anything like
  real backend persistence — there is no backend.
- Dev-simulation query params (`?slow=`, `?fail=`, `?many=`) are deliberately
  **not** part of TanStack Query's cache key — don't "fix" this by adding them
  to the key; that would change real caching behavior for a debug-only concern.
- No unnecessary dependencies, no backend, no auth, no overengineering — this
  is a five-screen-behavior challenge, not a platform.

## Things Future AI Assistants Must Never Do

- Never reintroduce a client state library (Zustand, Redux, etc.) for view
  state or navigational state — the URL/route already owns all of it.
- Never add `selectedUserId` anywhere but the route path.
- Never replace TanStack Router with React Router.
- Never use the raw History API (`window.history`, `window.location`
  manipulation) for navigation.
- Never mutate a server `User` object in place.
- Never use an array index as a React `key` for user lists.
- Never use `any` in TypeScript.
- Never weaken `strict` TypeScript or disable ESLint rules to force a pass.
- Never add a dependency without explicit justification (check
  `CLAUDE.md`'s Technology Stack and `package.json` first).
- Never `git commit` or `git push`.
- Never modify files unrelated to the requested task.
- Never silently change the local/server conflict policy (local-edit-wins) —
  changing it is a product decision that needs to be explicit and documented.
- Never claim a requirement is implemented without actually reading the
  current code to verify it.
- Never add an abstraction (a component, a hook, a "design system" layer)
  just for the sake of having one — every abstraction in this codebase so far
  exists because a second real usage justified it.
- Never replace shadcn/ui with another component library (MUI, Ant, Chakra,
  etc.) — it's the approved, already-installed component foundation.
- Never add a shadcn/ui primitive that isn't backing a real interaction
  already present in this app, and never build a token/theming architecture
  on top of it beyond what `src/index.css` already defines — that would cross
  into "a design system," which the challenge explicitly excludes.
- Never introduce a second styling approach (CSS-in-JS, a second utility
  framework, per-component CSS files) alongside Tailwind — one styling system.

## Current Known Gaps

These are real, current gaps — not invented ones:
- **No component-level or E2E test coverage** — see Testing above; this is a
  deliberate scope choice so far, not an oversight, but it means UI rendering
  logic itself (as opposed to the pure functions behind it) is unverified by
  automated tests. This includes the Tailwind/shadcn migration itself — the
  new Table/Select/Alert markup was verified by `tsc`/`lint`/`build`/code
  review, not by a live browser session or a component test.
- **The production JS bundle grew substantially after adopting Tailwind +
  shadcn/ui/Radix** (~371 KB → ~532 KB minified, per `pnpm build`) — Vite now
  warns about a chunk over its 500 KB default threshold. No code-splitting
  was added; reasonable for this challenge's scope, a real concern at
  production scale (see README's "What Is Still Wrong With This").
- **View state (search/city/sort) now survives a reload**, via URL search
  params on `/users` (`validateSearch` in `src/router.ts`) — this was
  previously a Zustand-only store with no persistence, named in the README as
  an unresolved tension with "nothing a user has done should disappear." That
  gap is closed; the README's "What Is Still Wrong With This" section was
  updated accordingly.

## How to Use This Context

Future AI sessions working on this repository should:

1. Read `CLAUDE.md` first — the project's standing rules and conventions.
2. Read `AI/context.md` (this file) next — the current, concrete state of the
   implementation.
3. Inspect the current code before making changes — this file will drift as
   the project evolves, so verify against the actual files (and `git log`)
   rather than trusting this document blindly for anything load-bearing.
4. Check `git status` before modifying anything, to see what's already
   in-progress versus committed.
5. Keep changes scoped to the requested task — don't drift into unrelated
   files or unrequested refactors.
6. Run the relevant validation after changes (`npx tsc -b`, `npm run lint`,
   `npm run build`, `npm run test` as applicable).
7. Never commit or push — that's the human developer's action, always.
