---
name: test-verification
description: Defines HOW to verify a change against this project's existing
  commands and standards — TypeScript, ESLint, unit tests, and build — plus
  how to interpret failures and decide whether they were caused by the
  change under review. Uses only the commands CLAUDE.md already defines; does
  not invent new ones. Use after implementing or reviewing a change, before
  handing it back for the human to commit.
---

# test-verification

## Responsibility

Define the procedure for verifying a change using this project's existing
validation commands, and for interpreting the results honestly — including
recognizing when a failure predates the change under review rather than
being caused by it. This Skill does not invent commands, scripts, or tools
beyond what's already defined in `package.json` and documented in
`CLAUDE.md`. It produces a verification result; it does not fix failures
itself and does not publish results anywhere (that's `publish-findings`, if
the result needs to accompany review findings).

## Commands (from `package.json` / `CLAUDE.md` — do not invent alternatives)

- `npx tsc -b` — TypeScript project build/type-check (strict mode, no `any`
  allowed per `CLAUDE.md`).
- `pnpm lint` (`eslint .`) — linting.
- `pnpm test` (`vitest run`) — the unit test suite.
- `pnpm build` (`tsc -b && vite build`) — production build; also re-runs the
  type-check.

Do not substitute `npm`/`yarn` for `pnpm` — this repo's lockfile and
documented workflow (`CLAUDE.md`, `README.md`) are pnpm-based. Do not add a
coverage tool, a new test runner, or a new script to `package.json` to
"improve" verification — `CLAUDE.md`'s Testing expectations and "Things an
AI assistant should NEVER do" cover why (no unjustified dependency
additions).

## Procedure

### 1. TypeScript verification

- Run `npx tsc -b`.
- Zero errors is the only passing result. `CLAUDE.md` requires `strict`
  mode and forbids weakening `tsconfig` to force a pass — a verification
  that "passes" by loosening strictness is not a pass.
- If it fails, read the actual error output; don't guess at the cause from
  the file list alone.

### 2. ESLint

- Run `pnpm lint`.
- Zero errors/warnings the project's config treats as failing is the
  passing bar. Do not add `// eslint-disable` comments to force a pass —
  `CLAUDE.md` explicitly forbids this; fix the underlying issue or, if a
  rule is genuinely wrong for a specific documented reason, that's a
  decision for the human, not something to silently suppress.

### 3. Unit tests

- Run `pnpm test`.
- All tests passing is the bar. Note the test file/test counts in your
  report so a regression in count (fewer tests than expected) is visible,
  not just a pass/fail signal.
- If new logic was added without a corresponding test, that's a
  `code-review` Skill finding (testing category), not something this Skill
  fixes by writing tests itself — this Skill verifies, it doesn't author
  tests.

### 4. Build

- Run `pnpm build`.
- A successful build (even with the pre-existing bundle-size warning
  documented in `README.md`/`AI/context.md`) passes. A new warning class
  that wasn't there before, or a build failure, does not.
- Don't treat the known, already-documented bundle-size warning as a new
  finding — it's a pre-existing, accepted trade-off. Do flag it if the
  numbers materially worsen from what's currently documented.

### 5. Interpreting failures

For every failure, determine before reporting it:

- **Is this caused by the change under review?** Check `git status`/
  `git diff` (read-only) to see if the failing file/area was touched by the
  current change. A failure in a file nobody touched, that also fails on
  the base branch/commit, is a pre-existing issue — say so explicitly,
  don't attribute it to the current change.
- **Is this a flake or environment issue?** (e.g. a port conflict starting
  the dev server, not relevant to `tsc`/`lint`/`test`/`build` which don't
  bind a port). Re-run once if there's a concrete reason to suspect this;
  don't re-run repeatedly hoping for a different result.
- **Is this expected given the change's actual scope?** e.g. a test file
  intentionally updated to match a renamed export failing until that file
  is also updated is expected mid-change, not a genuine regression, once
  the update is complete.

Never report a pre-existing failure as if the current change introduced it,
and never suppress or omit a failure the current change did introduce.

### 6. Reporting verification results

Report, for each of the four commands: pass/fail, and for a failure, the
actual error text (not a paraphrase) plus your determination from step 5 of
whether it's attributable to the change under review. Keep this report
factual and complete — this Skill's output should let someone decide
whether a change is safe to hand off without re-running the commands
themselves.

## Boundaries

- Never invents a command, script, or tool beyond what `package.json` and
  `CLAUDE.md` already define.
- Never adds a dependency (a coverage tool, a different test runner) to
  "improve" verification.
- Never modifies `tsconfig.app.json`, ESLint config, or test files to force
  a passing result.
- Never runs `git commit`, `git push`, or any write git command — read-only
  git inspection only, to help attribute a failure to the right change.
- Never fixes a failure itself — it reports what's broken and whether the
  current change caused it; remediation is a separate, explicit step.
- Never publishes or transmits its report anywhere — that's
  `publish-findings`'s job if the result needs to travel with review
  findings.
