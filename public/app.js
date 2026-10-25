import { objects, challenges, findObject, findChallenge } from "./catalog.js";
import {
  auditPlan,
  validatePlan,
  examplePlan,
  freshRound,
  exportRound,
  validateRound,
} from "./engine.js";
const $ = (s) => document.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const paths = {
  arrow: "M4 12h16m-6-6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  check: "m5 12 4 4L19 6",
  info: "M12 11v6m0-10v1",
  shuffle: "m4 5 16 14m-4 0h4v-4M4 19l5-5m6-4 5-5m-4 0h4v4",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  upload: "M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5",
  edit: "m4 16-1 5 5-1L20 8l-4-4L4 16m9-9 4 4",
  map: "M5 4v16m14-16v16M5 7h14M5 17h14",
  book: "M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3V4m12 2v15",
  clock: "M12 7v5l3 2",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3",
  undo: "M8 5 3 10l5 5M3 10h11a6 6 0 0 1 0 12",
  settings: "M4 6h16M4 12h16M4 18h16M9 3v6m6 0v6m-8 0v6",
  trash: "M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7",
  help: "M9 8a3 3 0 1 1 4 3c-1 0-1 2-1 3m0 3v1",
  lock: "M6 10h12v11H6V10m3 0V6a3 3 0 0 1 6 0v4",
  minus: "M5 12h14",
  copy: "M8 8h13v13H8V8M16 8V3H3v13h5",
  flag: "M5 22V3l7 3 7-3v10l-7 3-7-3",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12",
  card: "M5 5h38v32H5V5m0 26h38M11 5v26m26-26v26",
  string:
    "M8 13c4-9 28-8 28 2 0 9-24 3-24 13 0 10 23 10 27 1M8 14c0 10 28 0 28 10",
  cup: "M9 10h30l-5 30H14L9 10m0 0c0-6 30-6 30 0M14 40c4 3 16 3 20 0",
  pencil: "m10 36 26-26 5 5-26 26-8 2 3-7m23-23 5 5M10 36l5 5",
  tape: "M8 25a16 16 0 1 1 32 0 16 16 0 0 1-32 0m10 0a6 6 0 1 1 12 0 6 6 0 0 1-12 0m20 8 7 8H30",
  books: "M7 9h29v10H7V9m4 10h29v10H11V19M6 29h31v10H6V29m6-25 26 2",
  ruler: "m8 33 25-25 8 8-25 25-8-8m8-8 4 4m1-9 4 4m1-9 4 4",
  clip: "M13 17h22l-3 23H16l-3-23m4 0V7c0-6 14-6 14 0v10M20 17v-6m4 6v-6m4 6v-6",
  paper: "M11 5h22l7 7v31H11V5m22 0v9h7M17 23h17m-17 6h17m-17 6h11",
  band: "M8 20c0-14 32-14 32 0s-32 24-32 10V20m0 0c0 14 32 14 32 0m0 0v10",
  foil: "m6 14 28-8 8 30-29 8-7-30m8 3 6 12 5-11 9 11m-20 8 12-5 3 7",
  sponge:
    "M7 16 33 8l9 7v23l-27 6-8-7V16m0 0 8 7 27-8M15 23v21m7-14h1m8-4h1m-7 10h1m9-4h1",
  spoon: "M25 21c-14 4-18-15-7-17s18 13 7 17l14 21-5 3-13-23",
  ball: "M8 24a16 16 0 1 1 32 0 16 16 0 0 1-32 0m9-10c6 0 13 9 13 20M13 32c5-10 16-15 24-11",
};
function icon(name, size = 16) {
  const large = [
    "card",
    "string",
    "cup",
    "pencil",
    "tape",
    "books",
    "ruler",
    "clip",
    "paper",
    "band",
    "foil",
    "sponge",
    "spoon",
    "ball",
  ].includes(name);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${large ? "48 48" : "24 24"}" fill="none" stroke="currentColor" stroke-width="${large ? "1.5" : "1.6"}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${["clock", "info", "help"].includes(name) ? '<circle cx="12" cy="12" r="10"/>' : ""}<path d="${paths[name] || paths.spark}"/></svg>`;
}
let state = {
  rounds: [],
  current: null,
  tab: "workbench",
  filter: "All",
  mapView: "map",
  ai: { ai: false },
  busy: false,
  elapsed: 0,
  timerOn: false,
};
let persistenceWarning = false;
try {
  const saved = JSON.parse(localStorage.getItem("usage-maps-v1") || "null");
  if (saved) {
    state.rounds = (saved.rounds || [])
      .slice(0, 50)
      .map((r) => {
        try {
          return validateRound(exportRound(r));
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    state.current = saved.current;
  }
} catch {
  persistenceWarning = true;
}
if (!state.rounds.length) {
  const r = freshRound(challenges[0]);
  r.plan = examplePlan(r.challenge, r.inventory);
  r.selectedStep = "s1";
  state.rounds = [r];
  state.current = r.id;
}
if (!state.rounds.some((r) => r.id === state.current))
  state.current = state.rounds[0].id;
const round = () => state.rounds.find((r) => r.id === state.current);
function persist() {
  syncAttempt();
  const r = round();
  if (r) r.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(
      "usage-maps-v1",
      JSON.stringify({
        rounds: state.rounds.slice(0, 50),
        current: state.current,
      }),
    );
  } catch {
    if (!persistenceWarning) {
      persistenceWarning = true;
      toast(
        "Browser storage is full or unavailable. Export your round to keep it.",
      );
    }
  }
}
let toastTimeout;
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(
    () => $("#toast").classList.remove("visible"),
    4500,
  );
}
function button(action, label, ico, cls = "", attrs = "") {
  return `<button type="button" class="btn ${cls}" data-action="${action}" ${attrs}>${ico ? icon(ico) : ""}${label}</button>`;
}
const sourceLabel = (p) =>
  p?.source === "ai"
    ? "AI proposal"
    : p?.source === "authored"
      ? "Authored example"
      : "Human proposal";
function header() {
  return `<header class="app-header"><a href="#workbench" class="brand" data-action="nav" data-tab="workbench"><span class="brand-mark">${icon("map", 24)}</span><span><strong>Usage Maps</strong><small>by theUSAGE</small></span></a><nav class="nav" aria-label="Main navigation">${[
    ["workbench", "Workbench"],
    ["challenges", "Challenges"],
    ["notebook", "Notebook"],
    ["guide", "Field guide"],
  ]
    .map(
      ([id, label]) =>
        `<button data-action="nav" data-tab="${id}" class="${state.tab === id ? "active" : ""}" aria-current="${state.tab === id ? "page" : "false"}">${label}${id === "notebook" ? ` <small>(${state.rounds.length})</small>` : ""}</button>`,
    )
    .join(
      "",
    )}</nav><div class="header-right"><span class="status"><i class="dot ${state.ai.ai ? "live" : ""}"></i>${state.ai.ai ? "Live AI ready" : "Offline workshop"}</span><button class="icon-btn" title="How to play" aria-label="How to play" data-action="help">${icon("help")}</button>${button("new", "New round", "plus", "small")}</div></header>`;
}
function render() {
  $("#app").innerHTML =
    header() +
    `<main id="main" tabindex="-1">${{ workbench: workbench, challenges: challengePage, notebook: notebookPage, guide: guidePage }[state.tab]()}</main>`;
  updateTimer();
}
function workbench() {
  const r = round(),
    c = r.challenge,
    p = r.plan,
    a = auditPlan(p, r.inventory, r.evidence);
  return `<div class="page-heading"><div><div class="eyebrow">The invention workbench</div><h1>Ordinary objects. Unordinary possibilities.</h1><p>One goal. A handful of objects. Find the connections that make it work.</p></div><div class="actions">${button("random", "Deal a challenge", "shuffle")}${button("export", "Export round", "download")}</div></div>${r.mode === "duel" ? duelBar(r) : ""}<div class="workbench"><aside class="challenge-panel"><div class="challenge-body"><div class="challenge-index"><span>CHALLENGE ${esc(c.number || "CUSTOM")}</span>${icon("flag", 17)}</div><h2>${esc(c.title)}</h2><p class="brief">${esc(c.brief)}</p><div class="challenge-tags"><span class="badge">${esc(c.difficulty || "Custom")}</span><span class="badge">${icon("clock", 11)} ${c.minutes || 10} min</span></div><div class="rule-title">The finish line</div><div class="success-box">${esc(c.success)}</div><div class="rules-details"><div class="rule-title">Play by the rules</div><ul class="rule-list">${c.rules.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><div class="rule-title">Your environment</div><ul class="rule-list">${c.environment.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div><div class="challenge-footer"><button class="text-link" data-action="rules">${icon("info", 12)} Rules & environment</button><button class="text-link" data-action="hint">Need a nudge?</button></div></aside><section class="right-work" aria-label="Invention workbench"><div class="inventory-panel"><div class="section-top"><div class="section-label">Your object tray <span class="count">${r.inventory.length} available</span></div><button class="text-link" data-action="inventory">${icon("settings", 12)} Edit the deal</button></div><div class="inventory">${[
    ...new Set([...c.inventory, ...r.inventory]),
  ]
    .map((id) => {
      const o = findObject(id);
      if (!o) return "";
      return `<button class="object-card ${r.inventory.includes(id) ? "" : "removed"}" data-action="object" data-id="${esc(id)}" aria-label="Inspect ${esc(o.name)}${r.inventory.includes(id) ? "" : " (removed)"}"><span class="object-state">${r.inventory.includes(id) ? "" : "−"}</span><span class="object-icon">${icon(o.icon, 42)}</span><strong>${esc(o.name)}</strong><small>${esc(o.quantity)}</small></button>`;
    })
    .join(
      "",
    )}</div><p class="inventory-note">${icon("lock", 11)} Only these objects and the listed environment. No invisible tools.</p></div><section class="map-panel" aria-label="Usage map"><div class="map-toolbar"><div class="section-label">${icon("map", 14)} Usage map</div><div class="map-tabs" aria-label="Map view"><button data-action="map-view" data-view="map" class="${state.mapView === "map" ? "active" : ""}">Map</button><button data-action="map-view" data-view="steps" class="${state.mapView === "steps" ? "active" : ""}">Steps</button></div><div class="actions">${p ? `<span class="source-tag ${p.source === "ai" ? "ai" : ""}">${sourceLabel(p)}</span>` : ""}${button("add-step", p ? "Add step" : "Build your map", "plus", "small", state.busy ? "disabled" : "")}${button("solve", state.busy ? "Thinking…" : state.ai.ai ? "Ask AI to solve" : "Explore example", "spark", "small primary", state.busy ? "disabled" : "")}</div></div>${state.busy ? `<div class="loading" role="status"><i class="spinner"></i>Connecting properties, checking prerequisites, looking for a plan…</div>` : ""}${p ? (state.mapView === "map" ? mapCanvas(r, a) : stepsList(r)) : emptyMap(r)}<div class="map-bottom"><div class="legend"><span><i></i>Object → use</span><span><i class="grey"></i>Step → next step</span><span><i class="amber"></i>Assumption to test</span></div><span>Click a step to inspect & test ${icon("arrow", 10)}</span></div></section><div class="bottom-grid"><section class="panel"><div class="section-top"><div class="section-label">${icon("eye", 14)} Reality check</div>${p ? button("edit-plan", "Edit plan", "edit", "small") : ""}</div>${p ? `<h3>${esc(p.title)}</h3><p class="plan-summary">${esc(p.summary)}</p>${a.errors.length ? a.errors.map((e) => `<div class="audit-line bad">${icon("close", 13)}${esc(e)}</div>`).join("") : `<div class="audit-line">${icon("check", 14)}Resource IDs and dependency order checked. Quantities, rule meaning, and physics still need human review.</div>`}${p.status === "insufficient" ? `<div class="callout"><strong>No supported solution found.</strong><br>${p.missing.map(esc).join("<br>")}</div>` : `<div class="audit-line">${icon("info", 14)}${a.assumptions} explicit assumptions · ${a.passed}/${p.steps.length} steps observed to work${a.failed ? ` · ${a.failed} failed` : ""}</div>`}<div class="actions">${button("goal-test", "Record goal outcome", "flag", "small")}${button("revise", "Challenge this plan", "spark", "small")}${button("history", "Revisions", "undo", "small")}</div>` : `<h3>A good idea starts with a connection.</h3><p>Build a map yourself, inspect an authored example, or connect live AI. Every plan starts as a proposal.</p>`}</section><section class="panel"><div class="section-top"><div class="section-label">Round score</div><span class="badge">${a.verified ? "Observed success" : a.errors.length ? "Needs repair" : p?.status === "insufficient" ? "Capability gap" : "Unproven"}</span></div><div class="score-row"><div class="score-number">${a.score}<small> / 100</small></div><div class="score-caption">${a.verified ? "Based on your recorded observations." : "Working in the real world earns the most points."}</div></div><div class="meter"><span style="width:${a.score}%"></span></div><div class="score-detail"><span>Resource & order check</span><strong>${p ? (a.structural ? "20 / 20" : "0 / 20") : "—"}</strong></div><div class="score-detail"><span>Economy of objects & steps</span><strong>${p?.status === "proposed" && a.structural ? Math.max(0, 10 - a.used.length) + Math.max(0, 10 - p.steps.length) : 0} / 20</strong></div><div class="score-detail"><span>Observed steps</span><strong>${p?.steps.length ? Math.round((30 * a.passed) / p.steps.length) : 0} / 30</strong></div><div class="score-detail"><span>Complete goal observation</span><strong>${a.verified ? 30 : 0} / 30</strong></div>${a.failed ? `<div class="score-detail"><span>Failed-step penalty</span><strong>−${a.failed * 5}</strong></div>` : ""}<button class="text-link" data-action="scoring">How scoring works</button></section></div></section></div><div class="footer-note"><span><strong>Everything has possibilities.</strong> The interesting part is connecting them.</span><span><button class="text-link" data-action="timer"><span id="timer">Start timer</span></button> &nbsp;·&nbsp; <button class="text-link" data-action="notes">Round notes</button> &nbsp;·&nbsp; Saved in this browser</span></div>`;
}
function duelBar(r) {
  return `<div class="duel-bar">${icon("lock", 14)}<strong>Head-to-head · ${r.humanLocked ? "Human attempt locked. Compare independently." : "Build your human map before revealing the opponent."}</strong><button data-action="duel-switch" data-player="human" class="${r.player === "human" ? "active" : ""}">Your map</button><button data-action="duel-switch" data-player="ai" class="${r.player === "ai" ? "active" : ""}" ${r.humanLocked ? "" : "disabled"}>${state.ai.ai ? "AI map" : "Example opponent"}</button>${!r.humanLocked ? button("lock-human", "Lock your attempt", "lock", "small") : button("compare", "Compare", "map", "small")}</div>`;
}
function mapCanvas(r, a) {
  const p = r.plan;
  if (p.status === "insufficient")
    return `<div class="empty-map canvas"><div><div class="empty-symbol">${icon("info", 32)}</div><span class="eyebrow">A valid place to stop</span><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p>${button("edit-plan", "Inspect the capability gap", "eye")}</div></div>`;
  const ids = [...new Set(p.steps.flatMap((s) => s.uses))],
    w = Math.max(920, p.steps.length * 252 + 65, ids.length * 150 + 60),
    h = 445;
  const pos = new Map(
    p.steps.map((s, i) => [s.id, { x: 36 + i * 252, y: 220 }]),
  );
  let wires = "";
  for (const s of p.steps) {
    const to = pos.get(s.id);
    for (const id of s.uses) {
      const i = ids.indexOf(id),
        x = 36 + i * 150 + 63,
        tx = to.x + 108;
      wires += `<path d="M${x} 102 C${x} 155 ${tx} 155 ${tx} 220" stroke="${r.inventory.includes(id) ? "#b9c9a8" : "#c9846b"}" stroke-width="1.2" stroke-dasharray="4 4"/>`;
    }
    for (const dep of s.dependsOn) {
      const from = pos.get(dep);
      if (from)
        wires += `<path d="M${from.x + 216} 280 C${from.x + 238} 280 ${to.x - 22} 280 ${to.x} 280" stroke="#729071" stroke-width="1.5" marker-end="url(#arrow)"/>`;
    }
  }
  return `<div class="canvas" tabindex="0" aria-label="Scrollable usage map; use arrow keys to scroll"><div class="map-inner" style="width:${w}px;height:${h}px"><span class="map-caption">01 / Objects & their possibilities</span><span class="map-caption actions-caption">02 / Connect the uses</span><svg class="map-svg" width="${w}" height="${h}" aria-hidden="true"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10" fill="#729071"/></marker></defs>${wires}</svg>${ids
    .map((id, i) => {
      const o = findObject(id);
      return `<div class="map-object ${r.inventory.includes(id) ? "" : "removed"}" style="left:${36 + i * 150}px">${icon(o?.icon || "help", 26)}<span>${esc(o?.name || id)}<br><small class="muted">${esc(o?.properties[0] || "unavailable")}</small></span></div>`;
    })
    .join("")}${p.steps
    .map((s, i) => {
      const missing = s.uses.some((id) => !r.inventory.includes(id)),
        blocked = a.blockedSteps.includes(s.id),
        e = r.evidence[s.id];
      return `<button data-action="step" data-id="${esc(s.id)}" class="map-node ${r.selectedStep === s.id ? "selected" : ""} ${blocked ? "blocked" : ""} ${e?.outcome === "pass" ? "passed" : ""}" style="left:${36 + i * 252}px" aria-label="Step ${i + 1}: ${esc(s.title)}"><span class="node-kicker">STEP ${String(i + 1).padStart(2, "0")} <span>${missing ? "Missing object" : blocked ? "Blocked / failed" : e?.outcome === "pass" ? "✓ Observed" : e?.outcome === "fail" ? "× Failed" : s.assumptions.length ? `◦ ${s.assumptions.length} to test` : "Proposed"}</span></span><strong class="node-title">${esc(s.title)}</strong><span class="node-output">${esc(s.output)}</span></button>`;
    })
    .join(
      "",
    )}<span class="goal-flag" style="left:${36 + Math.max(0, p.steps.length - 1) * 252}px">${icon("flag", 11)} ${a.verified ? "Goal observed" : "Goal awaits a real-world test"}</span></div></div>`;
}
function stepsList(r) {
  return `<div class="steps-list">${r.plan.status === "insufficient" ? `<div class="callout">${esc(r.plan.summary)}<br>${r.plan.missing.map(esc).join("<br>")}</div>` : r.plan.steps.map((s, i) => `<article class="list-step"><span class="step-number">${i + 1}</span><div class="step-main"><h3>${esc(s.title)}</h3><p>${esc(s.action)}</p><div class="chips">${s.uses.map((id) => `<span class="chip ${r.inventory.includes(id) ? "" : "missing"}">${esc(findObject(id)?.name || id)}</span>`).join("")}</div></div><button class="icon-btn" data-action="step" data-id="${esc(s.id)}" aria-label="Inspect step ${i + 1}">${icon("arrow")}</button></article>`).join("")}</div>`;
}
function emptyMap(r) {
  return `<div class="canvas empty-map"><div><div class="empty-symbol">${icon("map", 32)}</div><div class="eyebrow">The possibilities are in your hands</div><h3>What could these become?</h3><p>Connect an object to an action, then an action to the next. Make every step count.</p><div class="actions">${button("add-step", "Make the first connection", "plus", "primary")}${r.mode === "human" || (r.mode === "duel" && r.player === "human") ? "" : button("example", "Show an example", "eye")}</div></div></div>`;
}
function challengePage() {
  const shown = challenges.filter(
    (c) => state.filter === "All" || c.category === state.filter,
  );
  return `<div class="page-heading"><div><div class="eyebrow">The challenge collection</div><h1>Constraints make room for ingenuity.</h1><p>Six starting problems. Many possible answers. All proposed examples still need testing.</p></div><div class="actions">${button("custom", "Create a challenge", "plus", "primary")}${button("random", "Surprise me", "shuffle")}</div></div><div class="filters" aria-label="Filter challenges">${["All", ...new Set(challenges.map((c) => c.category))].map((f) => `<button data-action="filter" data-filter="${esc(f)}" class="filter ${f === state.filter ? "active" : ""}">${esc(f)}</button>`).join("")}</div><div class="library-grid">${shown
    .map(
      (c) =>
        `<article class="challenge-card"><div class="challenge-art"><span class="art-num">${c.number} /</span>${c.inventory
          .slice(0, 3)
          .map((id) => icon(findObject(id).icon, 64))
          .join(
            "",
          )}</div><div class="challenge-card-body"><div class="eyebrow">${esc(c.category)} · ${c.minutes} minutes</div><h2>${esc(c.shortTitle)}</h2><p>${esc(c.brief)}</p><div class="chips"><span class="badge">${esc(c.difficulty)}</span><span class="badge">${c.inventory.length} objects</span></div><div class="actions">${button("start-challenge", "Open challenge", "arrow", "small primary", `data-id="${c.id}"`)}${button("choose-duel", "Head-to-head", "", "small", `data-id="${c.id}"`)}</div></div></article>`,
    )
    .join("")}</div>`;
}
function notebookPage() {
  return `<div class="page-heading"><div><div class="eyebrow">Your field notebook</div><h1>Keep the ideas. Learn from the attempts.</h1><p>Rounds save automatically in this browser. Export a round to carry it elsewhere.</p></div><div class="actions">${button("import", "Import round", "upload")}${button("new", "New round", "plus", "primary")}</div></div><div class="notebook-list">${[
    ...state.rounds,
  ]
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
    .map((r) => {
      const a = auditPlan(r.plan, r.inventory, r.evidence);
      return `<article class="saved-card"><div class="section-top"><span class="eyebrow">${esc(r.challenge.category || "Custom")} · ${esc(r.mode)}</span><span class="badge">${a.verified ? "Observed success" : r.plan ? "Proposal" : "Blank map"} · ${a.score} pts</span></div><h2>${esc(r.challenge.shortTitle || r.challenge.title)}</h2><p>${esc(r.plan?.title || "A possibility waiting to happen.")}<br>${r.inventory.length} objects · ${r.plan?.steps.length || 0} steps · ${esc(new Date(r.updatedAt || r.createdAt).toLocaleDateString())}</p><div class="actions">${button("open-round", "Continue", "arrow", "small primary", `data-id="${esc(r.id)}"`)}${button("duplicate", "Duplicate", "copy", "small", `data-id="${esc(r.id)}"`)}<button class="icon-btn danger-btn" data-action="delete-round" data-id="${esc(r.id)}" title="Delete round" aria-label="Delete ${esc(r.challenge.shortTitle || r.challenge.title)}">${icon("trash")}</button></div></article>`;
    })
    .join(
      "",
    )}</div><p class="muted">${state.rounds.length}/50 local rounds. Your API key is never stored here.</p>`;
}
function guidePage() {
  return `<div class="page-heading"><div><div class="eyebrow">The field guide</div><h1>Think in possibilities, then test them.</h1><p>A little structure makes a clever idea something you can inspect, share, and improve.</p></div>${button("new", "Let’s play", "arrow", "primary")}</div><div class="guide-grid"><section class="panel"><span class="eyebrow">01 / Play</span><h2>A game of useful connections.</h2><ol><li>Pick a measurable goal and a bounded inventory.</li><li>Read the environment. Hands, gravity, surfaces, and tools are resources too.</li><li>Connect properties to actions and actions to intermediate results.</li><li>Check every assumption. Record a real observation for each step.</li><li>Remove an object, revise the plan, and see what still works.</li></ol></section><section class="panel"><span class="eyebrow">02 / Three ways in</span><h2>Make, explore, or compete.</h2><p><strong>Workshop:</strong> author a map, inspect a clearly labeled example, or ask a connected AI.</p><p><strong>Human first:</strong> begin with a blank map. Help is revealed only when you choose it.</p><p><strong>Head-to-head:</strong> lock your independent human attempt, then reveal an AI proposal or offline example opponent. Both use the same objects. Compare observations as well as scores.</p><p>Random deals preserve each challenge’s payload. They are exploratory and may be unsolvable; saying what capability is missing is allowed.</p></section><section class="panel"><span class="eyebrow">03 / Grounding</span><h2>A proposal is a beginning.</h2><p>Solid arrows show step dependencies. Dotted lines show objects participating in actions. Each step contains an action, an output, and explicit assumptions.</p><p>The automatic check verifies declared resource IDs, unique step IDs, and dependency order. It cannot prove physical feasibility, interpret every rule, detect undeclared resources in prose, or measure quantities. You are the referee.</p><p>Green observed steps mean a person reported success. This app does not simulate physics or independently verify experiments.</p></section><section class="panel"><span class="eyebrow">04 / Score</span><h2>Reward what actually works.</h2><p>20 points for a valid resource and dependency structure. Up to 20 for economy: 10 minus distinct objects used, plus 10 minus number of steps, each floored at zero.</p><p>30 points are distributed across steps you report as working. The final 30 require every step and the overall goal to be reported as successful. A failed step costs 5 points. Scores are floored at zero.</p><p>An insufficient-resource explanation earns only 20 structural points. Cleverness stays a human judgment; it is not automatically scored.</p></section><section class="panel"><span class="eyebrow">05 / Live AI</span><h2>Connect a solver when you’re ready.</h2><p>Copy <code>.env.example</code> to <code>.env</code> in the project folder. Set <code>OPENAI_API_KEY</code> and <code>OPENAI_MODEL</code> to a Responses API model available to your account. Restart with <code>npm start</code>.</p><p>The key remains on your local server. Challenge text, inventory, previous plan, and revision feedback are sent to OpenAI only when you ask for an AI solution. API usage may incur charges. No automatic AI calls are made.</p><p>Model output is requested as structured JSON and checked before it enters the map. Failed requests preserve your current work.</p><p><a href="https://developers.openai.com/api/docs/guides/structured-outputs" target="_blank" rel="noreferrer">OpenAI structured output documentation ↗</a></p></section><section class="panel"><span class="eyebrow">06 / Keep learning</span><h2>Each attempt becomes a usage map.</h2><p>Your notebook saves up to 50 rounds in this browser. Export JSON to keep the goal, inventory, map, observations, and revisions together. Export Markdown for a readable experiment record.</p><p>Editing a plan or changing its inventory clears its observations: evidence belongs to the arrangement tested. Prior maps and observations are kept in up to 12 revision snapshots per attempt.</p><p>Start with small, low-energy tabletop tasks. The six examples are authored hypotheses, not documented successful experiments.</p></section></div>`;
}
function modal(title, body, footer = "") {
  const d = $("#modal");
  d.innerHTML = `<div class="modal-header"><h2 id="modal-title">${title}</h2><button class="icon-btn" data-action="close" aria-label="Close dialog">${icon("close")}</button></div><div class="modal-body">${body}</div>${footer ? `<div class="modal-footer">${footer}</div>` : ""}`;
  if (!d.open) d.showModal();
  d.querySelector("input:not([type=checkbox]),textarea,select,button")?.focus();
}
function closeModal() {
  $("#modal").close();
}
function field(label, name, value = "", type = "text", extra = "") {
  return `<label class="field"><span>${label}</span>${type === "textarea" ? `<textarea name="${name}" ${extra}>${esc(value)}</textarea>` : `<input type="${type}" name="${name}" value="${esc(value)}" ${extra}>`}</label>`;
}
function snapshot(r, label) {
  if (!r.plan) return;
  r.history = [
    ...(r.history || []),
    {
      at: new Date().toISOString(),
      label,
      plan: structuredClone(r.plan),
      evidence: structuredClone(r.evidence),
      inventory: [...r.inventory],
    },
  ].slice(-12);
}
function setPlan(p, label) {
  const r = round();
  snapshot(r, label);
  r.plan = p;
  r.evidence = {};
  r.selectedStep = p.steps[0]?.id || null;
  persist();
  render();
}
function editable() {
  const r = round();
  if (r.mode === "duel" && r.player === "human" && r.humanLocked) {
    toast(
      "Your human entry is locked. Duplicate the round to try another approach.",
    );
    return false;
  }
  return true;
}
function openNew(preselect, mode = "workshop") {
  modal(
    "Start with a possibility.",
    `<p>Pick your challenge and how you want to play. Each round starts with a fresh map.</p><form id="new-form"><label class="field"><span>Choose a challenge</span><select name="challenge">${challenges.map((c) => `<option value="${c.id}" ${c.id === preselect ? "selected" : ""}>${c.number} — ${esc(c.shortTitle)} · ${esc(c.difficulty)}</option>`).join("")}</select></label><label class="field"><span>Play mode</span><select name="mode"><option value="workshop" ${mode === "workshop" ? "selected" : ""}>Workshop — make, inspect, and ask AI</option><option value="human" ${mode === "human" ? "selected" : ""}>Human first — begin without examples</option><option value="duel" ${mode === "duel" ? "selected" : ""}>Head-to-head — lock your map, reveal the opponent</option></select></label><div class="callout">An AI proposal and an authored example are always labeled separately. Neither is a verified solution.</div></form>`,
    `${button("custom", "Make my own challenge", "plus")}${button("begin", "Open the workbench", "arrow", "primary")}`,
  );
}
function start(c, mode = "workshop") {
  syncAttempt();
  if (state.rounds.length >= 50) {
    toast(
      "Your notebook has 50 rounds. Export and delete an older round first.",
    );
    return;
  }
  const r = freshRound(c, mode);
  state.rounds.unshift(r);
  state.current = r.id;
  state.tab = "workbench";
  state.elapsed = 0;
  state.timerOn = false;
  closeModal();
  persist();
  render();
}
function customForm() {
  modal(
    "Invent the problem.",
    `<p>Give the game a measurable finish line. List environmental resources explicitly; they are part of the deal.</p><form id="custom-form">${field("Challenge title", "title", "", "text", 'required maxlength="100" placeholder="A new kind of bridge"')}${field("The goal", "brief", "", "textarea", 'required maxlength="4000" placeholder="What must the player accomplish?"')}${field("Success criterion", "success", "", "textarea", 'required maxlength="2000" placeholder="What can a referee observe or measure?"')}${field("Environment · one resource per line", "environment", "Level desk\nHuman hands for assembly\nNormal gravity and still air", "textarea", 'required maxlength="5000"')}${field("Rules · one per line", "rules", "Only the dealt objects and listed environment.\nNo additional tools or supplies.", "textarea", 'required maxlength="5000"')}<div class="eyebrow" style="margin-bottom:12px">Deal the objects</div><div class="check-grid">${objects.map((o) => `<label class="check"><input type="checkbox" name="objects" value="${o.id}">${icon(o.icon, 24)}<span>${esc(o.name)}</span></label>`).join("")}</div><label class="field"><span>Play mode</span><select name="mode"><option value="workshop">Workshop</option><option value="human">Human first</option><option value="duel">Head-to-head</option></select></label><div id="form-error"></div></form>`,
    button("create-custom", "Create challenge", "arrow", "primary"),
  );
}
function showObject(id) {
  const r = round(),
    o = findObject(id);
  if (!o) return;
  modal(
    esc(o.name),
    `<div class="modal-object-hero">${icon(o.icon, 100)}</div><div class="eyebrow">${esc(o.quantity)}</div><p style="margin-top:14px">${esc(o.description)}</p><div class="chips">${o.properties.map((x) => `<span class="chip">${esc(x)}</span>`).join("")}</div><div class="callout">${r.inventory.includes(id) ? "Available in this deal. Remove it to test how the map adapts." : "Removed from this deal. Steps that use it need a different approach."}</div>`,
    button(
      "toggle-object",
      r.inventory.includes(id) ? "Remove from deal" : "Restore object",
      r.inventory.includes(id) ? "minus" : "plus",
      "primary",
      `data-id="${id}"`,
    ),
  );
}
function inventoryForm() {
  const r = round();
  modal(
    "Change the constraints.",
    `<p>Remove an object or build a different deal. Existing steps stay visible; broken resource links are flagged. Changing the deal clears observations for both head-to-head attempts.</p><form id="inventory-form"><div class="check-grid">${objects.map((o) => `<label class="check"><input type="checkbox" name="objects" value="${o.id}" ${r.inventory.includes(o.id) ? "checked" : ""}>${icon(o.icon, 25)}<span>${esc(o.name)}<br><small>${esc(o.quantity)}</small></span></label>`).join("")}</div></form><div class="callout">An arbitrary deal may be impossible. Live AI or a human can try it; offline examples only cover their authored resources.</div>`,
    `${button("random-inventory", "Randomize deal", "shuffle")}${button("save-inventory", "Apply deal", "check", "primary")}`,
  );
}
function applyInventory(ids) {
  const r = round();
  if (r.mode === "duel" && r.humanLocked) {
    toast(
      "The head-to-head deal is locked. Duplicate the round to change its objects.",
    );
    return;
  }
  if (!editable()) return;
  if (
    JSON.stringify([...ids].sort()) === JSON.stringify([...r.inventory].sort())
  ) {
    closeModal();
    return;
  }
  snapshot(r, "Inventory changed");
  r.inventory = ids;
  r.evidence = {};
  if (r.attempts) {
    for (const entry of Object.values(r.attempts)) entry.evidence = {};
  }
  closeModal();
  persist();
  render();
  toast("Deal changed. Resource links rechecked; observations cleared.");
}
function editPlanForm() {
  if (!editable()) return;
  const p = round().plan || {
    title: "My usage map",
    summary: "",
    status: "proposed",
    missing: [],
    steps: [],
  };
  modal(
    "Shape the plan.",
    `<form id="plan-form">${field("Plan title", "title", p.title, "text", 'required maxlength="3000"')}${field("Approach", "summary", p.summary, "textarea", 'required maxlength="3000"')}<label class="field"><span>Plan status</span><select name="status"><option value="proposed" ${p.status === "proposed" ? "selected" : ""}>Proposed solution</option><option value="insufficient" ${p.status === "insufficient" ? "selected" : ""}>No supported solution found</option></select></label>${field("Missing capabilities · one per line", "missing", p.missing.join("\n"), "textarea", 'maxlength="5000"')}<p>Changing the plan clears observations. Choosing insufficient resources removes execution steps and keeps the previous map in revisions.</p><div id="form-error"></div></form>`,
    button("save-plan", "Save plan", "check", "primary"),
  );
}
function stepEditor(id) {
  if (!editable()) return;
  const r = round(),
    p = r.plan,
    s = p?.steps.find((x) => x.id === id),
    index = s ? p.steps.indexOf(s) : p?.steps.length || 0;
  if (index >= 20 && !s) {
    toast("Maps support up to 20 steps.");
    return;
  }
  const previous = p?.steps.slice(0, index) || [];
  modal(
    s ? "Edit the connection." : "Make a connection.",
    `<form id="step-form" data-id="${esc(id || "")}">${!p ? `${field("Plan title", "planTitle", "My usage map", "text", 'required maxlength="3000"')}${field("Overall approach", "planSummary", "", "textarea", 'required maxlength="3000"')}` : ""}${field("Step title", "title", s?.title || "", "text", 'required maxlength="3000" placeholder="Give the sheet a spine"')}${field("What happens?", "action", s?.action || "", "textarea", 'required maxlength="3000" placeholder="Describe the assembly or action, including attachments and quantities."')}<div class="eyebrow" style="margin-bottom:10px">Objects involved</div><div class="check-grid">${[...new Set([...r.inventory, ...(s?.uses || [])])].map((id) => `<label class="check"><input type="checkbox" name="uses" value="${esc(id)}" ${s?.uses.includes(id) ? "checked" : ""}>${esc(findObject(id)?.name || id)} ${r.inventory.includes(id) ? "" : "(unavailable)"}</label>`).join("")}</div>${previous.length ? `<div class="eyebrow" style="margin-bottom:10px">Requires these earlier steps</div><div class="check-grid">${previous.map((x) => `<label class="check"><input type="checkbox" name="dependsOn" value="${esc(x.id)}" ${(s ? s.dependsOn.includes(x.id) : x === previous.at(-1)) ? "checked" : ""}>${esc(x.id)} · ${esc(x.title)}</label>`).join("")}</div>` : ""}${field("Resulting state", "output", s?.output || "", "text", 'required maxlength="3000" placeholder="A stiffened channel with side rails"')}${field("Assumptions to test · one per line", "assumptions", (s?.assumptions || []).join("\n"), "textarea", 'maxlength="6000" placeholder="The cardboard can span 15 cm without sagging."')}<div id="form-error"></div></form>`,
    `${s ? button("delete-step", "Delete step", "trash", "danger-btn", `data-id="${esc(s.id)}"`) : ""}${button("save-step", "Save connection", "check", "primary")}`,
  );
}
function observationForm(id) {
  const r = round(),
    s = r.plan?.steps.find((s) => s.id === id),
    e = r.evidence[id] || {},
    goal = id === "goal";
  if (!r.plan) return;
  if (goal && r.plan.status === "insufficient") {
    modal(
      "Record a capability review.",
      `<p>A missing-capability argument needs human review. It cannot earn execution points or a successful-goal badge.</p>${field("Review notes", "review", r.notes, "textarea", 'id="review-notes" maxlength="10000"')}`,
      button("save-review", "Save notes", "check", "primary"),
    );
    return;
  }
  if (!goal && !s) return;
  r.selectedStep = id;
  modal(
    goal ? "Did the goal happen?" : esc(s.title),
    `<div class="eyebrow">${goal ? "The finish line" : `Connection ${esc(id)}`}</div><div class="detail-action">${esc(goal ? r.challenge.success : s.action)}</div>${goal ? "" : `<div class="chips">${s.uses.map((id) => `<span class="chip ${r.inventory.includes(id) ? "" : "missing"}">${esc(findObject(id)?.name || id)}</span>`).join("")}</div><div class="detail-section"><div class="eyebrow">Resulting state</div><p>${esc(s.output)}</p></div><div class="detail-section"><div class="eyebrow">Assumptions to test</div>${s.assumptions.length ? s.assumptions.map((a) => `<div class="assumption">${esc(a)}</div>`).join("") : "<p>No explicit assumptions listed. Check for missing ones before testing.</p>"}</div>`}<form id="observation-form" data-id="${esc(id)}"><label class="field"><span>Your real-world observation</span><select name="outcome"><option value="untested" ${!e.outcome || e.outcome === "untested" ? "selected" : ""}>Not tested</option><option value="pass" ${e.outcome === "pass" ? "selected" : ""}>Observed to work</option><option value="fail" ${e.outcome === "fail" ? "selected" : ""}>Observed to fail</option></select></label>${field("What did you observe?", "note", e.note || "", "textarea", 'maxlength="3000" placeholder="Record measurements, failures, and any adjustment."')}<div id="form-error"></div></form><p>These are self-reported observations, not a simulation. Record the plan as written; edit it first if you change the setup.</p>`,
    `${goal ? "" : button("edit-step", "Edit step", "edit", "", `data-id="${esc(id)}"`)}${button("save-observation", "Save observation", "check", "primary")}`,
  );
}
async function askAI(feedback = "") {
  const r = round();
  if (!editable()) return;
  if (r.mode === "duel" && r.player === "human") {
    toast("Lock your human map, then open the opponent’s map.");
    return;
  }
  if (r.mode === "human" && !r.revealed) {
    modal(
      "Reveal a suggestion?",
      `<p>Human-first mode keeps the challenge independent until you choose to reveal help. Your current map will remain in revisions.</p>`,
      button("reveal", "Reveal help", "eye", "primary"),
    );
    return;
  }
  if (!state.ai.ai) {
    showExample();
    return;
  }
  if (state.busy) return;
  const requestRoundId = r.id,
    requestPlayer = r.player,
    requestInventory = JSON.stringify(r.inventory),
    requestPlan = JSON.stringify(r.plan),
    requestEvidence = JSON.stringify(r.evidence);
  state.busy = true;
  closeModal();
  render();
  try {
    const response = await fetch("/api/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challenge: r.challenge,
        inventory: r.inventory,
        feedback,
        previousPlan: r.plan,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "AI request failed.");
    if (
      round().id !== requestRoundId ||
      round().player !== requestPlayer ||
      JSON.stringify(round().inventory) !== requestInventory ||
      JSON.stringify(round().plan) !== requestPlan ||
      JSON.stringify(round().evidence) !== requestEvidence
    ) {
      toast(
        "Round changed during generation. The result was discarded to protect your map.",
      );
      return;
    }
    setPlan(data.plan, "Before AI proposal");
    toast("AI proposal ready. Inspect its assumptions before testing.");
  } catch (error) {
    toast(error.message);
  } finally {
    state.busy = false;
    render();
  }
}
function showExample() {
  const r = round();
  if (!editable()) return;
  if (r.mode === "duel" && r.player === "human") {
    toast("Lock your human attempt before revealing the opponent.");
    return;
  }
  const p = examplePlan(r.challenge, r.inventory);
  if (!p) {
    modal(
      "A new deal needs a new idea.",
      `<p>No authored example covers this inventory. Build a map yourself, restore the original deal, or configure live AI in the field guide.</p><div class="callout">Offline mode never pretends to generate a new solution.</div>`,
      `${button("nav", "AI setup", "settings", "", `data-tab="guide"`)}${button("add-step", "Build a map", "plus", "primary")}`,
    );
    return;
  }
  if (r.plan) {
    modal(
      "Explore the authored example?",
      `<p>This will replace the displayed proposal. Your current map and observations will remain in Revisions.</p><p><strong>${esc(p.title)}</strong> is an authored hypothesis, not a generated or physically tested solution.</p>`,
      button("load-example", "Load example", "eye", "primary"),
    );
  } else {
    closeModal();
    setPlan(p, "Before authored example");
    toast("Authored example loaded. It has not been physically verified.");
  }
}
function promptRevision() {
  if (!round().plan) return;
  modal(
    "Make the plan earn its place.",
    `<p>Point out a failure, hidden resource, or assumption. Live AI revises within the current deal. Offline, use this feedback while editing the map yourself.</p><form id="revision-form">${field("Your challenge to the plan", "feedback", "", "textarea", 'required maxlength="4000" placeholder="The tape slips on this surface. Can you use a different attachment?"')}</form>`,
    `${button("edit-plan", "Edit it myself", "edit")}${button("submit-revision", state.ai.ai ? "Ask AI to revise" : "Save feedback to notes", "spark", "primary")}`,
  );
}
function notes() {
  modal(
    "Notes from the workbench.",
    `<p>Keep questions, observations, and ideas for the next iteration.</p>${field("Round notes", "notes", round().notes, "textarea", 'id="round-notes" class="note-area" maxlength="10000"')}`,
    button("save-notes", "Save notes", "check", "primary"),
  );
}
function showHistory() {
  const h = round().history || [];
  modal(
    "The ideas before this one.",
    `<p>Up to 12 snapshots are kept for the current attempt. Restoring a revision clears observations so it can be retested under the current deal.</p>${
      h.length
        ? [...h]
            .reverse()
            .map(
              (x, i) =>
                `<article class="saved-card" style="margin-bottom:10px"><span class="eyebrow">${esc(new Date(x.at).toLocaleString())}</span><h2>${esc(x.plan.title)}</h2><p>${esc(x.label)} · ${x.plan.steps.length} steps</p>${button("restore-history", "Restore map", "undo", "small", `data-index="${h.length - 1 - i}"`)}</article>`,
            )
            .join("")
        : '<div class="callout">No earlier revisions yet. Editing or replacing a map creates a snapshot.</div>'
    }`,
  );
}
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function syncAttempt() {
  const r = round();
  if (r.mode === "duel") {
    r.attempts ||= {};
    r.attempts[r.player] = {
      plan: structuredClone(r.plan),
      evidence: structuredClone(r.evidence),
      history: structuredClone(r.history || []),
    };
  }
}
function switchAttempt(player) {
  const r = round();
  if (player === r.player) return;
  if (player === "ai" && !r.humanLocked) return;
  syncAttempt();
  r.player = player;
  const entry = r.attempts?.[player];
  r.plan = structuredClone(entry?.plan || null);
  r.evidence = structuredClone(entry?.evidence || {});
  r.history = structuredClone(entry?.history || []);
  r.selectedStep = null;
  persist();
  render();
}
function compare() {
  syncAttempt();
  const r = round();
  modal(
    "Two maps. One set of constraints.",
    `<p>Both attempts use the current deal. Scores reflect self-reported observations; a persuasive proposal alone does not win.</p>${[
      "human",
      "ai",
    ]
      .map((player) => {
        const entry = r.attempts?.[player],
          a = auditPlan(entry?.plan, r.inventory, entry?.evidence);
        return `<div class="panel" style="margin-bottom:12px"><div class="section-top"><span class="eyebrow">${player === "human" ? "Your locked attempt" : "Opponent"}</span><span class="badge">${a.score} / 100</span></div><h3>${esc(entry?.plan?.title || "No proposal yet")}</h3><p>${esc(entry?.plan ? sourceLabel(entry.plan) : "Open this attempt and make a map.")} · ${a.used.length} objects · ${entry?.plan?.steps.length || 0} steps<br>${a.verified ? "Observed goal success" : `${a.passed} steps observed · goal unproven`}</p></div>`;
      })
      .join(
        "",
      )}<div class="callout">Which approach surprised you? Which assumptions survived testing? Record your judgment in round notes.</div>`,
    button("notes", "Record your judgment", "edit", "primary"),
  );
}
function exportMenu() {
  syncAttempt();
  modal(
    "Take the map with you.",
    `<p>JSON preserves the complete round for import: challenge, deal, plan, observations, and revisions. Markdown is a readable experiment record.</p>`,
    `${button("export-md", "Markdown", "download")}${button("export-json", "Round JSON", "download", "primary")}`,
  );
}
function markdown(r) {
  const a = auditPlan(r.plan, r.inventory, r.evidence);
  return `# ${r.challenge.title}\n\n${r.challenge.brief}\n\n## Success\n${r.challenge.success}\n\n## Environment\n${r.challenge.environment.map((x) => "- " + x).join("\n")}\n\n## Rules\n${r.challenge.rules.map((x) => "- " + x).join("\n")}\n\n## Inventory\n${r.inventory
    .map((id) => {
      const o = findObject(id);
      return "- " + (o ? o.name + " — " + o.quantity : id);
    })
    .join(
      "\n",
    )}\n\n## ${r.plan?.title || "Blank map"}\n${r.plan ? sourceLabel(r.plan) : ""}\n\n${r.plan?.summary || ""}\n\n${r.plan?.steps.map((s, i) => `### ${i + 1}. ${s.title}\n${s.action}\n\nUses: ${s.uses.join(", ")}\nRequires: ${s.dependsOn.join(", ") || "None"}\nOutput: ${s.output}\n\nAssumptions:\n${s.assumptions.map((x) => "- " + x).join("\n")}\n\nObservation: ${r.evidence[s.id]?.outcome || "untested"} — ${r.evidence[s.id]?.note || ""}\n`).join("\n") || ""}\n${r.plan?.missing?.length ? "Missing capabilities: " + r.plan.missing.join("; ") : ""}\n\n## Overall result\n${r.evidence.goal?.outcome || "untested"} — ${r.evidence.goal?.note || ""}\nScore: ${a.score}/100 (self-reported observations; no physics simulation)\n\n## Notes\n${r.notes || ""}\n`;
}
function formError(message) {
  const el = $("#form-error");
  if (el) {
    el.className = "form-error";
    el.textContent = message;
  } else toast(message);
}
const lines = (value) =>
  String(value || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
const handlers = {
  nav: (b) => {
    state.tab = b.dataset.tab;
    closeModal();
    render();
  },
  new: () => openNew(),
  close: closeModal,
  "start-challenge": (b) => start(findChallenge(b.dataset.id)),
  "choose-duel": (b) => openNew(b.dataset.id, "duel"),
  begin: () => {
    const f = new FormData($("#new-form"));
    start(findChallenge(f.get("challenge")), f.get("mode"));
  },
  random: () =>
    start(challenges[Math.floor(Math.random() * challenges.length)]),
  custom: customForm,
  "create-custom": () => {
    const form = $("#custom-form");
    if (!form.reportValidity()) return;
    const f = new FormData(form),
      ids = f.getAll("objects");
    if (!ids.length) return formError("Choose at least one object.");
    const env = lines(f.get("environment")),
      rules = lines(f.get("rules"));
    if (!env.length || !rules.length)
      return formError("Define the environment and rules.");
    const title = f.get("title").trim();
    if (!title) return formError("Give the challenge a title.");
    if (!f.get("brief").trim() || !f.get("success").trim())
      return formError("Define the goal and a measurable success criterion.");
    start(
      {
        id: "custom-" + crypto.randomUUID(),
        number: "CUSTOM",
        title,
        shortTitle: title,
        category: "Custom",
        difficulty: "Custom",
        minutes: 10,
        brief: f.get("brief").trim(),
        success: f.get("success").trim(),
        environment: env,
        rules,
        inventory: ids,
        hint: "Think about the physical property each intermediate step requires.",
        solutions: [],
      },
      f.get("mode"),
    );
  },
  filter: (b) => {
    state.filter = b.dataset.filter;
    render();
  },
  "map-view": (b) => {
    state.mapView = b.dataset.view;
    render();
  },
  object: (b) => showObject(b.dataset.id),
  inventory: inventoryForm,
  "toggle-object": (b) => {
    const ids = round().inventory,
      id = b.dataset.id;
    applyInventory(
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  },
  "save-inventory": () =>
    applyInventory(new FormData($("#inventory-form")).getAll("objects")),
  "random-inventory": () => {
    const r = round();
    const payload =
      r.challenge.id === "bridge"
        ? ["ball"]
        : ["water", "rescue", "impossible"].includes(r.challenge.id)
          ? ["cups"]
          : r.challenge.id === "tower"
            ? ["paper", "pencil"]
            : r.challenge.id === "stand"
              ? ["paper"]
              : [];
    const picked = [
      ...payload,
      ...objects
        .filter((o) => !payload.includes(o.id))
        .map((o) => ({ id: o.id, n: Math.random() }))
        .sort((a, b) => a.n - b.n)
        .slice(0, Math.max(0, 6 - payload.length))
        .map((x) => x.id),
    ];
    $("#inventory-form")
      .querySelectorAll("input")
      .forEach((input) => (input.checked = picked.includes(input.value)));
  },
  "add-step": () => stepEditor(),
  "edit-step": (b) => stepEditor(b.dataset.id),
  "edit-plan": editPlanForm,
  "save-plan": () => {
    if (!editable()) return;
    const form = $("#plan-form");
    if (!form.reportValidity()) return;
    const f = new FormData(form),
      r = round(),
      p = {
        ...(r.plan || { steps: [] }),
        title: f.get("title").trim(),
        summary: f.get("summary").trim(),
        status: f.get("status"),
        missing: lines(f.get("missing")),
        source: "human",
      };
    if (p.status === "insufficient") {
      p.steps = [];
      if (!p.missing.length)
        return formError("Explain the missing capability.");
    }
    if (!p.title || !p.summary)
      return formError("Provide a title and an approach.");
    closeModal();
    setPlan(p, "Before plan edit");
  },
  "save-step": () => {
    if (!editable()) return;
    const form = $("#step-form");
    if (!form.reportValidity()) return;
    const f = new FormData(form),
      r = round(),
      p = structuredClone(
        r.plan || {
          title: f.get("planTitle").trim(),
          summary: f.get("planSummary").trim(),
          status: "proposed",
          missing: [],
          steps: [],
          source: "human",
        },
      );
    const id =
      form.dataset.id ||
      "s" + (Math.max(0, ...p.steps.map((s) => Number(s.id.slice(1)))) + 1);
    const s = {
      id,
      title: f.get("title").trim(),
      action: f.get("action").trim(),
      output: f.get("output").trim(),
      uses: f.getAll("uses"),
      dependsOn: f.getAll("dependsOn"),
      assumptions: lines(f.get("assumptions")),
    };
    if (!s.title || !s.action || !s.output)
      return formError("Describe the step, action, and resulting state.");
    const index = p.steps.findIndex((x) => x.id === id);
    if (index >= 0) p.steps[index] = s;
    else p.steps.push(s);
    p.status = "proposed";
    p.missing = [];
    p.source = "human";
    const errors = validatePlan(
      p,
      objects.map((o) => o.id),
    );
    if (errors.length) return formError(errors[0]);
    closeModal();
    setPlan(p, "Before step edit");
  },
  "delete-step": (b) => {
    if (!editable()) return;
    const r = round(),
      p = structuredClone(r.plan),
      id = b.dataset.id;
    p.steps = p.steps.filter((s) => s.id !== id);
    p.steps.forEach((s) => (s.dependsOn = s.dependsOn.filter((x) => x !== id)));
    p.source = "human";
    closeModal();
    setPlan(p, "Before step deletion");
    toast("Step removed. Review downstream actions and dependencies.");
  },
  step: (b) => observationForm(b.dataset.id),
  "goal-test": () => observationForm("goal"),
  "save-observation": () => {
    const form = $("#observation-form"),
      f = new FormData(form);
    if (f.get("outcome") !== "untested" && !f.get("note").trim())
      return formError("Record what you observed before marking a result.");
    round().evidence[form.dataset.id] = {
      outcome: f.get("outcome"),
      note: f.get("note").trim(),
      at: new Date().toISOString(),
    };
    persist();
    closeModal();
    render();
    toast("Observation saved. Scores updated from your report.");
  },
  solve: () => askAI(),
  example: showExample,
  "load-example": () => {
    const p = examplePlan(round().challenge, round().inventory);
    closeModal();
    if (p) setPlan(p, "Before authored example");
  },
  reveal: () => {
    round().revealed = true;
    closeModal();
    askAI();
  },
  revise: promptRevision,
  "submit-revision": () => {
    const form = $("#revision-form");
    if (!form.reportValidity()) return;
    const text = new FormData(form).get("feedback").trim();
    if (!text) return;
    if (state.ai.ai) askAI(text);
    else {
      round().notes =
        (round().notes ? round().notes + "\n\n" : "") +
        "Revision feedback: " +
        text;
      persist();
      closeModal();
      toast("Feedback saved in notes. Edit the affected steps to revise.");
    }
  },
  notes,
  "save-notes": () => {
    round().notes = $("#round-notes").value;
    persist();
    closeModal();
    toast("Notes saved.");
  },
  "save-review": () => {
    round().notes = $("#review-notes").value;
    persist();
    closeModal();
  },
  history: showHistory,
  "restore-history": (b) => {
    if (!editable()) return;
    const h = round().history[Number(b.dataset.index)];
    if (!h) return;
    const p = structuredClone(h.plan);
    closeModal();
    setPlan(p, "Before restoring revision");
    toast("Map restored under current inventory. Observations cleared.");
  },
  "lock-human": () => {
    const r = round();
    if (!r.plan || validatePlan(r.plan, r.inventory).length)
      return toast(
        "Finish a valid human proposal before locking your attempt.",
      );
    r.humanLocked = true;
    syncAttempt();
    persist();
    render();
    toast("Human attempt locked. You can now reveal the opponent.");
  },
  "duel-switch": (b) => switchAttempt(b.dataset.player),
  compare,
  "open-round": (b) => {
    syncAttempt();
    state.current = b.dataset.id;
    state.tab = "workbench";
    state.elapsed = 0;
    state.timerOn = false;
    persist();
    render();
  },
  duplicate: (b) => {
    if (state.rounds.length >= 50)
      return toast("Export and delete an older round first.");
    const original = state.rounds.find((r) => r.id === b.dataset.id),
      r = structuredClone(original);
    r.id = crypto.randomUUID();
    r.createdAt = r.updatedAt = new Date().toISOString();
    r.evidence = {};
    r.humanLocked = false;
    r.attempts = {};
    r.mode = "workshop";
    r.player = "human";
    state.rounds.unshift(r);
    state.current = r.id;
    state.tab = "workbench";
    persist();
    render();
  },
  "delete-round": (b) =>
    modal(
      "Delete this local round?",
      `<p>This removes the round and its revisions from this browser. Export it first if you want a copy.</p>`,
      `${button("close", "Keep round")}${button("confirm-delete", "Delete round", "trash", "danger-btn", `data-id="${esc(b.dataset.id)}"`)}`,
    ),
  "confirm-delete": (b) => {
    state.rounds = state.rounds.filter((r) => r.id !== b.dataset.id);
    if (!state.rounds.length) {
      const r = freshRound(challenges[0]);
      state.rounds = [r];
    }
    if (!state.rounds.some((r) => r.id === state.current))
      state.current = state.rounds[0].id;
    persist();
    closeModal();
    render();
  },
  export: exportMenu,
  "export-json": () => {
    syncAttempt();
    download(
      `usage-map-${round().challenge.id}.json`,
      JSON.stringify(exportRound(round()), null, 2),
      "application/json",
    );
    closeModal();
  },
  "export-md": () => {
    download(
      `usage-map-${round().challenge.id}.md`,
      markdown(round()),
      "text/markdown",
    );
    closeModal();
  },
  import: () => $("#import-file").click(),
  hint: () =>
    modal(
      "A nudge, not an answer.",
      `<div class="callout">${esc(round().challenge.hint || "Which properties could supply the missing capability?")}</div>`,
    ),
  rules: () =>
    modal(
      "The boundaries of the game.",
      `<div class="eyebrow">Rules</div><ul>${round()
        .challenge.rules.map(
          (x) =>
            `<li style="margin:10px 0;font-size:13px;line-height:1.7">${esc(x)}</li>`,
        )
        .join("")}</ul><div class="eyebrow">Environment</div><ul>${round()
        .challenge.environment.map(
          (x) =>
            `<li style="margin:10px 0;font-size:13px;line-height:1.7">${esc(x)}</li>`,
        )
        .join("")}</ul>`,
    ),
  help: () =>
    modal(
      "One goal. A handful of objects.",
      `<p>Pick a challenge, inspect your inventory, and connect the uses into a plan.</p><div class="callout"><strong>Objects → actions → intermediate states → goal.</strong><br>A usage map shows how ordinary things work together.</div><p>Click a step to inspect its action and assumptions. Try it in the real world, then record what happened. Remove an object to expose a weak link.</p><p>Authored examples work offline. Live AI is optional. Every proposal needs testing; automatic checks cover resource IDs and dependency order only.</p>`,
      `${button("nav", "Read the field guide", "book", "", `data-tab="guide"`)}${button("close", "Back to making", "arrow", "primary")}`,
    ),
  scoring: () =>
    modal(
      "A score for making it work.",
      `<p><strong>20 points:</strong> declared resource IDs and dependency order pass.</p><p><strong>Up to 20:</strong> economy of objects and steps, 10 minus each count, floored at zero.</p><p><strong>30:</strong> distributed across steps you report as working.</p><p><strong>30:</strong> every step and the overall goal are reported successful.</p><p><strong>−5:</strong> for each reported failed step.</p><div class="callout">An insufficient-resource response earns only 20 structural points. Scores are not independent verification or a measure of cleverness.</div>`,
    ),
  timer: () => {
    state.timerOn = !state.timerOn;
    updateTimer();
  },
};
document.addEventListener("click", (event) => {
  const b = event.target.closest("[data-action]");
  if (!b || b.disabled) return;
  event.preventDefault();
  try {
    const result = handlers[b.dataset.action]?.(b);
    if (result?.catch) result.catch((e) => toast(e.message));
  } catch (error) {
    toast(error.message);
  }
});
document.addEventListener("submit", (event) => event.preventDefault());
$("#modal").addEventListener("click", (event) => {
  if (event.target === $("#modal")) {
    const rect = event.target.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      closeModal();
  }
});
$("#import-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > 2_000_000)
    return toast("Import files must be smaller than 2 MB.");
  try {
    const r = validateRound(JSON.parse(await file.text()));
    if (
      [...r.inventory, ...r.challenge.inventory].some((id) => !findObject(id))
    )
      throw new Error("This round uses objects outside the current catalog.");
    if (state.rounds.length >= 50)
      throw new Error("Export and delete an older round first.");
    r.id = crypto.randomUUID();
    r.updatedAt = new Date().toISOString();
    state.rounds.unshift(r);
    state.current = r.id;
    state.tab = "workbench";
    persist();
    render();
    toast("Round imported. Observations are self-reported by its author.");
  } catch (error) {
    toast("Could not import: " + error.message);
  }
});
function updateTimer() {
  const el = $("#timer");
  if (el)
    el.textContent = state.elapsed
      ? `${state.timerOn ? "Pause" : "Resume"} ${Math.floor(state.elapsed / 60)}:${String(state.elapsed % 60).padStart(2, "0")}`
      : "Start timer";
}
setInterval(() => {
  if (state.timerOn) {
    state.elapsed++;
    updateTimer();
  }
}, 1000);
window.addEventListener("beforeunload", () => {
  syncAttempt();
  persist();
});
render();
persist();
fetch("/api/status")
  .then((r) => r.json())
  .then((s) => {
    state.ai = s;
    render();
  })
  .catch(() => toast("Server unavailable. Your local maps remain editable."));
if (persistenceWarning)
  toast(
    "Could not restore browser storage. Export rounds to keep a portable copy.",
  );
