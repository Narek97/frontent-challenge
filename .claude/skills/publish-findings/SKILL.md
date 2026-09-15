---
name: publish-findings
description: Defines HOW to turn a set of code-review findings (from the
  code-review Skill / Reviewer agent) into a publishable artifact — normalize,
  format, output. Provider-agnostic — no GitHub/Slack/PR integration exists
  yet, so this Skill produces local artifacts (a markdown report, or a
  formatted payload the user pastes elsewhere) until a real MCP integration
  is added. Use after a review has produced findings and the user wants them
  turned into something deliverable.
---

# publish-findings

## Responsibility

Take a findings list already produced by the `code-review` Skill (typically
via the `reviewer` agent) and turn it into a publishable artifact. This
Skill owns the **normalize → format → publishable artifact** pipeline. It
does not review code itself, and it does not decide what the findings mean
or which ones matter — that judgment already happened upstream. Its job
starts where the Reviewer's job ends.

**There is currently no external publishing integration** (no GitHub, no
Slack, no PR-comment API — no MCP server exists for any of them in this
project). This Skill must not assume one, invent one, or call a tool that
doesn't exist. Until a real MCP integration is added, "publish" means
producing a well-formed artifact — a markdown file, or a formatted text
payload returned in the response — that a human can carry to wherever it
needs to go themselves.

## Pipeline

```
findings              (structured list from code-review / ReportFindings)
  ↓
normalize             (uniform shape, de-duplicate, resolve missing fields)
  ↓
format                (render into the shape the target artifact needs)
  ↓
publishable artifact  (markdown report / PR-comment-shaped payload / other)
```

Each stage is independent of the others so a future MCP integration only
has to replace the final "deliver the artifact" step — normalize and format
stay the same regardless of where the artifact ends up.

### 1. Normalize

- Accept a findings list in the `code-review` Skill's structured shape
  (`file`, `line`, `severity`, `category`, `summary`, `recommendation`,
  `rule_reference`).
- Do not silently drop a finding that's missing an optional field (e.g. no
  `line` for a repo-wide finding) — render it without that field rather than
  discarding it.
- De-duplicate exact repeats (same `file` + `line` + `summary`) if the input
  somehow contains them; do not merge findings that are merely similar.
- Sort by severity (blocking → nit), preserving the input's severity levels
  exactly — this Skill does not re-judge severity.
- If the input isn't already in this shape (e.g. free-text findings from an
  ad hoc review), do your best to map each item onto the same fields before
  proceeding; note explicitly which fields had to be inferred rather than
  supplied.

### 2. Format

Choose the target shape based on what the user actually asked for. Do not
default to inventing a destination they didn't name.

- **Markdown review report** (default when nothing more specific is asked
  for): a heading, a one-line summary (counts by severity), then one section
  per finding ordered by severity, each with file/line, category, summary,
  recommendation, and rule reference if present.
- **PR-comment-shaped payload**: the same content, but formatted as a single
  comment body suitable for pasting into a PR/MR comment box — more compact,
  markdown that renders well in GitHub/GitLab's comment renderer, no
  document-level heading.
- **Other explicitly requested output**: if the user names a specific shape
  (a Slack message, a JSON payload for some tool, a checklist), produce
  exactly that shape — but do not silently assume the destination system;
  ask if the request is ambiguous about where this is going, since that
  determines formatting conventions (e.g. Slack's `mrkdwn` differs from
  GitHub-flavored markdown).
- Never include a finding's raw internal fields (e.g. an internal severity
  enum value) if the target format has its own conventions (e.g. GitHub PR
  review comments use their own severity/annotation UI) — translate, don't
  dump.

### 3. Publishable artifact

- If asked to save a report, write it to a location the user names, or a
  sensible default such as a path under the repo the user confirms first —
  never overwrite an existing file silently.
- If asked to "publish" in a sense that implies an external system (post to
  GitHub, send to Slack, comment on a PR), **stop and say plainly that no
  MCP integration exists for that yet**, then offer the two real options:
  produce the artifact locally for the user to paste/attach themselves, or
  note that an MCP integration would need to be added first (a separate,
  deliberate decision — not something this Skill does on its own authority).
- Never fabricate a successful "publish" — if the artifact was only written
  locally or returned in the response, say exactly that; do not imply it
  reached an external system it didn't reach.

## When an MCP integration exists later

This Skill is written so that adding a real integration (e.g. a GitHub MCP
server for posting PR review comments) only changes the "publishable
artifact" stage: swap "write markdown locally" for "call the MCP tool with
the formatted payload." The normalize and format stages, and their output
shapes, should not need to change. Do not pre-build speculative
provider-specific formatting for a provider that isn't wired up yet — add it
when the integration is actually added, informed by that provider's real
requirements.

## Boundaries

- Never invents or calls a GitHub, Slack, or other external-system tool that
  isn't actually available in this session's toolset.
- Never claims an artifact was published externally when it was only
  produced locally.
- Never re-reviews the code or changes a finding's content or severity —
  it consumes findings, it doesn't produce or judge them.
- Never assumes a destination (GitHub PR, Slack channel, etc.) the user
  didn't name.
- Never writes application code, and never touches `src/`, `package.json`,
  or any dependency file — this Skill's only output is a review artifact.
