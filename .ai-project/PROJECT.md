# theUSAGE

## Goal
theUSAGE is the oldest repository in the portfolio — a 2013 Python 2 App Engine `webapp2` search app over a saved Wikipedia Book Creator corpus. The corpus files, the templates, and the datastore export are all missing; a small Node server recreates the visible search page.

The goal is recovery. Without `static/toolbook2.txt` through `toolbook18.txt`, this is a shell.

## Lifecycle
**Preserved** — Kept alive and runnable on purpose. No development is expected; revival is available but should be a deliberate decision, not drift.

## Next Horizon
- Search old backups for the toolbook corpus, templates, and datastore export.
- If the corpus is unrecoverable, say so here and close the question permanently.

## Current Shape
- Source of truth: this repository
- Project memory: `.ai-project/`
- Foundry room state: `ProjectFoundry/.foundry/projects.json`

## Success Criteria
- The repo tells a new human or AI agent what this project is *for*, not just how it is tracked.
- Tasks are safe to delegate because context and approval gates are explicit.
- Each model generation can move this project forward by one real increment.

## Git Workflow
- Commit branch: `master`
- All AI check-ins commit and push to this branch unless a human says otherwise.
