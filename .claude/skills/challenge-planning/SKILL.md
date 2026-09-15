---
name: challenge-planning
description: Turn Frontend-Challenge.pdf and the current repo state into an ordered
  implementation plan (requirements checklist, named ambiguities with candidate
  resolutions, commit-sized build sequence). Produces a plan only — never writes
  application code, never commits. Use before starting or resuming implementation
  of the M-One Frontend Challenge, or whenever the plan needs to be refreshed
  against the current repo state.
---

# challenge-planning

## Responsibility

Convert `Frontend-Challenge.pdf` plus the current state of this repository into a
concrete, ordered implementation plan. The plan lists what must be built, names the
spec's ambiguities and contradictions with a candidate resolution for each, and
sequences the work into commit-sized steps consistent with the conventions already
fixed in `CLAUDE.md`.

This Skill produces a plan. It does not implement the plan. It does not write or
edit any file under `src/`, `AI/`, `README.md`, or `CLAUDE.md`. It does not run
`git commit` or `git push`. It does not make a final, binding product decision on
any ambiguity it finds — it proposes a candidate resolution and marks it open until
a human or a separate implementation step confirms it.

Re-run this Skill whenever implementation resumes after a gap, or whenever the spec
or `CLAUDE.md` has changed since the last plan was produced, so the plan stays
grounded in current reality rather than a stale mental model.

## Inputs

Read all of the following before producing output. Do not rely on prior
conversation memory of these files — re-read them fresh each run, since this Skill
must be reproducible in a cold session:

- `Frontend-Challenge.pdf` — the authoritative spec. Read it in full.
- `CLAUDE.md` — current project rules, conventions, and the existing known-ambiguity
  list. This Skill must respect these rules, not restate or override them.
- Current repo state — `git log --oneline`, the `src/` tree, and `package.json` —
  to separate what is already built from what is still the unmodified scaffold.
- `README.md`, if it already contains a decisions log or ambiguity resolutions from
  a prior run — treat previously documented decisions as settled, not as new open
  questions, unless the underlying code or spec has since changed.

## Procedure

Follow these steps in order, every time:

1. **Read `Frontend-Challenge.pdf` in full.** Extract requirements verbatim; do not
   paraphrase from memory.
2. **Read `CLAUDE.md` in full**, in particular its architecture conventions, state
   model, persistence expectations, and "Known traps and ambiguities" section.
3. **Inspect the current repo state**: run `git log --oneline`, list `src/`, and
   read `package.json`. Determine which parts of the spec are already implemented,
   partially implemented, or untouched.
4. **Extract functional requirements** from the spec as a flat, traceable checklist
   (one line per requirement, e.g. "searchable by name or email").
5. **Extract non-functional requirements** as a separate checklist (e.g. slow
   network handling, failure handling, scale beyond 10 rows, race-condition safety,
   back-button behavior, reload survival, responsive/accessible usage).
6. **Enumerate ambiguities and contradictions** found in the spec. Cross-check each
   against `CLAUDE.md`'s existing "Known traps and ambiguities" list:
   - If already listed there, carry it into the plan as-is.
   - If not yet listed, flag it explicitly as new.
7. **Propose a candidate resolution for each ambiguity**, with a one-line rationale,
   and mark it `open` (not yet confirmed anywhere) or `decided` (already recorded in
   `README.md` or `CLAUDE.md` from a prior run). Never mark an ambiguity `decided`
   on this Skill's own authority — only when the decision already exists in a file.
8. **Sequence the remaining work into an ordered, commit-sized build list**,
   consistent with the git/commit expectations in `CLAUDE.md` (small, diff-matched
   commits, not one large change).
9. **Map required README sections** (decisions and why, what's still wrong, what
   you'd need before building this for real, responsive/device checks performed)
   to the build step expected to produce their content, so none are forgotten.
10. **Emit the plan** in the fixed output format below. Do not emit anything else —
    no code, no file edits, no commits.

## Output format

Produce the plan in this structure, either as the response or written to a location
the invoking user names:

```markdown
# Implementation Plan — M-One Frontend Challenge

## Repo state
- Already implemented: ...
- Not yet started: ...

## Functional requirements
- [ ] ...

## Non-functional requirements
- [ ] ...

## Ambiguities and candidate resolutions
1. **<ambiguity>** — candidate resolution: <...>. Rationale: <...>. Status: open|decided.
   (New / already in CLAUDE.md)
...

## Build sequence (commit-sized steps)
1. ...
2. ...

## README sections to fill, and by which step
- Decisions + why → step N
- What is still wrong with this → step N
- What I would need before building this for real → step N
- Responsive/device/input checks performed → step N
```

## Boundaries

- Never creates, edits, or deletes files under `src/`, `AI/`, `public/`, or any
  application code.
- Never edits `CLAUDE.md` or `README.md` directly — it may recommend an addition to
  either, but the edit itself is a separate, deliberate action outside this Skill.
- Never runs `git commit`, `git push`, or any other git write operation. It may
  read `git log` but never writes history.
- Never finalizes a product decision on an ambiguity; it always proposes a
  candidate resolution and leaves confirmation to the user or a later step.
- Never restates or duplicates `CLAUDE.md`'s rules inline — it reads and reconciles
  against them, treating `CLAUDE.md` as the single source of truth for project
  rules.
- Never adds dependencies, scaffolding, or configuration changes.
