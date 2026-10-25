# Usage Maps · by theUSAGE

A constrained invention game: one goal, a handful of objects, and an inspectable map of how their uses connect. Build your own solution, explore an authored example, or ask a configured AI to propose and revise a plan.

## Run

Requires Node.js 22.15 or later. There are no runtime packages to install.

```powershell
npm start
```

Open http://127.0.0.1:8060, or double-click `Launch theUSAGE.cmd`. The server binds to loopback and honors `PORT`; `--port` is also supported. `npm run dev` watches server files.

## Play

- **Workshop:** build a map manually, inspect examples, and use optional live AI.
- **Human first:** start blank; reveal help only when you choose.
- **Head-to-head:** lock a human proposal before opening a separate AI map (or a clearly labeled offline authored opponent). The shared inventory locks with the human submission. Observations can still be added to either attempt.

The six authored challenges cover transport, support, water transfer, structures, retrieval, and insufficient resources. The fourteen catalog objects include precise quantities, properties, and limitations. Create custom challenges from the catalog or randomize a deal; random inventories can be unsolvable.

Click objects to inspect/remove them. Click map steps to inspect actions, outputs, assumptions, and observations. Use **Steps** for a readable sequential view. Add/edit/delete steps, select earlier dependencies, record feedback, and restore earlier maps from **Revisions**.

Changing a map or its deal clears observations. Up to 12 prior map snapshots per attempt retain the original observations. Changing the deal highlights both directly missing resources and downstream blocked steps.

## Optional live AI

Copy `.env.example` to `.env`, set `OPENAI_API_KEY` and `OPENAI_MODEL`, then restart. Choose a Responses API model supporting structured outputs that your API account can access. There is intentionally no hardcoded model or silent fallback.

The server calls `https://api.openai.com/v1/responses`, requests strict JSON schema output, and validates declared objects and dependency order before returning a map. Credentials stay on the server. Request timeout is 60 seconds; a local server allows one in-flight AI request. Errors preserve the current map. Challenges, catalog object descriptions, the previous plan, and revision feedback are sent only on an explicit solve/revise action. API usage may incur charges. Responses use `store: false`; this is not a promise of zero provider retention.

Official integration reference: [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

Without configuration, the app runs offline with human authoring and explicitly labeled authored hypotheses. It never represents an example as a live AI response. No offline example is offered for an inventory missing one of its required resources. The insufficient-resource example is restricted to its exact original deal.

## Evidence and scoring

The checker enforces declared resource IDs, unique step IDs, and dependencies on earlier steps. It does **not** simulate physics, interpret all rules, measure consumables, detect every undeclared resource in prose, or verify physical outcomes. Quantities and feasibility require a referee. The authored examples have not been physically tested.

- 20 points: valid declared resources and dependency structure.
- Up to 20: economy, `max(0, 10 − distinct objects) + max(0, 10 − steps)`.
- Up to 30: proportion of steps reported successful.
- 30: all steps and the overall goal reported successful.
- Minus 5 for each failed step; total floored at zero.

Insufficient-resource explanations receive only structural points. An observed-success badge means a person entered successful observations for every step and the final goal. It is not independent certification. Cleverness is left to human judgment.

## Save and share

The notebook automatically stores up to 50 rounds in this browser's local storage. Export a round as JSON to preserve/import its challenge, inventory, maps, attempts, evidence, notes, and snapshots. Export Markdown for a readable record of the displayed attempt. Clearing browser data removes local rounds; JSON export is the portable backup. There is no cloud sync, multiplayer server, account system, or physical simulator.

## Development

```powershell
npm test
```

Node's built-in test runner exercises authored maps, scoring, broken dependencies, missing objects, drafts, import sanitization, independent attempts, HTTP endpoints, concurrent requests, and the live adapter through injected provider responses. Tests do not spend API credits.

| Location | Responsibility |
| --- | --- |
| `public/catalog.js` | Objects, challenges, and authored hypotheses |
| `public/engine.js` | Pure validation, audits, scoring, and portable round format |
| `public/app.js` | Browser workbench, authoring, observations, revisions, and local persistence |
| `public/styles.css` | Responsive visual system |
| `lib/solver.js` | Optional server-side structured AI proposals |
| `local_server.js` | Static allowlist and local API boundary |
| `test/` | Engine, server, and adapter verification |

## Historical project

The 2013 Python 2 App Engine source remains in `main.py`. The previous faithful Node replica is preserved in `legacy/local_server.cjs`; run `npm run legacy` on port 8061. The missing original Wikipedia corpus and datastore remain a separate archival concern. The modernization lives on the `usage-maps` branch.

## Next substantial increments

1. Physically test each authored example and attach measurements and photos as evidence.
2. Add formal quantity allocations, object transformations, and reusable construction patterns.
3. Add model benchmark batches with blinded human judging and fixed challenge versions.
4. Consider a simulation or robotics execution layer after the map semantics and evidence workflow are established.
