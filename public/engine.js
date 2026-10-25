import { objects, challenges } from "./catalog.js";
export const PLAN_VERSION = 1;
export function validatePlan(plan, inventory) {
  const errors = [];
  if (!plan || typeof plan !== "object" || Array.isArray(plan))
    return ["A plan must be an object."];
  for (const key of ["title", "summary"])
    if (
      typeof plan[key] !== "string" ||
      !plan[key].trim() ||
      plan[key].length > 3000
    )
      errors.push(`Provide a ${key} of 1–3000 characters.`);
  if (!["proposed", "insufficient"].includes(plan.status))
    errors.push("Plan status must be proposed or insufficient.");
  if (
    !Array.isArray(plan.missing) ||
    plan.missing.some((x) => typeof x !== "string" || x.length > 1000)
  )
    errors.push("Missing capabilities must be a list of short text entries.");
  if (!Array.isArray(plan.steps) || plan.steps.length > 20)
    return [...errors, "A map may contain at most 20 steps."];
  if (plan.status === "proposed" && !plan.steps.length)
    errors.push("A proposed solution needs at least one step.");
  if (plan.status === "insufficient" && plan.steps.length)
    errors.push(
      "An insufficient-resource response must not contain execution steps.",
    );
  if (plan.status === "insufficient" && !plan.missing?.length)
    errors.push("Explain at least one missing capability.");
  const seen = new Set();
  for (const [i, s] of plan.steps.entries()) {
    if (!s || typeof s !== "object") {
      errors.push(`Step ${i + 1} is invalid.`);
      continue;
    }
    if (
      typeof s.id !== "string" ||
      !/^s[1-9][0-9]?$/.test(s.id) ||
      seen.has(s.id)
    )
      errors.push(`Step ${i + 1} needs a unique ID such as s1.`);
    for (const key of ["title", "action", "output"])
      if (typeof s[key] !== "string" || !s[key].trim() || s[key].length > 3000)
        errors.push(`Step ${i + 1}: ${key} is missing or too long.`);
    for (const key of ["uses", "dependsOn", "assumptions"])
      if (
        !Array.isArray(s[key]) ||
        s[key].some((x) => typeof x !== "string" || x.length > 1500)
      )
        errors.push(`Step ${i + 1}: ${key} must be a list of text.`);
    if (Array.isArray(s.uses))
      for (const id of s.uses)
        if (!inventory.includes(id))
          errors.push(`Step ${i + 1} uses unavailable object: ${id}.`);
    if (Array.isArray(s.dependsOn))
      for (const id of s.dependsOn)
        if (!seen.has(id))
          errors.push(
            `Step ${i + 1} depends on a missing or later step: ${id}.`,
          );
    if (
      Array.isArray(s.dependsOn) &&
      new Set(s.dependsOn).size !== s.dependsOn.length
    )
      errors.push(`Step ${i + 1} has a duplicate dependency.`);
    seen.add(s.id);
  }
  return errors;
}
export function auditPlan(plan, inventory, evidence = {}) {
  if (!plan)
    return {
      errors: [],
      used: [],
      assumptions: 0,
      passed: 0,
      failed: 0,
      score: 0,
      structural: false,
      verified: false,
    };
  const errors = validatePlan(plan, inventory);
  const used = [
    ...new Set(
      (plan.steps || []).flatMap((s) => (Array.isArray(s.uses) ? s.uses : [])),
    ),
  ];
  const assumptions = (plan.steps || []).reduce(
    (n, s) => n + (s.assumptions?.length || 0),
    0,
  );
  const passed = (plan.steps || []).filter(
    (s) => evidence[s.id]?.outcome === "pass",
  ).length;
  const failed = (plan.steps || []).filter(
    (s) => evidence[s.id]?.outcome === "fail",
  ).length;
  const blocked = new Set();
  for (const s of plan.steps || [])
    if (
      (s.uses || []).some((id) => !inventory.includes(id)) ||
      (s.dependsOn || []).some((id) => blocked.has(id)) ||
      evidence[s.id]?.outcome === "fail"
    )
      blocked.add(s.id);
  const structural = errors.length === 0;
  const verified =
    structural &&
    plan.status === "proposed" &&
    plan.steps.length > 0 &&
    passed === plan.steps.length &&
    evidence.goal?.outcome === "pass";
  const score = structural
    ? Math.max(
        0,
        Math.round(
          20 +
            (plan.status === "proposed"
              ? Math.max(0, 10 - used.length) +
                Math.max(0, 10 - plan.steps.length)
              : 0) +
            (plan.steps.length ? (30 * passed) / plan.steps.length : 0) +
            (verified ? 30 : 0) -
            failed * 5,
        ),
      )
    : 0;
  return {
    errors,
    used,
    assumptions,
    passed,
    failed,
    score,
    structural,
    verified,
    blockedSteps: [...blocked],
  };
}
export function examplePlan(challenge, inventory) {
  const solution = challenge.solutions?.find(
    (s) =>
      (s.status === "insufficient" &&
        challenge.inventory.length === inventory.length &&
        challenge.inventory.every((id) => inventory.includes(id))) ||
      (s.status !== "insufficient" &&
        s.steps.every((x) => x.uses.every((id) => inventory.includes(id)))),
  );
  if (!solution) return null;
  return {
    ...structuredClone(solution),
    status: solution.status || "proposed",
    missing: solution.missing || [],
    source: "authored",
    createdAt: new Date().toISOString(),
  };
}
export function freshRound(challenge, mode = "workshop") {
  return {
    id: globalThis.crypto.randomUUID(),
    challenge: structuredClone(challenge),
    inventory: [...challenge.inventory],
    mode,
    plan: null,
    evidence: {},
    notes: "",
    selectedStep: null,
    player: "human",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
export function exportRound(round) {
  return {
    format: "theusage-round",
    version: PLAN_VERSION,
    exportedAt: new Date().toISOString(),
    round,
  };
}
export function validateRound(data) {
  if (
    data?.format !== "theusage-round" ||
    data.version !== PLAN_VERSION ||
    !data.round
  )
    throw new Error("Not a supported Usage Maps round.");
  const r = data.round,
    c = r.challenge;
  if (
    !c ||
    ["id", "title", "brief", "success"].some(
      (k) => typeof c[k] !== "string" || !c[k].trim() || c[k].length > 5000,
    )
  )
    throw new Error("The challenge is incomplete.");
  for (const k of ["environment", "rules", "inventory"])
    if (
      !Array.isArray(c[k]) ||
      c[k].length > 30 ||
      c[k].some((x) => typeof x !== "string" || x.length > 3000)
    )
      throw new Error("Invalid challenge rules or inventory.");
  const catalog = objects.map((o) => o.id);
  const inventoryOK = (ids) =>
    Array.isArray(ids) &&
    ids.length <= catalog.length &&
    new Set(ids).size === ids.length &&
    ids.every((id) => catalog.includes(id));
  if (!inventoryOK(r.inventory) || !inventoryOK(c.inventory))
    throw new Error("Invalid dealt inventory.");
  const cleanPlan = (p) => {
    if (!p) return null;
    const errors = validatePlan(p, catalog).filter(
      (e) => e !== "A proposed solution needs at least one step.",
    );
    if (errors.length) throw new Error(errors[0]);
    return {
      title: p.title,
      summary: p.summary,
      status: p.status,
      missing: [...p.missing],
      steps: p.steps.map((s) => ({
        id: s.id,
        title: s.title,
        action: s.action,
        output: s.output,
        uses: [...s.uses],
        dependsOn: [...s.dependsOn],
        assumptions: [...s.assumptions],
      })),
      source: ["ai", "authored", "human"].includes(p.source)
        ? p.source
        : "human",
      model: typeof p.model === "string" ? p.model.slice(0, 100) : undefined,
      createdAt: typeof p.createdAt === "string" ? p.createdAt : undefined,
    };
  };
  if (!r.id || typeof r.id !== "string") throw new Error("Round ID missing.");
  if (r.evidence && typeof r.evidence !== "object")
    throw new Error("Invalid observations.");
  const cleanEvidence = (raw) => {
    const evidence = {};
    for (const [key, value] of Object.entries(raw || {}))
      if (/^s\d+$/.test(key) || key === "goal") {
        if (value && ["pass", "fail", "untested"].includes(value.outcome))
          evidence[key] = {
            outcome: value.outcome,
            note:
              typeof value.note === "string" ? value.note.slice(0, 3000) : "",
            at: typeof value.at === "string" ? value.at : "",
          };
      }
    return evidence;
  };
  const cleanHistory = (raw) =>
    Array.isArray(raw)
      ? raw
          .slice(-12)
          .map((x) => ({
            at: typeof x.at === "string" ? x.at : "",
            label:
              typeof x.label === "string"
                ? x.label.slice(0, 200)
                : "Earlier revision",
            plan: cleanPlan(x.plan),
            evidence: cleanEvidence(x.evidence),
            inventory: inventoryOK(x.inventory) ? x.inventory : [],
          }))
          .filter((x) => x.plan)
      : [];
  const attempts = {};
  for (const player of ["human", "ai"])
    if (r.attempts?.[player]) {
      const entry = r.attempts[player];
      attempts[player] = {
        plan: cleanPlan(entry.plan),
        evidence: cleanEvidence(entry.evidence),
        history: cleanHistory(entry.history),
      };
    }
  const challenge = {
    id: c.id,
    title: c.title,
    brief: c.brief,
    success: c.success,
    inventory: [...c.inventory],
    rules: [...c.rules],
    environment: [...c.environment],
    minutes:
      Number.isInteger(c.minutes) && c.minutes > 0 && c.minutes <= 120
        ? c.minutes
        : 10,
    number: typeof c.number === "string" ? c.number.slice(0, 20) : "CUSTOM",
    shortTitle:
      typeof c.shortTitle === "string" ? c.shortTitle.slice(0, 200) : c.title,
    category:
      typeof c.category === "string" ? c.category.slice(0, 50) : "Custom",
    difficulty:
      typeof c.difficulty === "string" ? c.difficulty.slice(0, 50) : "Custom",
    hint: typeof c.hint === "string" ? c.hint.slice(0, 1000) : "",
    solutions: [],
  };
  const known = challenges.find(
    (x) =>
      x.id === c.id &&
      ["title", "brief", "success", "inventory", "rules", "environment"].every(
        (k) => JSON.stringify(x[k]) === JSON.stringify(c[k]),
      ),
  );
  if (known) challenge.solutions = structuredClone(known.solutions);
  return {
    id: r.id.slice(0, 100),
    challenge,
    inventory: [...r.inventory],
    plan: cleanPlan(r.plan),
    mode: ["workshop", "human", "duel"].includes(r.mode) ? r.mode : "workshop",
    evidence: cleanEvidence(r.evidence),
    notes: typeof r.notes === "string" ? r.notes.slice(0, 10000) : "",
    selectedStep: null,
    history: cleanHistory(r.history),
    attempts,
    player: r.player === "ai" ? "ai" : "human",
    humanLocked: r.humanLocked === true,
    revealed: r.revealed === true,
    createdAt:
      typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
    updatedAt:
      typeof r.updatedAt === "string" ? r.updatedAt : new Date().toISOString(),
  };
}
