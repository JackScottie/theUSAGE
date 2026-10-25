import test from "node:test";
import assert from "node:assert/strict";
import { challenges } from "../public/catalog.js";
import {
  validatePlan,
  auditPlan,
  examplePlan,
  freshRound,
  exportRound,
  validateRound,
} from "../public/engine.js";
test("all authored challenges have structurally valid, unverified examples", () => {
  for (const c of challenges) {
    const p = examplePlan(c, c.inventory);
    assert.ok(p, c.id);
    assert.deepEqual(validatePlan(p, c.inventory), [], c.id);
    assert.equal(auditPlan(p, c.inventory).verified, false);
    assert.ok(auditPlan(p, c.inventory).score < 40);
  }
});
test("removing a required object invalidates an otherwise observed solution", () => {
  const c = challenges[0],
    p = examplePlan(c, c.inventory),
    e = Object.fromEntries([
      ...p.steps.map((s) => [s.id, { outcome: "pass", note: "Observed" }]),
      ["goal", { outcome: "pass", note: "Observed" }],
    ]);
  assert.equal(auditPlan(p, c.inventory, e).verified, true);
  const a = auditPlan(
    p,
    c.inventory.filter((id) => id !== "tape"),
    e,
  );
  assert.equal(a.verified, false);
  assert.equal(a.score, 0);
  assert.ok(a.errors.some((x) => x.includes("tape")));
  assert.deepEqual(a.blockedSteps, ["s2", "s3", "s4"]);
});
test("goal alone cannot earn observed completion", () => {
  const c = challenges[0],
    p = examplePlan(c, c.inventory);
  assert.equal(
    auditPlan(p, c.inventory, { goal: { outcome: "pass" } }).verified,
    false,
  );
});
test("failed steps lower scores and cannot complete the goal", () => {
  const c = challenges[0],
    p = examplePlan(c, c.inventory),
    a = auditPlan(p, c.inventory, { s1: { outcome: "fail" } });
  assert.equal(a.score, auditPlan(p, c.inventory).score - 5);
  assert.equal(a.verified, false);
});
test("cycles, forward references, duplicate IDs, and invented objects are rejected", () => {
  const c = challenges[0];
  for (const mutate of [
    (p) => (p.steps[0].dependsOn = ["s4"]),
    (p) => (p.steps[1].id = "s1"),
    (p) => (p.steps[0].uses = ["scissors"]),
    (p) => (p.steps[0].dependsOn = ["s1"]),
  ]) {
    const p = examplePlan(c, c.inventory);
    mutate(p);
    assert.ok(validatePlan(p, c.inventory).length);
  }
});
test("malformed maps return errors without crashing", () => {
  for (const p of [
    null,
    [],
    {},
    {
      title: "x",
      summary: "y",
      status: "proposed",
      missing: [],
      steps: [null],
    },
  ])
    assert.ok(validatePlan(p, []).length);
});
test("no offline example is invented for a reduced deal", () => {
  const c = challenges[0];
  assert.equal(
    examplePlan(
      c,
      c.inventory.filter((id) => id !== "tape"),
    ),
    null,
  );
  const impossible = challenges.at(-1);
  assert.equal(
    examplePlan(impossible, [...impossible.inventory, "tape"]),
    null,
  );
});
test("insufficient resources cannot earn physical success points", () => {
  const c = challenges.at(-1),
    p = examplePlan(c, c.inventory),
    a = auditPlan(p, c.inventory, { goal: { outcome: "pass" } });
  assert.equal(a.score, 20);
  assert.equal(a.verified, false);
});
test("export/import preserves maps, observations, and known offline examples", () => {
  const r = freshRound(challenges[0]);
  r.plan = examplePlan(r.challenge, r.inventory);
  r.evidence.s1 = { outcome: "pass", note: "Observed", at: "2026-10-24" };
  const restored = validateRound(JSON.parse(JSON.stringify(exportRound(r))));
  assert.deepEqual(restored.plan.steps, r.plan.steps);
  assert.deepEqual(restored.evidence, r.evidence);
  assert.ok(examplePlan(restored.challenge, restored.inventory));
});
test("import retains broken resource links and unfinished draft maps", () => {
  const r = freshRound(challenges[0]);
  r.plan = examplePlan(r.challenge, r.inventory);
  r.inventory = r.inventory.filter((id) => id !== "tape");
  assert.ok(validateRound(exportRound(r)).plan);
  r.plan.steps = [];
  assert.equal(validateRound(exportRound(r)).plan.steps.length, 0);
});
test("import rejects malformed histories and removes executable-looking numeric metadata", () => {
  const r = freshRound(challenges[0]);
  r.challenge.minutes = "<img src=x onerror=alert(1)>";
  assert.equal(validateRound(exportRound(r)).challenge.minutes, 10);
  r.history = [{ plan: { title: "broken" } }];
  assert.throws(() => validateRound(exportRound(r)));
});
test("head-to-head attempts and revision snapshots round trip independently", () => {
  const r = freshRound(challenges[0], "duel");
  const human = examplePlan(r.challenge, r.inventory),
    ai = structuredClone(human);
  ai.title = "Opponent";
  r.plan = human;
  r.humanLocked = true;
  r.attempts = {
    human: { plan: human, evidence: {}, history: [] },
    ai: {
      plan: ai,
      evidence: { s1: { outcome: "fail", note: "Slipped" } },
      history: [],
    },
  };
  const restored = validateRound(exportRound(r));
  assert.equal(restored.attempts.human.plan.title, human.title);
  assert.equal(restored.attempts.ai.plan.title, "Opponent");
  assert.equal(restored.attempts.ai.evidence.s1.outcome, "fail");
});
