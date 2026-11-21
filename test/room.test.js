import assert from "node:assert/strict";
import test from "node:test";
import { makeDeals, replay, rooms, shortestPath } from "../public/room-engine.js";
import { runMatch } from "../lib/room-match.js";
import { createServer } from "../local_server.js";

test("each room deal has a winning route within budget and none shorter", () => {
  for (const random of [() => 0, () => 0.99, Math.random]) {
    for (const deal of makeDeals(random)) {
      const room = rooms.find(({ id }) => id === deal.room);
      assert.equal(new Set(deal.inventory).size, 6);
      assert.equal(shortestPath(room, deal.inventory, deal.budget - 1), null);
      const path = shortestPath(room, deal.inventory, deal.budget);
      assert.equal(replay(deal, path).won, true);
    }
  }
});

test("invalid moves spend budget without changing room state", () => {
  const deal = makeDeals(() => 0)[0];
  const result = replay(deal, ["fit-paper", "shape-foil", "fold-paper", "fit-paper", "test"]);
  assert.match(result.log[0].error, /First/);
  assert.match(result.log[1].error, /Missing/);
  assert.equal(result.log.length, deal.budget);
  assert.deepEqual(result.facts, ["paper-shim"]);
  assert.equal(result.won, false);
});

test("the setter and solver use separate model calls and a referee checks the result", async () => {
  const calls = [];
  const match = await runMatch({
    setterModel: "setter", solverModel: "solver", apiKey: "test",
    request: async ({ input }, { model }) => {
      calls.push(model);
      if (model === "setter") {
        assert.ok(input.some(({ id }) => id === "workshop-2"));
        return { dealId: "workshop-2" };
      }
      assert.equal(input.inventory.length, 6);
      assert.equal(input.budget, 4);
      assert.deepEqual(Object.keys(input), ["brief", "goal", "inventory", "budget", "moves"]);
      return { moves: ["lay-ruler", "anchor-ruler", "guide-ruler", "roll"] };
    },
  });
  assert.deepEqual(calls, ["setter", "solver"]);
  assert.equal(replay(match.deal, match.moves).won, true);
});

test("Room Lab serves its assets and only runs a configured same-origin match", async (t) => {
  const server = createServer({
    apiKey: "test", model: "test", setterModel: "setter", solverModel: "solver",
    matchImpl: async ({ setterModel, solverModel }) => ({
      deal: makeDeals(() => 0)[0], moves: ["fold-paper", "fit-paper", "test"], setterModel, solverModel,
    }),
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const path of ["/room", "/room.css", "/room.js", "/room-engine.js"]) {
    assert.equal((await fetch(origin + path)).status, 200);
  }
  const match = (originHeader) => fetch(origin + "/api/room-match", {
    method: "POST", headers: { Origin: originHeader },
  });
  assert.equal((await match("https://example.com")).status, 403);
  const response = await match(origin);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.setterModel, "setter");
  assert.equal(result.solverModel, "solver");
  assert.equal(replay(result.deal, result.moves).won, true);
});
