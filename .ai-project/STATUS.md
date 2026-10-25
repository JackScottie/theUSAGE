# Status

Last updated: 2026-10-24

## Now
Usage Maps is implemented on branch `usage-maps` as a local constrained-invention workbench.

Implemented:
- Responsive workshop, challenge collection, notebook, and field guide.
- Six authored challenges and fourteen bounded catalog objects with properties and quantities.
- Workshop, human-first, and head-to-head play; human submission and shared-deal locking.
- Editable dependency maps and step-list views; missing-resource and downstream blocking indicators.
- Custom challenges and exploratory random inventory deals.
- Step/goal observations, transparent scoring, feedback, notes, and revision snapshots.
- Browser-local autosave, duplication, JSON import/export, Markdown export.
- Optional server-side live AI proposals and revisions with strict structured output and resource/dependency validation.
- Legacy Node replica preserved separately; original Python source unchanged.

## Verification
- All 20 automated engine/server/adapter tests pass with `npm test`; provider calls are mocked.
- Browser checks cover rendering at narrow panel width, object removal/restoration, reload persistence, manual step creation, human submission locking, separate opponent maps, and comparison.
- No real OpenAI request or physical experiment has been run. Live solver requires the user's API key and chosen model in `.env`.

## Run
`npm start` or `Launch theUSAGE.cmd`, then http://127.0.0.1:8060. Node 22.15+; no runtime dependency installation. `PORT` is honored. `.env.example` documents optional AI configuration. `npm run legacy` serves the old replica on 8061.

## Limits
Declared resource and dependency checks do not prove physical feasibility, semantic rule compliance, or cumulative quantity accounting. Observations are human reports. Browser-local persistence has no cloud backup; JSON export is portable. Authored examples are untested hypotheses. Random deals may have no solution.
