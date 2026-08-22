# Issue Tracker: GitHub + Local Markdown

Issues and specs for this repo live primarily as **GitHub issues** (using the `gh` CLI), with **local markdown files** in `.scratch/` as a staging/review layer for human-friendly authoring before publishing.

## Hybrid Workflow

1. **Draft locally**: Create markdown files under `.scratch/<feature-slug>/` for specs and tickets
2. **Review**: Human reviews the local markdown files
3. **Publish**: Use `gh issue create` with the local file as the body (`gh issue create --title "..." --body-file .scratch/.../spec.md`)

## Conventions

### GitHub (Primary)
- **Create an issue**: `gh issue create --title "..." --body-file .scratch/<feature>/spec.md` or `gh issue create --title "..." --body "..."`
- **Read an issue**: `gh issue view <number> --comments`
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments`
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

### Local Markdown (Staging)
- One feature per directory: `.scratch/<feature-slug>/`
- Spec: `.scratch/<feature-slug>/spec.md`
- Tickets: `.scratch/<feature-slug>/issues/<NN>-<slug>.md` (numbered from `01`)
- Triage state: `Status:` line near top (see `triage-labels.md`)
- Comments: append under `## Comments` heading

## Pull Requests as a Triage Surface

**PRs as a request surface: no.**

## When a Skill Says "Publish to the Issue Tracker"

Create a GitHub issue. Optionally create the local markdown file first for review, then publish.

## When a Skill Says "Fetch the Relevant Ticket"

Run `gh issue view <number> --comments`.

## Wayfinding Operations

Used by `/wayfinder`. The **map** is a single GitHub issue with **child** issues as tickets.

- **Map**: a single GitHub issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue. Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`).
- **Blocking**: GitHub's **native issue dependencies**. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`. Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line.
- **Frontier query**: list the map's open children, drop any with an open blocker or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer to the map's Decisions-so-far.