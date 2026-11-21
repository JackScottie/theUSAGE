import { objects } from "./catalog.js";

const move = (id, label, uses, needs, gives) => ({ id, label, uses, needs, gives });
export const rooms = [
  {
    id: "studio", name: "The Studio", title: "The wobbly table",
    brief: "A short leg leaves a gap under the drawing table. Materials can be folded or shaped by hand.",
    goal: "Stabilize the table, then test it.", result: "The table holds steady.",
    moves: [
      move("fold-paper", "Fold paper into a shim", ["paper"], [], "paper-shim"),
      move("fold-card", "Fold cardboard into a wedge", ["card"], [], "card-wedge"),
      move("shape-foil", "Compress foil into a shim", ["foil"], [], "foil-shim"),
      move("fit-paper", "Fit the paper shim under the leg", ["paper"], ["paper-shim"], "supported"),
      move("fit-card", "Fit the cardboard wedge under the leg", ["card"], ["card-wedge"], "supported"),
      move("fit-foil", "Fit the foil shim under the leg", ["foil"], ["foil-shim"], "supported"),
      move("test", "Press lightly on opposite corners", [], ["supported"], "solved"),
    ],
    routes: [["paper"], ["card"], ["foil"]],
  },
  {
    id: "utility", name: "The Utility Room", title: "Across the drainboard",
    brief: "A shallow clean-water tray sits beside an empty tray. Both trays are fixed in place. Only a small sample needs to cross.",
    goal: "Transfer a sample of water to the empty tray.", result: "The receiving tray contains water.",
    moves: [
      move("scoop", "Scoop water with the spoon", ["spoon"], [], "full-spoon"),
      move("pour", "Tip the spoon into the receiving tray", ["spoon"], ["full-spoon"], "solved"),
      move("soak", "Soak up water with the sponge", ["sponge"], [], "wet-sponge"),
      move("squeeze", "Squeeze the sponge over the tray", ["sponge"], ["wet-sponge"], "solved"),
      move("pinch-foil", "Shape foil into a shallow cup", ["foil"], [], "foil-cup"),
      move("fill-foil", "Dip the foil cup in the source tray", ["foil"], ["foil-cup"], "full-foil"),
      move("empty-foil", "Empty the foil cup into the receiving tray", ["foil"], ["full-foil"], "solved"),
    ],
    routes: [["spoon"], ["sponge"], ["foil"]],
  },
  {
    id: "workshop", name: "The Workshop", title: "Mind the gap",
    brief: "A small ball must cross a gap between two workbenches. The room allows a gentle push at launch and a catch on arrival. Both edges can support a bridge.",
    goal: "Roll the ball across a supported crossing.", result: "The ball reaches the far bench.",
    moves: [
      move("fold-channel", "Fold cardboard into a guide channel", ["card"], [], "channel"),
      move("seat-channel", "Seat the channel on both bench edges", ["card"], ["channel"], "crossing"),
      move("lay-ruler", "Lay the ruler across the gap", ["ruler"], [], "ruler-spans"),
      move("anchor-ruler", "Tape the ruler to both benches", ["ruler", "tape"], ["ruler-spans"], "ruler-anchored"),
      move("guide-ruler", "Tape folded paper guides along the ruler", ["ruler", "tape", "paper"], ["ruler-anchored"], "crossing"),
      move("roll", "Roll the ball through the crossing", ["ball"], ["crossing"], "solved"),
    ],
    routes: [["ball", "card"], ["ball", "ruler", "tape", "paper"]],
  },
];

export function transition(room, inventory, facts, id) {
  const action = room.moves.find((entry) => entry.id === id);
  if (!action) return { error: "Unknown move." };
  if (facts.includes("solved")) return { error: "The round is already solved." };
  const missing = action.uses.filter((item) => !inventory.includes(item));
  if (missing.length) return {
    error: `Missing ${missing.map((id) => objects.find((item) => item.id === id).name).join(", ")}.`,
  };
  const prerequisites = action.needs.filter((fact) => !facts.includes(fact));
  if (prerequisites.length) return {
    error: `First: ${prerequisites.map((fact) => room.moves.filter((entry) => entry.gives === fact && entry.uses.every((item) => inventory.includes(item))).map((entry) => entry.label).join(" or ") || fact).join("; ")}.`,
  };
  if (facts.includes(action.gives)) return { error: "That result is already in place." };
  return { facts: [...facts, action.gives] };
}

export function shortestPath(room, inventory, maxMoves) {
  const queue = [{ facts: [], path: [] }];
  const seen = new Set();
  for (const { facts, path } of queue) {
    if (facts.includes("solved")) return path;
    if (path.length >= maxMoves) continue;
    for (const action of room.moves) {
      const next = transition(room, inventory, facts, action.id);
      if (next.error) continue;
      const key = [...next.facts].sort().join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ facts: next.facts, path: [...path, action.id] });
    }
  }
  return null;
}

export function makeDeals(random = Math.random) {
  return rooms.flatMap((room) => room.routes.map((route, index) => {
    const pool = objects.map(({ id }) => id).filter((id) =>
      !room.routes.some((branch) => branch.includes(id))
    );
    const inventory = [...route];
    while (inventory.length < 6) {
      inventory.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
    }
    const minimum = shortestPath(room, inventory, 8).length;
    return { id: `${room.id}-${index + 1}`, room: room.id, inventory, budget: minimum };
  }));
}

export function replay(deal, moves) {
  const room = rooms.find(({ id }) => id === deal.room);
  let facts = [];
  const log = [];
  for (const id of moves.slice(0, deal.budget)) {
    const result = transition(room, deal.inventory, facts, id);
    log.push({ id, ...result });
    if (result.facts) facts = result.facts;
    if (facts.includes("solved")) break;
  }
  return { facts, log, won: facts.includes("solved") };
}
