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
- **TanStack Router** — owns navigation: which route is active, and which user
  id is selected, via URL params.
- **Zustand** — owns UI/view state only (search term, city filter, sort
  direction).
- **React Hook Form** — owns the one form in the app (editing a user's name).
- **`localStorage`** — the persistence layer for local name edits (nothing
  else is persisted).
- **Plain, component-scoped CSS** — no Tailwind/shadcn are installed despite
  being named in `CLAUDE.md`'s approved-stack list; the actual responsive/
  accessibility pass (Step 10) was implemented with hand-written CSS files
  per component plus a small shared `.btn` class in `src/index.css`. Treat
  `CLAUDE.md`'s stack list as a ceiling of what's *allowed*, not a description
  of what's *installed* — always check `package.json` for ground truth.
- **Vitest + jsdom** — the test runner, added in Step 11.

Actual repo structure (don't invent directories beyond this):

```
src/
├── App.tsx                    RouterProvider wiring
├── RootLayout.tsx             root route's <Outlet /> shell
├── router.ts                  route tree: '/', '/users', '/users/$userId'
├── main.tsx                   React root, QueryClientProvider
├── index.css                  CSS variables, dark-mode tokens, shared .btn
├── types/
│   └── user.ts                the `User` domain type
├── lib/
│   ├── usersApi.ts            fetchUsers() — the one fetch() call in the app
│   ├── usersApi.test.ts
│   ├── queryClient.ts         new QueryClient(), no custom options
│   └── devNetworkSimulation.ts  dev-only slow/fail/many simulation helpers
└── features/users/
    ├── api/useUsers.ts        the one useQuery() call, queryKey: ['users']
    ├── store/useUsersViewStore.ts   Zustand: search/selectedCity/sortDirection
    ├── lib/
    │   ├── deriveVisibleUsers.ts    pure search+filter+sort, deriveVisibleUsers.test.ts
    │   └── userNameEdits.ts         localStorage read/write + getEffectiveUser, .test.ts
    └── components/
        ├── UserListPage.tsx, UserList.tsx (+.css), UsersFilters.tsx (+.css)
        ├── UserDetailPage.tsx (+.css), EditUserNameForm.tsx (+.css)
```

`AI/context.md` (this file) lives at the repo root under `AI/`, alongside
`Frontend-Challenge.pdf`, `README.md`, and `CLAUDE.md`.

## State Ownership

This is the single most important thing to internalize before editing anything:

- **TanStack Query → server state.** The users array as fetched from the API.
  Lives in the Query cache under `queryKey: ['users']`. Never mutated in place.
- **Zustand → UI/view state only.** `search`, `selectedCity`, `sortDirection`.
  Nothing else.
- **TanStack Router → URL/navigation state.** Which route is active (list vs.
  detail) and which user id is selected (`/users/$userId`'s `userId` param).
- **`localStorage` → persisted local name edits.** Keyed by user id, holding
  `{ name, editedAt }`. Nothing else is persisted.
- **React Hook Form → the edit form's own field/validation state.** Local to
  `EditUserNameForm`, not lifted anywhere else.
- **Derived functions** (`deriveVisibleUsers.ts`, `getEffectiveUser` in
  `userNameEdits.ts`) compute what's actually rendered from (server users) +
  (local edits) + (view state) — the "visible users" the UI shows are never a
  separately-stored piece of state, always a fresh computation.

Explicit rules, already enforced in the current code and in `CLAUDE.md`:

- **DO NOT** put users/server data into Zustand.
- **DO NOT** store `selectedUserId` in Zustand — it lives only in the router.
- **DO NOT** use the browser History API directly (`window.history`,
  `window.location`) for navigation — TanStack Router owns this.

## User Data and Local Edits

- Server `User` shape (`src/types/user.ts`), intentionally trimmed to only the
  fields the app actually uses (not every JSONPlaceholder field):
  ```ts
  interface User {
    id: number
    name: string
    email: string
    address: { city: string }
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

Current, already-implemented expectations (Step 10):
- Semantic HTML throughout: real `<button>`/`<a>` (via `Link`)/`<label>`/
  `<dl>`, no clickable `<div>`s.
- Every interactive element is keyboard-operable; nothing depends on a mouse.
- Visible `:focus-visible` rings on every interactive element, including the
  detail page's "Back to users" link and both Retry buttons.
- Responsive layout: a fluid CSS grid for the list, a side gutter on `#root`,
  no fixed widths that break small screens.
- `overflow-wrap: break-word` (+ `min-width: 0` on the relevant flex/grid
  containers) protects against long names/emails/cities overflowing —
  relevant both for real long values and for the `?many=` dev dataset.
- Distinct loading / error+retry / empty / success states everywhere data is
  shown, never conflated.
- Invalid form input gets a real visual marker (border change), not just
  adjacent text.
- No design-system abstraction was introduced — one small shared `.btn` class
  consolidates genuinely duplicated button CSS; that's the extent of it.

## Testing

**Stack**: Vitest + jsdom (`vite.config.ts`'s `test: { environment: 'jsdom' }`
block; `npm run test` → `vitest run`).

**What is actually tested** (3 files, 29 tests):
- `deriveVisibleUsers.test.ts` — search by name/email (case-insensitive,
  trimmed), city filtering, ascending/descending sort, combined
  search+filter+sort, no-mutation of the input array, `getAvailableCities`.
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

- Never move server state into Zustand.
- Never add `selectedUserId` (or any navigational state) to Zustand.
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

## Current Known Gaps

These are real, current gaps — not invented ones:
- **`README.md` has not been written yet.** It is still the generic Vite
  template. The challenge requires it to document: the level being applied
  for, how to run the project, all the decisions listed in `CLAUDE.md`
  (conflict policy, styling choice, etc.), a "what's still wrong with this"
  section, and a "what I'd need before building this for real" section. This
  is a required, not-yet-done deliverable.
- **No component-level or E2E test coverage** — see Testing above; this is a
  deliberate scope choice so far, not an oversight, but it means UI rendering
  logic itself (as opposed to the pure functions behind it) is unverified by
  automated tests.
- **Tailwind/shadcn are listed as approved in `CLAUDE.md` but are not
  installed** — the actual styling implementation is plain CSS. Worth
  reconciling in `CLAUDE.md` or the README so the two don't silently drift.
- **The ambiguities named in `CLAUDE.md`'s "Known traps and ambiguities"
  section have been resolved in code but not yet written up in the README** —
  the decisions exist (e.g., search matches the effective/edited name, city
  filter is exact-match via a dropdown), but the required README write-up
  connecting decision-to-rationale hasn't happened yet.

## How to Use This Context

Future AI sessions working on this repository should:

1. Read `CLAUDE.md` first — the project's standing rules and conventions.
2. Read `AI/context.md` (this file) next — the current, concrete state of the
   implementation.
3. Inspect the current code before making changes — this file describes the
   state as of Step 12; it will drift, so verify against the actual files
   rather than trusting this document blindly for anything load-bearing.
4. Check `git status` before modifying anything, to see what's already
   in-progress versus committed.
5. Keep changes scoped to the requested task — don't drift into unrelated
   files or unrequested refactors.
6. Run the relevant validation after changes (`npx tsc -b`, `npm run lint`,
   `npm run build`, `npm run test` as applicable).
7. Never commit or push — that's the human developer's action, always.
