import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createServer } from "../local_server.js";
import { solve } from "../lib/solver.js";
import { challenges, objects } from "../public/catalog.js";
import { examplePlan } from "../public/engine.js";
const challenge = challenges[0],
  input = { challenge, inventory: challenge.inventory };
async function withServer(options, fn) {
  const server = createServer(options);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((r) => server.close(r));
  }
}
const post = (base, body, headers = {}) =>
  fetch(base + "/api/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
test("serves app, dependencies, health, and no secret files", async () =>
  withServer({ apiKey: "private-test-key", model: "test" }, async (base) => {
    for (const path of [
      "/",
      "/app.js",
      "/catalog.js",
      "/engine.js",
      "/styles.css",
      "/favicon.svg",
    ])
      assert.equal((await fetch(base + path)).status, 200, path);
    const response = await fetch(base + "/api/status"),
      body = await response.json();
    assert.equal(body.ai, true);
    assert.ok(!JSON.stringify(body).includes("private-test-key"));
    for (const path of ["/.env", "/main.py", "/package.json", "/lib/solver.js"])
      assert.equal((await fetch(base + path)).status, 404);
  }));
test("unconfigured solver is an honest 503", async () =>
  withServer({ apiKey: "", model: "" }, async (base) => {
    const r = await post(base, input);
    assert.equal(r.status, 503);
    assert.match((await r.json()).error, /not configured/);
  }));
test("rejects cross-origin requests and malformed inventory", async () =>
  withServer({}, async (base) => {
    assert.equal(
      (await post(base, input, { Origin: "https://other.example" })).status,
      403,
    );
    for (const inventory of [[], ["scissors"], ["card", "card"]])
      assert.equal((await post(base, { ...input, inventory })).status, 400);
    assert.equal((await post(base, { ...input, challenge: {} })).status, 400);
    assert.equal(
      (
        await fetch(base + "/api/solve", {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: "{}",
        })
      ).status,
      415,
    );
  }));

test("rejects nonlocal Host headers", async () =>
  withServer({}, async (base) => {
    const status = await new Promise((resolve, reject) => {
      http.get(base + "/api/status", { headers: { Host: "foreign.example" } }, response => {
        response.resume();
        resolve(response.statusCode);
      }).on("error", reject);
    });
    assert.equal(status, 403);
  }));
test("server resolves IDs to authoritative object properties", async () =>
  withServer(
    {
      apiKey: "test",
      model: "test",
      solveImpl: async (request) => {
        assert.equal(request.inventory[0].id, "card");
        assert.match(request.inventory[0].quantity, /20 × 30/);
        return examplePlan(challenge, challenge.inventory);
      },
    },
    async (base) => {
      const r = await post(base, input);
      assert.equal(r.status, 200);
      assert.equal((await r.json()).plan.source, "authored");
    },
  ));
test("rejects concurrent AI requests", async () => {
  let release;
  const waiting = new Promise((r) => (release = r));
  let started;
  const began = new Promise((r) => (started = r));
  await withServer(
    {
      solveImpl: async () => {
        started();
        await waiting;
        return examplePlan(challenge, challenge.inventory);
      },
    },
    async (base) => {
      const pending = post(base, input);
      await began;
      assert.equal((await post(base, input)).status, 429);
      release();
      assert.equal((await pending).status, 200);
    },
  );
});
test("live adapter uses Responses structured outputs and validates object constraints", async () => {
  const expected = examplePlan(challenge, challenge.inventory);
  const request = {
    challenge,
    inventory: challenge.inventory.map((id) =>
      objects.find((o) => o.id === id),
    ),
  };
  let sent;
  const fetchImpl = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    sent = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        status: "completed",
        output: [
          {
            content: [{ type: "output_text", text: JSON.stringify(expected) }],
          },
        ],
      }),
    };
  };
  const p = await solve(request, {
    apiKey: "test",
    model: "chosen-model",
    fetchImpl,
  });
  assert.equal(p.source, "ai");
  assert.equal(sent.store, false);
  assert.equal(sent.text.format.type, "json_schema");
  assert.equal(sent.text.format.strict, true);
  assert.equal(sent.model, "chosen-model");
  expected.steps[0].uses = ["scissors"];
  await assert.rejects(
    () => solve(request, { apiKey: "test", model: "test", fetchImpl }),
    /unavailable object/,
  );
});
test("live adapter handles refusals, incomplete output, provider errors, and invalid JSON", async () => {
  const request = { challenge, inventory: [] };
  for (const [payload, pattern] of [
    [{ status: "incomplete" }, /incomplete/],
    [{ output: [{ content: [{ type: "refusal" }] }] }, /declined/],
    [
      { output: [{ content: [{ type: "output_text", text: "not JSON" }] }] },
      /readable/,
    ],
  ])
    await assert.rejects(
      () =>
        solve(request, {
          apiKey: "test",
          model: "test",
          fetchImpl: async () => ({ ok: true, json: async () => payload }),
        }),
      pattern,
    );
  await assert.rejects(
    () =>
      solve(request, {
        apiKey: "test",
        model: "test",
        fetchImpl: async () => ({
          ok: false,
          status: 429,
          json: async () => ({ error: { code: "rate_limit" } }),
        }),
      }),
    /429/,
  );
});
