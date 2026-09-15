# CLAUDE.md

Instructions for any AI assistant (or contractor) working on this repository.

## Project purpose

This is a take-home hiring challenge (M-One Frontend Challenge, see `Frontend-Challenge.pdf`),
not a product. The deliverable is a single screen:

- Fetch users from `GET https://jsonplaceholder.typicode.com/users` (fixture API, 10 users,
  always succeeds instantly — real APIs do neither).
- List the users. Search by name or email. Sort by name. Filter by city.
- Detail view for a single user.
- Edit a user's name; the edit must survive a page reload.

What is being graded is not just "does it work" but the judgement calls: how conflicts between
local edits and server data are resolved, how the UI behaves under slow/failing networks and
larger datasets, responsiveness/accessibility, and — explicitly — whether the ambiguities and
contradictions baked into the spec are *named* rather than silently papered over. See
"Known traps and ambiguities" below before writing code.

Out of scope (do not build): a backend, authentication, real persistence beyond the browser,
routing to anything beyond this one screen, a design system.

## Technology Stack

This is the approved stack for this project. Each entry has one intended
responsibility — use a library only for that responsibility, only where it's
actually needed, and do not use a library outside its stated job just because it's
already a dependency. Not every technology here has to appear in every part of the
app; e.g. a static piece of UI needs none of them, a single form only needs React
Hook Form, etc.

- **React** — UI and component architecture.
- **TypeScript** — strict type safety across the codebase.
- **Vite** — development server and build tooling.
- **TanStack Query** — server state: fetching, caching, loading/error states, and
  mutations for data that comes from (or is sent to) the API. This is the one
  exception to treating the users list as a plain fetch — server state (the users
  data) goes through Query; it does not replace the local-edits/view-state split
  below.
- **TanStack Router** — the canonical owner of all navigational state: list vs.
  detail view, which user is selected, and back/forward browser history behavior.
  Scoped to what this single screen actually needs — not a multi-page app
  structure.
- **React Hook Form** — form state and validation, used for the name-edit form
  (and any other form that appears).
- **Tailwind CSS** — installed and in use for styling, spacing, typography, and
  responsive layout, directly as utility classes in components. There is no
  separate hand-written CSS file per component anymore — see Architecture
  conventions for where the few remaining global/theme rules live.
- **shadcn/ui** — installed and in use as an accessible component *foundation*,
  not a design system: Button, Input, Label, Select, Table, Card, Alert,
  Separator, and Skeleton live in `src/components/ui/` (the shadcn convention —
  copied source you own and edit, not an npm package). Use these primitives
  rather than hand-rolling ARIA/keyboard behavior for things like a dropdown or
  a table; do not add a shadcn component that isn't backing a real interaction
  in this app, and do not build a token/theming architecture beyond the color
  variables already in `src/index.css`.
- **Day.js** — date/time formatting and manipulation, only where a date is
  actually displayed or manipulated (this API's user records have no date field
  today, so this is available for if/when one is needed, not a requirement to
  force a date into the UI). Not currently installed.
- **i18next** — internationalization/localization, only where user-facing text
  actually needs to be translatable. Not currently installed.

Do not introduce an additional state-management, routing, data-fetching, form,
styling, date, or i18n library beyond what's listed here without explicit
justification stated in the README — the point of naming an approved stack is to
stop that decision from being re-litigated per-file.

## Architecture conventions

- Use TanStack Router (see Technology Stack) for list/detail navigation and back/forward
  behavior. Scope it to what this single screen needs — the list view and the detail view —
  not a multi-page route tree.
- Prefer a flat, feature-oriented structure over generic buckets. Something like:
  - `src/features/users/` — everything about the users screen (list, detail, edit, hooks)
  - `src/lib/` — a thin fetcher function for the users endpoint (used as a TanStack Query
    `queryFn`), storage helpers, generic utilities
  - `src/types/` — shared TS types for the User domain
  - `src/components/ui/` — shadcn/ui primitives only (Button, Input, Select, Table, etc.),
    each copied in because a real interaction needed it. Not a place for app-specific
    components — those stay under `src/features/users/components/`.
  Do not create `src/pages` or `src/hooks` as empty generic folders speculatively; only add a
  directory when there's a second thing that belongs in it.
- Keep the mock/demo Vite starter content (`App.tsx` counter, hero images, `App.css` demo styles)
  — replace it, don't layer the real app on top of it. Remove `src/assets/react.svg`,
  `src/assets/vite.svg`, `src/assets/hero.png`, and the demo markup in `App.tsx` when you start
  building the real screen.

## React + TypeScript conventions

- `strict` TypeScript is required (per the spec). Do not weaken `tsconfig.app.json` to make
  something compile — fix the types instead.
- No `any`. If the JSONPlaceholder response shape is genuinely unknown at a boundary, model it
  with a narrow type and validate/narrow it, don't cast.
- Function components + hooks only. No class components.
- Co-locate a component with its own styles/tests/types when they're specific to it; only lift
  something to a shared location once it's actually shared.
- Don't reach for `useEffect` for things that aren't synchronizing with an external system.
  Derived state (filtered/sorted lists, search matches) should be computed during render
  (memoized if the input is large), not pushed into `useState` + an effect.

## State management conventions

- View state — search term, city filter, sort direction — lives entirely in the URL as TanStack
  Router search params on the `/users` route (`validateSearch` in `src/router.ts`). Do not add a
  state-management library (Zustand, Redux, Jotai, etc.) to hold this or any other client state;
  there is currently nothing left that needs one. Do not put server data in the URL — that lives
  in TanStack Query's cache (see API / data-fetching conventions) — and do not put the selected
  user id anywhere but the route path (`/users/:userId`); it is owned exclusively by TanStack
  Router. There is exactly one source of truth for which user is selected, and exactly one for
  the list view's search/filter/sort.
- Separate these kinds of state explicitly, don't conflate them:
  1. **Server data** — what the API returned. Lives in TanStack Query's cache.
  2. **Local edits** — user-made changes (currently just the name edit), persisted independently.
  3. **View state** — search term, city filter, sort direction. Lives in the URL (TanStack Router
     search params), so it survives a reload and is restored by browser back/forward.
  4. **Navigational state** — which view is showing (list vs. detail) and which user is selected.
     Lives in TanStack Router's route path, not in component state.
  The displayed user list is a *derived* combination of (1) and (2), filtered/sorted by (3) — not
  a place where you mutate server data in place and lose track of what was locally edited vs.
  fetched.

## API / data-fetching conventions

- Use TanStack Query (see Technology Stack) for fetching the users endpoint — its
  `status`/`isPending`/`isError` states drive the loading/error UI described below, and its cache
  holds server data per the three-way state split (see State management conventions). Do not add
  a second data-fetching library (SWR, Apollo, etc.).
- The fixture API is instant and infallible. The implementation still has to visibly handle:
  - **Loading** — show a real loading state, not a blank screen (and it should be observable even
    though the real fixture resolves near-instantly — see race-condition note below on how you
    intend to demonstrate this).
  - **Error** — the fetch can fail in the real world; there must be a visible error state and a
    retry path, even though the fixture endpoint documented in the spec never actually errors.
  - **Scale** — the UI needs to hold up with far more than 10 rows; don't write list rendering
    that assumes the dataset stays tiny (e.g., avoid O(n²) filtering/sorting patterns, consider
    whether virtualization is warranted and say so either way in the README).
- Whatever mechanism you use to demonstrate slow/failing/large-dataset behavior (a dev-only delay
  flag, synthetic data multiplication, a toggle in the UI, etc.), document exactly how to trigger
  it in the README — a reviewer needs to be able to see these states without editing code.

## URL state conventions

- The spec says "the back button should do what a user expects it to" — that implies at least the
  selected user (detail view open/closed) should be reflected in browser history, so back/forward
  navigates between list and detail rather than leaving the app on a dead end or reloading data.
- Whether search/sort/city-filter also belong in the URL (as query params, for shareable/
  bookmarkable state) is a judgement call the spec leaves open — decide and document it, don't
  leave the back button undefined for any state you consider "user-visible navigation."
- Implement this with TanStack Router's routing state (e.g. its search-params API), not raw
  `history.pushState`/`popstate` or manual `URLSearchParams` handling — see Architecture
  conventions.

## Error / loading handling expectations

- Every async boundary (initial fetch, retry, save-edit) needs a distinguishable idle / loading /
  error / success state — don't collapse "loading" and "error" into a single "not loaded" branch,
  and don't let an error state silently fall back to an empty list (a user must be able to tell
  "there are zero users" apart from "the request failed").
- Errors should be recoverable from the UI (retry action), not just logged to the console.

## Race-condition expectations

- Explicitly called out in the spec: "Typing quickly must not let a stale response overwrite a
  newer one." Even though this fixture API can't race in practice (one endpoint, no per-keystroke
  refetch is even necessary since search/filter/sort are client-side over a static 10-row
  response), if the design ever involves a re-fetch triggered by user input (e.g. simulating
  server-side search, or the injected-latency demo mode), guard it with an AbortController or a
  request-id/sequence check that discards out-of-order responses. State which approach you used
  and why in the README.
- Do not solve this by disabling the input while a request is in flight as the *only* mitigation —
  that avoids the race but isn't what "typing quickly" is testing for; the underlying discard/
  cancel logic should still exist.

## Persistence expectations

- No backend, no real persistence layer — `localStorage` (or `sessionStorage`, but that won't
  survive a full reload consistently across all cases, so prefer `localStorage`) is the only
  storage available and is required for the edited-name-survives-reload requirement.
- Persist **edits, not the whole fetched dataset**, unless you have a specific reason to cache the
  full response too (e.g. offline-first) — and if you do, say so in the README. The default model
  is: fetch fresh from the API on load, re-apply persisted local edits on top.
- The conflict between a persisted local edit and a fresh server value for the same field is
  **explicitly left undefined by the spec on purpose** — you must pick a resolution rule (e.g.
  "local edit always wins until the user reverts it" or "server wins unless edited after last
  fetch," with a timestamp) and state the rule and reasoning in the README. Do not implement this
  silently without documenting the decision — the spec calls this out as a required, graded
  decision, not an implementation detail.
- Persisted state must degrade gracefully if `localStorage` is unavailable or corrupted (private
  browsing, quota exceeded, manually edited JSON) — don't let a `JSON.parse` throw crash the app.

## Accessibility and responsive expectations

- Must work at more than desktop width, and with more than a mouse: keyboard navigation (tab
  order, focus visible, Enter/Space activation, Escape to close the detail view if it's an
  overlay), and screen-reader-sane markup (label the search input, associate sort/filter controls
  with visible labels, don't rely on color alone for state).
- Check and document in the README which breakpoints, input methods (touch, keyboard-only,
  mouse), and system settings (at minimum `prefers-reduced-motion`; also worth checking
  `prefers-color-scheme` if you implement theming) you actually verified, and how (real device,
  browser devtools emulation, etc.). This is a required README section per the spec, not optional
  polish.

## Testing expectations

- Tests are optional per the spec, but if skipped, the README must say so explicitly and why —
  silence on testing is treated the same as not having thought about it.
- If you do write tests, they must assert real behavior (e.g. "editing a name and reloading shows
  the edited name," "a failed fetch shows a retry control," "search filters case-insensitively by
  name or email"). A test that renders a component and asserts nothing/trivial is explicitly
  called out in the spec as worse than no test.
- No test runner is currently installed — adding one (e.g. Vitest, since it integrates cleanly
  with this Vite setup) is a deliberate choice to make once, not per-test.

## Git / commit expectations

- Real, incremental commit history is required — "a single 'initial commit' tells us nothing" is
  explicit in the spec. Work in units that correspond to actual diffs (e.g. "add fetch hook for
  users," "add search/sort/filter," "persist name edits to localStorage," "handle fetch error +
  retry state"), not one giant change at the end.
- Do not squash the working history into one commit before submitting.
- **An AI assistant must never run `git commit`, `git push`, or any history-rewriting command
  (rebase, amend, force-push, `reset --hard`) in this repo.** The repo owner creates and pushes
  every commit themselves. Read-only git commands (`status`, `diff`, `log`, and similar) are fine
  and expected for verification. After implementing each step, stop, verify (build/lint/tests as
  applicable), and show the diff/status — then wait for the owner to commit and push before
  continuing to the next step.

## Known traps and ambiguities from the challenge

The spec states there are multiple unresolved contradictions/gaps by design, and that naming them
is the highest-value thing you can do. Do not silently "fix" these by picking an interpretation
with no explanation — surface the ones you find in the README. Some already visible in the spec
text (there may be more; look for them, don't stop at this list):

- **Local edit vs. fresh server data** — the spec says outright that nothing tells you which wins.
  This is a required, explicit decision (see Persistence expectations above).
- **"Searchable by name" vs. an edited name** — if a user's name is edited locally, should search
  match the edited name, the original server name, or both? Not stated.
- **"Sortable by name" scope** — first name, last name, or the `name` field as returned (which is
  a full display name, e.g. "Leanne Graham")? The API field is a single string; "sortable by name"
  doesn't specify collation rules (case sensitivity, locale) either.
- **"Filterable by city"** — `city` lives under `address.city` in the API response, and the spec
  doesn't say whether filtering is exact-match, a dropdown of known cities, or free-text.
- **"Far more rows than ten"** — the fixture only ever returns 10; the spec requires the UI to
  "hold up" at scale without giving you a way to actually get more data from the real endpoint.
  You have to synthesize this yourself and say how.
- **Detail view vs. routing** — a "detail view for a single user" implies some kind of navigable
  state (and the back-button requirement reinforces this), but "no routing beyond what this screen
  needs" caps how far that should go. Where exactly that line sits is a judgement call.
- Treat any other requirement that has no stated resolution the same way: pick one, document why,
  move on — don't ask the user to resolve these interactively unless truly blocked, since the
  brief frames identifying them (not asking about them) as the point of the exercise.

## Things an AI assistant should NEVER do without explicit approval

- Never add a state management, data-fetching, UI/component, or routing dependency beyond what's
  already approved in Technology Stack (TanStack Query, shadcn/ui, TanStack Router) without
  stating the tradeoff first in the README — e.g. don't add Redux or Zustand for client state, or
  SWR alongside TanStack Query, without justifying why the approved tool doesn't cover it.
- Never implement a backend, auth, or any persistence beyond the browser (`localStorage`/
  `sessionStorage`) — explicitly out of scope.
- Never silently resolve one of the spec's stated ambiguities without writing the decision and
  reasoning into `README.md`.
- Never run `git commit`, `git push`, or any history-rewriting command — the repo owner handles
  all commits and pushes; stop after each implementation step and hand off the diff instead.
- Never delete or rewrite `Frontend-Challenge.pdf`, `AI/context.md` (once created), or `README.md`
  content wholesale — extend/edit deliberately, don't regenerate from scratch and lose prior
  documented decisions.
- Never weaken `tsconfig` strictness, disable ESLint rules repo-wide, or add `// eslint-disable`
  / `as any` escape hatches to make something compile/pass lint, instead of fixing the underlying
  type or code.
- Never claim a responsive/accessibility check was performed without actually having a way to
  verify it (e.g. don't write "tested on iOS Safari" in the README if it wasn't actually checked
  via device or accurate emulation).
