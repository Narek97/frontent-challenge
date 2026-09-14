# M-One Frontend Challenge

A user management screen built with React and TypeScript against the
JSONPlaceholder fixture API: a searchable, sortable, filterable user list; a
per-user detail view; and an inline name edit that persists across a reload.
The stack is TanStack Query (server state), TanStack Router (navigation),
Zustand (view state), React Hook Form (the one form), and `localStorage`
(local edits) — chosen to keep each concern owned by exactly one thing, not
to maximize the dependency count.

## Level Applying For

Senior Frontend Engineer / Senior React + TypeScript Engineer

## Tech Stack

| Technology | Why |
|---|---|
| **React 19** | Component model for the UI; function components + hooks throughout. |
| **TypeScript, `strict: true`** | Enabled in `tsconfig.app.json`; no `any` anywhere in the codebase — catches boundary and null-safety mistakes at compile time. |
| **Vite** | Dev server and production build; also powers Vitest's transform pipeline, so there's one toolchain, not two. |
| **TanStack Query** | Owns fetching, caching, and loading/error state for the users list — no hand-rolled fetch/loading-state logic, and its query-identity guarantees are what keep the app safe from stale/out-of-order responses (see Networking). |
| **TanStack Router** | Owns navigation and the selected-user id via the URL (`/users`, `/users/:id`), so back/forward and direct links work through the browser's own history, not a hand-rolled one. |
| **Zustand** | Owns UI/view state only — search term, city filter, sort direction. A tiny, dependency-free store was enough; a bigger state library would be solving a problem this app doesn't have. |
| **React Hook Form** | Owns the one form in the app (editing a user's name) — field state and validation without re-render-on-every-keystroke overhead. |
| **`localStorage`** | The only persistence mechanism available without a backend; stores local name edits only, never the whole dataset. |
| **Plain, component-scoped CSS** | No Tailwind or shadcn/ui are installed in this project — responsive/accessibility work (semantic markup, focus states, overflow handling, a small shared `.btn` class) was done with hand-written CSS files per component plus shared tokens in `src/index.css`. |
| **Vitest + jsdom** | Test runner and DOM environment for the unit suite — reuses Vite's config instead of a separate Jest setup. |

## Getting Started

Package manager is **pnpm** (only `pnpm-lock.yaml` is committed).

```bash
# install dependencies
pnpm install

# start the dev server (fixed at http://localhost:3000, see vite.config.ts)
pnpm dev

# lint
pnpm lint

# typecheck (no dedicated script exists; this is the exact command used throughout development)
npx tsc -b

# run the test suite
pnpm test

# production build (runs tsc -b, then vite build)
pnpm build
```

The dev server is configured (`vite.config.ts`, `server.port`) to always run at
**http://localhost:3000**. `strictPort` is enabled, so if port 3000 is already
in use, Vite fails with an error instead of silently starting on a different
port — the URL above is always accurate when the command succeeds.

`pnpm preview` serves the production build locally if you want to check it after `pnpm build`.

## Implemented Requirements

| Requirement | Status | Notes |
|---|---|---|
| `GET` users from JSONPlaceholder | ✅ Done | `src/lib/usersApi.ts`, runtime-validated response. |
| User list | ✅ Done | `UserList.tsx`. |
| Search by name or email | ✅ Done | Client-side, case-insensitive substring match; searches the *effective* (edited-if-present) name and the server email. |
| Sort by name | ✅ Done | Ascending/descending toggle, case-insensitive, stable ordering. |
| Filter by city | ✅ Done | Exact-match dropdown populated from the currently loaded users. |
| User detail view | ✅ Done | `/users/:id` route, works via direct navigation too. |
| Edit user's name | ✅ Done | React Hook Form, non-empty validation, trims whitespace before saving. |
| Edit survives reload | ✅ Done | Persisted in `localStorage`; verified manually during development. Not covered by a browser-automation test (see Testing). |
| Local/server conflict policy | ✅ Decided and implemented | Local edit wins unconditionally (see Data and Persistence). |
| Loading / error / empty states | ✅ Done | Distinct states in both list and detail views; error state has a retry action. |
| Slow network demonstration | ✅ Done, dev-only | `?slow=3000` query param (see Development Network Simulation). |
| Failed request demonstration | ✅ Done, dev-only + real path | `?fail=1` simulates it deterministically; the real error path also fires on any genuine fetch failure. |
| Many-rows demonstration | ✅ Done, dev-only | `?many=500` expands the fixture data client-side. |
| Stale/out-of-order response handling | ✅ Handled by architecture, no custom code | See Networking and Race Conditions — deliberately not hand-rolled. |
| Back/forward navigation | ✅ Done | TanStack Router's own history integration. |
| Responsive layout | ✅ Implemented at the code level | Fluid grid, side gutter, no fixed widths that break narrow screens. Live multi-device verification not completed — see Responsive / Accessibility Verification. |
| Accessibility | ✅ Implemented at the code level | Semantic HTML, labels, focus-visible states, ARIA roles. No automated audit tool or screen-reader pass performed — see below. |
| TypeScript strict mode | ✅ Done | `tsconfig.app.json`, `"strict": true`; `npx tsc -b` passes with zero `any`. |
| Tests | ✅ Done, scoped | 3 files, 29 unit tests (Vitest). No component or E2E suite. |
| `AI/context.md` | ✅ Done | Committed, describes the actual current implementation. |
| Incremental git history | ✅ Done | 15 commits as of this writing, each scoped to one implementation step (see Git History). |

## Architecture

State is split by *kind*, with exactly one owner per kind:

| State | Owner | Notes |
|---|---|---|
| Server users | **TanStack Query** | `queryKey: ['users']`, one query function, cached and never mutated in place. |
| Search term, city filter, sort direction | **Zustand** | View-only state; nothing else lives here. |
| URL / navigation, selected user | **TanStack Router** | Route params (`/users/:id`) are the single source of truth for "which user is open." |
| Local name edits | **`localStorage`** | Keyed by user id, `{ name, editedAt }`. |
| Edit form state | **React Hook Form** | Local to the one form component; not lifted anywhere. |
| Visible users (what's actually rendered) | **Derived, not stored** | `deriveVisibleUsers.ts` computes the list from (server users → local edits applied → search/filter/sort applied) fresh on every render. |

**Why server data is not in Zustand**: putting the users array in Zustand would create a second cache alongside TanStack Query's, with no automatic way to keep them in sync — every fetch, retry, and background refetch would need to manually write into both places, and any place that read from the "wrong" one would silently show stale data. Keeping server state in exactly one place (the Query cache) means there is only ever one truthful answer to "what did the server return," and Zustand is free to hold only what it's actually good at: transient, client-only UI preferences.

## Data and Persistence

- The `User` shape used in this app (`src/types/user.ts`) is deliberately narrower than the full JSONPlaceholder record — `id`, `name`, `email`, `address.city` — because those are the only fields any requirement touches.
- The API response is runtime-validated (a type guard in `usersApi.ts`) before being trusted as `User[]`; a response with a missing/wrong-typed field is rejected rather than silently cast.
- **Only the `name` field is editable.** No other field has an edit affordance.
- Edits are stored in `localStorage` under one key, as a record of `{ [userId]: { name, editedAt } }` — the edit only, never the whole user object, never the whole dataset.
- Raw server data is never mutated: the function that merges an edit onto a user (`getEffectiveUser`) always returns a new object when an edit exists, leaving the fetched object untouched.
- **Conflict policy: the local edit wins, unconditionally.** If a local edit exists for a user, it is shown instead of whatever the server just returned for that field — with no timestamp comparison, no "was this edited before or after the last fetch" logic. The reasoning: the requirement that "nothing a user has done should disappear because they reloaded the page" is the harder constraint to violate — silently discarding a user's edit because a background refetch happened to return the old server value would break exactly that guarantee. This is a genuine simplification, not a full conflict-resolution system (see What Is Still Wrong With This).
- **This is browser persistence, not real persistence.** `localStorage` is per-browser, per-device, and cleared by the user at will. There is no backend, no database, and no server-side record of the edit — reflecting the challenge's own "not in scope: real persistence beyond the browser."

## Networking and Race Conditions

There is exactly one network call in the app: `GET https://jsonplaceholder.typicode.com/users`, owned end-to-end by TanStack Query (`useUsers()`, `queryKey: ['users']`).

**Search, sort, and city filtering are entirely client-side** — they transform the already-fetched array in memory (`deriveVisibleUsers.ts`) and never trigger a new request. Because of that, **there is no custom debounce, request-id, or `AbortController` implementation for typing** — there is no per-keystroke fetch for such logic to guard.

For the one fetch that does exist, correctness against stale/out-of-order results is TanStack Query's job, not this app's: it deduplicates concurrent fetches for the same query key and only ever commits the result of the most recently valid fetch to its cache, discarding anything superseded. This is a documented library guarantee, not something re-implemented or independently verified by this project's own tests — the claim here is "the architecture doesn't need to solve this problem itself," not "we've proven the library's internals." If search or filtering ever became server-side, that would change, and race-handling code would need to be added at that point.

## Development Network Simulation

Three URL query parameters, read in `src/lib/devNetworkSimulation.ts` and applied inside `fetchUsers()`:

- `?slow=3000` — delays the fetch's resolution by the given milliseconds.
- `?fail=1` — rejects deterministically, without calling the real endpoint at all.
- `?many=500` — expands the real 10 users into a larger synthetic set with stable, unique ids, for exercising the list/search/sort/filter at scale.

Properties worth knowing:
- These are **development-only tools**, gated behind `import.meta.env.DEV` and confirmed removed from the production bundle (checked by grepping the built output for distinguishing strings — zero matches).
- They are **not application state** and are **not part of the TanStack Query key** — changing them doesn't invalidate the cache.
- Because of that, changing `?slow=`/`?fail=`/`?many=` on an already-cached `/users` visit won't retrigger a fetch by itself; a fresh page load or the Retry button is needed to pick up a new value.

## Responsive / Accessibility Verification

To be precise about what was actually verified, versus implemented but unverified in a live environment:

**Code-level checks performed:**
- Every interactive element is a native `<button>`, `<a>` (via `Link`), `<input>`, `<select>`, or `<label>` — no click handlers on non-interactive elements.
- `:focus-visible` styles are defined for every interactive element, including the detail page's back link and both retry buttons.
- `role="status"` for loading/empty states, `role="alert"` for errors and validation messages.
- Invalid form input gets a visible border change, not just adjacent text.
- `overflow-wrap: break-word` (plus `min-width: 0` on the containing flex/grid items) is applied to name/email/city text, checked by reasoning through the CSS cascade against long values (including the `?many=` synthetic dataset's longer names/emails).
- A fluid CSS grid (`auto-fill`/`minmax`) with a single breakpoint reflows from desktop to narrow widths without fixed pixel widths that would break small screens.

**Build/static validation performed:**
- `npx tsc -b`, `pnpm lint`, and `pnpm build` all pass with these styles and markup in place.
- The production bundle was checked (grep) to confirm dev-only code doesn't leak into it.

**Not performed, stated honestly:** no live testing on a real phone or tablet, no manual pass with a screen reader (VoiceOver/NVDA/JAWS), no automated accessibility audit tool (axe, Lighthouse) was run, and no interactive browser-DevTools responsive-mode click-through was completed — browser automation was unavailable during this project's build. What's documented above is code review and static tooling, not observed real-device/assistive-technology behavior.

## Testing

**Stack**: Vitest + jsdom (`vite.config.ts`'s `test: { environment: 'jsdom' }`; `pnpm test` → `vitest run`).

**Current result**: 3 test files, 29 tests, all passing (verified by running `pnpm test`).

**What is tested:**
- `deriveVisibleUsers.test.ts` — search by name/email (case-insensitive, whitespace-trimmed), city filtering, ascending/descending sort, combined search+filter+sort, and that the input array is never mutated.
- `userNameEdits.test.ts` — save/read roundtrip, local-edit-wins-over-fresh-server-data, and that malformed `localStorage` content (invalid JSON, non-object payloads, malformed individual entries, a throwing `setItem`) never crashes the app.
- `usersApi.test.ts` — valid response parsing, rejection on a non-ok or malformed response, and the development network-simulation branches (`?fail=1`, `?many=`).

**What is explicitly not covered:**
- No React Testing Library component suite — no component is rendered and asserted on directly.
- No Playwright or other end-to-end suite.
- No visual regression testing.
- "Survives reload" is tested as **write → read persistence** within a single test run (using jsdom's real `localStorage`), not as a literal browser reload, which a unit test cannot perform.

No coverage percentage is claimed anywhere in this document — no coverage tool is installed, so none has been measured.

## AI Usage

This project explicitly allows AI tools, and AI (Claude Code) was used throughout — for architecture and planning, implementation, code review, test generation, and this documentation. It was not autonomous: every step was scoped, reviewed, and explicitly approved before moving to the next, following two committed guardrail documents (`CLAUDE.md` and `AI/context.md`) that encode the project's conventions, state-ownership rules, and things never to do silently (e.g. change the conflict policy, put server data in Zustand, weaken TypeScript strictness).

Concretely: each implementation step was validated with `npx tsc -b`, `pnpm lint`, `pnpm test`, and `pnpm build` before being considered done; at least one review pass caught and fixed a real defect before it was committed (an unnecessary forced-re-render pattern in the name-edit flow, replaced with real state). All git commits and the eventual push were, and remain, performed by the human developer — the assistant never ran `git commit` or `git push`.

## Git History

The repository has 15 commits as of this writing, starting from an initial scaffold commit through incremental, single-purpose commits for each implementation step (routing, search/sort/filter, name editing and persistence, the conflict-policy decision, development network simulation, the responsive/accessibility pass, the test suite, and this documentation). No commit hashes are quoted here since they're not meaningful outside the actual repository — `git log --oneline` in the repo shows the real history and commit messages, which correspond to their diffs rather than being a single undifferentiated "initial commit."

## Challenge Ambiguities / Decisions

The brief states outright that it contains gaps and contradictions and asks for them to be named, not quietly resolved. Here is what was found, the decision made, and why.

**1. Local edited name vs. fresh server value.** Nothing in the brief says which should win when they disagree. *Decision*: local edit wins, unconditionally. *Why*: the reload-survival requirement is the more user-visible promise to break — silently overwriting a user's edit because the server happened to return something else would look like data loss, whereas an edit permanently masking a server change is a known, bounded, and named trade-off (see What Is Still Wrong With This).

**2. "Searchable by name or email" vs. an edited name.** If a name is locally edited, should search match the edited name, the original server name, or both? *Decision*: search matches the effective (edited-if-present) name and the server email. *Why*: consistency with what's on screen — matching against a name the user can no longer see would be confusing.

**3. "Sortable by name" — which collation?** The API returns one `name` field (no separate first/last), and the brief doesn't specify case sensitivity or locale. *Decision*: sort on the full `name` string, case-insensitive, locale-aware comparison. *Why*: it's the only field that exists, and case-sensitive sorting would produce a visibly wrong-looking order to an end user.

**4. "Filterable by city" — exact match, dropdown, or free text?** `city` lives under `address.city`; the brief doesn't say how filtering should work. *Decision*: an exact-match dropdown populated from the currently loaded users' cities. *Why*: with a small, known set of cities, a dropdown avoids typo-driven empty results that free-text search would produce.

**5. "Far more rows than ten" with a fixture that only ever returns ten.** The brief requires the UI to hold up at scale but gives no way to obtain more real data. *Decision*: a development-only `?many=N` query parameter that expands the real 10 users into a larger synthetic set with stable ids, used only to demonstrate and manually exercise scale — not shipped as a real feature. *Why*: it's the only way to honestly demonstrate this requirement without fabricating a fake backend.

**6. Persistence requirement despite explicitly no backend.** The brief requires edits to survive a reload while also stating real persistence beyond the browser is out of scope. *Decision*: `localStorage`, storing only the edited field. *Why*: it's the only persistence mechanism available under that constraint, and it's explicitly named as such rather than presented as if it were real, durable storage.

**7. Stale/out-of-order response requirement despite entirely client-side search/filter/sort.** The brief's race-condition language ("typing quickly must not let a stale response overwrite a newer one") describes a scenario — a fetch triggered per keystroke — that doesn't exist in this architecture. *Decision*: no custom race-handling code was written; the requirement is satisfied by the architecture itself (no per-input fetch to race) plus TanStack Query's own guarantees for the one fetch that does exist. *Why*: writing an `AbortController`/request-id guard for a request that's never triggered by typing would be defending against a scenario that can't occur, at the cost of code nobody can verify does anything.

**8. Responsive/accessibility verification expectations.** The brief asks which devices/input methods/settings were checked, but provides no live browser environment for an AI-assisted session to test against. *Decision*: implement the code-level provisions thoroughly and state plainly which verification steps were and weren't actually completed (see Responsive / Accessibility Verification), rather than claiming device testing that didn't happen.

**9. Testing being explicitly optional.** *Decision*: a small, deliberately scoped unit-test suite was written (pure filtering/sorting logic, local-edit/localStorage behavior, API validation) rather than either skipping tests entirely or chasing maximum coverage. *Why*: the brief explicitly values a real, meaningful test over a token one, and values honestly skipping over a hollow attempt — this suite targets the highest-value, easiest-to-verify logic rather than padding a count.

**10. Detail view vs. "no routing beyond what this screen needs."** A navigable detail view implies some form of routing, but the brief also caps routing scope. *Decision*: TanStack Router is scoped to exactly two functional routes (`/users`, `/users/:id`) plus a redirect from `/`, not a general-purpose route tree. *Why*: this is the minimum routing surface that satisfies the back-button and direct-link requirements without building a multi-page app structure the brief doesn't ask for.

## What Is Still Wrong With This

- **View state does not survive a reload — only the name edit does.** Search term, city filter, and sort direction live in Zustand with no persistence and no URL sync; reloading the page resets them to defaults even though the edited name survives. This is a real, unresolved tension with "nothing a user has done should disappear because they reloaded the page," read broadly.
- **No conflict UI.** When local-edit-wins suppresses a fresh server value, the user has no way to know that happened — there's no indicator, no way to see or accept the server's version.
- **Local-edit-wins can preserve stale local data indefinitely.** If the real server value ever changed for a user whose name was locally edited, this app would never show that change, forever, with no expiry or reconciliation mechanism.
- **Only the user's name is editable** — no other field has an edit path, by design, but worth naming as a real limitation of the feature surface.
- **No component-level, end-to-end, or visual regression tests** — the suite covers pure logic only; a UI regression (a state wired to the wrong prop, a broken render branch) would not be caught by anything currently in the repo.
- **The development network simulation is intentionally simplistic.** It's three URL query parameters read at fetch time — there's no UI toggle, no randomized/variable latency, and the `?slow=` delay itself isn't covered by an automated test (it would need fake timers, which wasn't judged worth the complexity for this scope).
- **No automated accessibility testing.** No axe/Lighthouse run, no screen-reader pass — see Responsive / Accessibility Verification for the exact boundary between what was and wasn't checked.
- **`CLAUDE.md`'s approved technology list still names Tailwind and shadcn/ui**, which were never actually installed — the real implementation uses plain CSS. This is a documentation/reality drift worth reconciling, not a functional bug.

## What I Would Need Before Building This For Real

- A real API contract: a documented backend for `GET`/`PATCH` users, with actual error codes and semantics — not a fixture that never fails.
- Authentication and authorization — who is allowed to view or edit which users.
- Real, server-side persistence for edits, replacing `localStorage` entirely.
- Server-side validation of the name field (length limits, allowed characters, uniqueness rules if any) — client-side "not empty" isn't a real contract.
- A decision, with the product owner, on the actual conflict/versioning policy — e.g. optimistic concurrency with a version/ETag, last-write-wins with a server timestamp, or a UI that surfaces the conflict to the user — rather than the unconditional local-wins simplification used here.
- A pagination/search/filter strategy for real data volumes — client-side filtering over an in-memory array does not scale past a fixture-sized dataset, and at that point the race-condition handling this README says isn't needed today would become necessary.
- Observability and error reporting (e.g. Sentry or equivalent) so failures are visible in production, not just handled locally.
- Automated end-to-end tests (Playwright) covering the full list → detail → edit → reload journey.
- Real accessibility testing: automated audits in CI plus a manual screen-reader pass, not just code-level review.
- Performance/load testing once the dataset and user count are realistic.
- Deployment and environment configuration — separate API base URLs per environment, and a decision on whether the development network-simulation mechanism should exist at all outside local development.

## Out of Scope

Per the challenge brief, intentionally not implemented:
- A backend.
- Authentication.
- Real persistence beyond the browser (`localStorage` is the ceiling).
- Routing to anything beyond what this one screen needs.
- A design system.

## Known Trade-offs

- **Local-edit-wins simplicity vs. freshness/conflict resolution** — chosen for predictability and to satisfy the reload-survival requirement unambiguously, at the cost of never reconciling with a changed server value.
- **Client-side filtering vs. scalability** — correct and simple at fixture scale (even the `?many=500` demo dataset), but would need to move server-side for real data volumes.
- **Minimal architecture vs. overengineering** — one query key, one Zustand store, two routes; deliberately not building abstractions (a generic data table, a design-system layer, a request-management framework) that nothing in this app's actual requirements justifies yet.
- **`localStorage` vs. backend persistence** — the only option under "no backend," accepted with its real limitations (per-browser, non-durable, no cross-device sync) stated plainly rather than glossed over.
- **Limited test scope vs. a time-boxed challenge** — unit tests on the highest-value pure logic, deliberately not a full component/E2E suite, in line with the brief's own "a real test over a token one" framing.
- **Development network simulation vs. real network control** — URL query parameters are simple, deterministic, and easy to demonstrate, at the cost of not modeling real-world variability (jitter, partial failures, flaky connections).

## Final Notes

The goal here was a small, reliable, and honestly-documented solution — one screen, done with clear state ownership and explicit decisions where the brief left gaps — rather than maximizing feature count or dependency footprint. Where something is still incomplete or simplified, it's named above rather than left for a reviewer to discover.
