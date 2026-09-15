---
name: code-review
description: Defines HOW to review code in this repository — preparation, scope
  detection, and a fixed sequence of checks (correctness, TypeScript, React,
  state ownership, accessibility, performance, testing, challenge-requirement
  compliance), ending in severity-classified, structured findings. Produces
  findings only — never fixes code, never publishes results. Use whenever a
  code review is requested, by the Reviewer agent or directly in the main
  session.
---

# code-review

## Responsibility

Define the procedure for reviewing a scope of this repository's code and
producing structured findings. This Skill is the HOW: it does not decide who
runs it (that's the Reviewer agent, or the main session acting in a reviewer
capacity) and it does not decide what happens to the findings afterward
(that's the `publish-findings` Skill). This Skill's output is a findings list
and nothing else — no fixes are applied, nothing is published or transmitted
anywhere.

This Skill does not restate this project's coding standards, approved stack,
architecture conventions, or git rules — those live in `CLAUDE.md` (and its
implementation-level companion `AI/context.md`), which is the single source
of truth for what "correct" means in this repo. Read them; reference them by
section when a finding cites a rule; never copy them into a finding or into
this file.

## Inputs

Read fresh every run — do not rely on a prior review's memory of these:

- `CLAUDE.md` — project rules: technology stack, architecture, state
  ownership, API/data-fetching, URL state, error/loading handling, race
  conditions, persistence, accessibility/responsive expectations, testing
  expectations, git rules, and the "Known traps and ambiguities" /
  "NEVER do" lists.
- `AI/context.md` — the current, concrete state of the implementation: what
  actually exists, where it lives, and what's already a documented,
  deliberate decision (e.g. the local-edit-wins conflict policy) versus an
  open gap.
- The requested scope itself — see "Determining scope" below.
- `git diff` / `git status` / `git log` (read-only) when the scope is
  "review what changed" rather than a named set of files.

## Procedure

Follow these steps in order, every time:

### 1. Review preparation

- Read `CLAUDE.md` in full, or re-confirm it hasn't changed since it was last
  read in this session.
- Read `AI/context.md` for the current implementation snapshot.
- Do not proceed on a stale mental model of either file — a repo this size
  changes fast enough that "I remember what CLAUDE.md says" is not good
  enough.

### 2. Understanding task scope

- If specific files or a diff are named, review exactly those — do not
  silently expand scope to "the whole app."
- If the request is "review my changes" or similar, use `git status`/
  `git diff` (read-only) to determine the actual changed files. Never guess.
- If the request names a feature or behavior rather than files, locate its
  files yourself (e.g. via `Grep`/`Glob`) before reviewing — state which
  files you determined to be in scope, so the boundary is explicit.
- Note anything the scope touches that isn't included but is closely coupled
  (e.g. a hook whose only caller is in scope but the hook file itself isn't)
  — flag it as a scope observation, not as a finding.

### 3. Inspecting relevant architecture

Before judging correctness, understand what the code is supposed to do in
this codebase's terms:

- Which state-ownership category does this code touch (server state / local
  edits / view state / navigational state, per `CLAUDE.md`'s State management
  conventions)?
- Which approved-stack library, if any, should be doing this job (TanStack
  Query, TanStack Router, React Hook Form, Tailwind/shadcn, etc.)? Is a
  different or additional library being reached for instead?
- Does the change fit the existing feature-oriented structure
  (`src/features/users/...`, `src/lib/...`, `src/components/ui/...`), or does
  it introduce a new generic bucket the Architecture conventions warn
  against?

### 4. Correctness review

- Logic errors, off-by-one errors, incorrect conditionals, wrong operator
  precedence, unhandled edge cases (empty arrays, `null`/`undefined`,
  boundary values).
- Mutation of data that should be treated as immutable (server `User`
  objects must never be mutated in place — see `AI/context.md`).
- Incorrect assumptions about data shape (e.g. trusting an API field exists
  without the runtime validation `CLAUDE.md`/`AI/context.md` require).

### 5. TypeScript review

- Any `any`, unsafe cast (`as X` without narrowing), or non-null assertion
  (`!`) that isn't clearly justified.
- Loosened `tsconfig` strictness, or a suppressed compiler error, to make
  something pass.
- Missing or overly-wide types where a narrow type already exists or is easy
  to add (e.g. a domain type in `src/types/`).
- Confirm `npx tsc -b` actually passes for the scope under review — if you
  haven't run it this session for these files, run it.

### 6. React review

- Incorrect hook usage (conditional hooks, missing/incorrect dependency
  arrays, `useEffect` reached for where derived state during render would do
  — see `CLAUDE.md`'s React + TypeScript conventions).
- Using array index as a React `key` for a list that can reorder/filter (an
  explicit "never do" in `AI/context.md`).
- Unnecessary re-renders, unstable references passed to memoized children,
  or state lifted higher than it needs to be.
- Component responsibility creep — a component doing something a hook or a
  pure function in `lib/` should own instead.

### 7. State ownership review

Cross-check against `CLAUDE.md`'s State management conventions and
`AI/context.md`'s State Ownership section specifically:

- Server data must live only in TanStack Query's cache — never duplicated
  into another store.
- View state (search/city/sort/page) must live only in the URL via
  `usersListRoute`'s search params (currently via `useUsersListFilters`) —
  never reintroduced into a new store or component state.
- The selected user id must live only in the route path, never elsewhere.
- Local edits must go through the existing `localStorage` mechanism, not a
  new persistence path.
- Flag any new state-management dependency (Zustand, Redux, Jotai, etc.) as
  a blocking finding — `CLAUDE.md` requires this to be justified in the
  README before it's added, not introduced silently.

### 8. Accessibility review

- Every interactive control has an accessible name (label, `aria-label`, or
  visible text) — not just a placeholder.
- Keyboard operability: real `<button>`/`<a>`/`<input>`/`<select>` elements,
  not `<div onClick>`; visible `:focus-visible` states preserved.
- Loading/error/empty states use appropriate roles (`role="status"`,
  `role="alert"`) and are distinguishable from each other, per `CLAUDE.md`'s
  Error / loading handling expectations.
- State is never conveyed by color alone.
- Responsive behavior doesn't clip or hide content with no alternate path to
  reach it at narrow widths.

### 9. Performance review

- O(n²) or worse patterns in filtering/sorting/rendering over lists that can
  grow (`CLAUDE.md`'s Scale expectations).
- Expensive work (filtering, sorting, formatting) repeated unnecessarily on
  every render where memoization is clearly warranted, versus premature
  memoization that adds complexity for a negligible dataset.
- Anything that would defeat TanStack Query's caching (e.g. a changing query
  key that shouldn't change) or trigger redundant network requests.

### 10. Testing review

- For new/changed logic, are there tests, and do they assert real behavior
  — not a trivial "renders without crashing" or an assertion that can never
  fail? `CLAUDE.md`'s Testing expectations explicitly calls a trivial test
  worse than no test.
- Are pure functions (parsing, filtering, deriving, pagination) tested
  in isolation, consistent with this repo's existing pattern in
  `src/features/users/lib/*.test.ts`?
- Is a real behavior gap left silently untested where the existing test
  suite's pattern would normally cover it (e.g. a new pure helper added
  without a companion test)?
- Do not require component/E2E tests to exist — `CLAUDE.md` documents that
  scope as a deliberate choice, not a gap to flag by default.

### 11. Challenge requirement review

- Cross-check the change against `CLAUDE.md`'s "Known traps and ambiguities"
  list: does this change touch an area with a documented ambiguity (conflict
  policy, search-vs-edited-name, sort scope, city filter semantics, scale
  strategy)? If so, does it respect the already-decided resolution, or does
  it silently re-decide it?
- If the change introduces a *new* ambiguity not yet listed anywhere, flag it
  as a finding recommending it be named and resolved in `README.md`, per
  `CLAUDE.md`'s explicit requirement that ambiguities be documented, not
  silently resolved.

### 12. Severity classification

Classify every finding using exactly these levels:

- **blocking** — breaks correctness, violates an explicit `CLAUDE.md` rule
  (e.g. a new state library, a mutated server object, `git commit` run by
  the assistant), or would fail `tsc`/lint/build/test.
- **high** — a real bug or a significant deviation from architecture/state
  ownership that will cause visible incorrect behavior or a maintenance
  trap, but doesn't currently fail a build/test gate.
- **medium** — a real but contained issue: a missed edge case, a testing
  gap on non-trivial logic, an accessibility gap on a secondary control.
- **low** — a legitimate but minor issue: naming, a slightly-off severity
  classification elsewhere, a small missed optimization.
- **nit** — stylistic or preferential; would not block anything on its own.

Order the findings list most-severe first.

### 13. Structured findings format

Produce each finding with:

- `file` — repo-relative path.
- `line` — line number the finding anchors to, when applicable.
- `severity` — one of the five levels above.
- `category` — one of: correctness, typescript, react, state-ownership,
  accessibility, performance, testing, requirement.
- `summary` — one sentence stating the defect.
- `recommendation` — a concrete, actionable next step (not just "fix this").
- `rule_reference` — the `CLAUDE.md`/`AI/context.md` section the finding
  relates to, when the finding is about violating a documented rule (cite by
  section name, don't quote it at length).

When the Reviewer agent has the `ReportFindings` tool available, use it with
this shape. Otherwise render the same fields as a markdown list.

## Boundaries

- Produces findings only. Never edits, formats, or fixes the code under
  review.
- Never runs `git commit`, `git push`, or any write/history-changing git
  command — read-only git inspection only.
- Never publishes, posts, or transmits findings anywhere. Turning findings
  into a delivered artifact is the `publish-findings` Skill's job, not this
  one's.
- Never restates `CLAUDE.md`'s rules in bulk inside a finding — cite the
  relevant section instead.
- Never expands the review scope beyond what was requested or objectively
  determined via `git diff`/`git status`.
- Never treats a component/E2E test gap as a finding — that's a documented,
  deliberate scope choice in this repo, not an oversight.
