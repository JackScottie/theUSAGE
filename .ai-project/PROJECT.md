# theUSAGE / Usage Maps

## Goal
Build a constrained invention game and usage-map workbench that connects object capabilities into solutions for complex goals. The user explicitly requested the modern branch on 2026-10-24.

## Lifecycle
Active modernization on `usage-maps`. The historical Python 2 source and faithful replica remain preserved. Corpus recovery is an independent archival task, not a prerequisite for the new product.

## Current shape
- Dependency-free Node 22.15+ local server on http://127.0.0.1:8060.
- Buildless responsive HTML/CSS/ES modules in `public/`.
- Six authored challenges, fourteen objects, manual authoring, three play modes, observations and scoring, revisions, local notebook, JSON/Markdown export, JSON import.
- Optional OpenAI Responses structured-output solver in `lib/solver.js`, configured through ignored `.env` variables. No default model, no client-side key storage, no pretend offline generation.
- Source of truth: this repository; project memory: `.ai-project/`.

## Success criteria
- Every proposed solution accounts for its declared objects and step prerequisites.
- Users can inspect, change, test, and preserve maps.
- A failed or insufficient-resource response is useful evidence.
- Reported observations never become claims of independently verified physics.

## Workflow
Continue on `usage-maps` for this modernization. Do not merge into `master` without user direction. Run `npm test` after changes to the engine, solver, persistence, or server. Keep `main.py` and `legacy/local_server.cjs` as historical artifacts. Start with `npm start` or the existing CMD launcher; preserve Foundry port 8060 and `PORT` support.
