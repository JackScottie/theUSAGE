import { objects } from "../public/catalog.js";
import { makeDeals, rooms } from "../public/room-engine.js";
import { requestStructured } from "./solver.js";

const names = (ids) => ids.map((id) => objects.find((object) => object.id === id));
const schema = (key, field) => ({
  type: "object", additionalProperties: false, required: [key], properties: { [key]: field },
});

export async function runMatch({ apiKey, setterModel, solverModel, request = requestStructured }) {
  const deals = makeDeals();
  const choice = await request({
    name: "room_setter",
    instructions: "You are the setter in a household invention game. Pick the deal most likely to require an unconventional use or a multi-object chain. Every deal is solvable. The solver has exactly the stated move budget. Return only the chosen deal ID.",
    input: deals.map(({ id, room, inventory, budget }) => {
      const { brief, goal } = rooms.find((entry) => entry.id === room);
      return { id, brief, goal, inventory: names(inventory), budget };
    }),
    schema: schema("dealId", { type: "string", enum: deals.map(({ id }) => id) }),
  }, { apiKey, model: setterModel });
  const deal = deals.find(({ id }) => id === choice?.dealId);
  if (!deal) throw Object.assign(new Error("The setter returned an unknown deal."), { status: 502 });

  const { brief, goal, moves } = rooms.find(({ id }) => id === deal.room);
  const attempt = await request({
    name: "room_solver",
    instructions: "Solve this household puzzle using only listed moves and the provided inventory. Start with no facts. Every move requires all its listed items and facts and adds one fact. Reach the solved fact within budget. Return the sequence of move IDs, or an empty list if you find no solution.",
    input: { brief, goal, inventory: names(deal.inventory), budget: deal.budget, moves },
    schema: schema("moves", { type: "array", items: { type: "string" } }),
  }, { apiKey, model: solverModel });
  if (!Array.isArray(attempt?.moves) || attempt.moves.some((id) => typeof id !== "string"))
    throw Object.assign(new Error("The solver returned an invalid move list."), { status: 502 });
  return { deal, moves: attempt.moves.slice(0, deal.budget), setterModel, solverModel };
}
