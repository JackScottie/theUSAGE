import { objects } from "./catalog.js";
import { makeDeals, replay, rooms, shortestPath } from "./room-engine.js";

const byId = (id) => document.getElementById(id);
const deals = makeDeals();
let deal = deals[0];
let moves = [];
let pending = [];
let source = "Your turn";
let live = false;
let busy = false;

function render() {
  const room = rooms.find(({ id }) => id === deal.room);
  const { won, log, facts } = replay(deal, moves);
  const done = won || log.length >= deal.budget;
  byId("room-name").textContent = room.name;
  byId("meter").textContent = `${deal.budget - log.length} / ${deal.budget} moves left`;
  byId("scene").className = [room.id, ...facts].join(" ");
  byId("challenge").textContent = room.title;
  byId("brief").textContent = room.brief;
  byId("goal").textContent = room.goal;
  byId("result").textContent = won ? `${source} · ${room.result}`
    : done ? `${source} · Move budget spent.` : source;
  byId("inventory").replaceChildren(...deal.inventory.map((id) => {
    const object = objects.find((item) => item.id === id);
    const item = document.createElement("span");
    item.textContent = object.name;
    item.title = object.description;
    return item;
  }));
  byId("moves").replaceChildren(...room.moves
    .filter((action) => action.uses.every((id) => deal.inventory.includes(id)))
    .map((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      button.disabled = busy || done || pending.length > 0 || source !== "Your turn";
      button.onclick = () => {
        moves.push(action.id);
        render();
        const logEntry = byId("log").lastElementChild;
        logEntry.tabIndex = -1;
        logEntry.focus();
      };
      return button;
    }));
  byId("log").replaceChildren(...log.map((entry) => {
    const row = document.createElement("li");
    const label = room.moves.find(({ id }) => id === entry.id)?.label || entry.id;
    row.textContent = entry.error ? `${label} — blocked. ${entry.error}` : label;
    return row;
  }));
  byId("empty-log").hidden = log.length > 0;
  byId("match").disabled = busy || !live;
  byId("deal").disabled = busy;
  byId("reset").disabled = busy;
  byId("demo").disabled = busy;
  byId("replay").hidden = !pending.length || done;
}

function start(next) {
  deal = next;
  moves = [];
  pending = [];
  source = "Your turn";
  byId("notice").textContent = "";
  render();
}

byId("deal").onclick = () => {
  const candidates = makeDeals().filter(({ id }) => id !== deal.id);
  start(candidates[Math.floor(Math.random() * candidates.length)]);
};
byId("reset").onclick = () => start(deal);
byId("demo").onclick = () => {
  const room = rooms.find(({ id }) => id === deal.room);
  moves = [];
  pending = shortestPath(room, deal.inventory, deal.budget) || [];
  source = "Rule-engine solution";
  byId("notice").textContent = "";
  render();
  byId("replay").focus();
};
byId("replay").onclick = () => {
  moves.push(pending.shift());
  render();
  if (byId("replay").hidden) byId("result").focus();
};

byId("match").onclick = async () => {
  busy = true;
  byId("notice").textContent = "The setter is choosing a deal and the solver is planning its moves…";
  render();
  try {
    const response = await fetch("/api/room-match", { method: "POST" });
    const match = await response.json();
    if (!response.ok) throw new Error(match.error);
    deal = match.deal;
    moves = [];
    pending = match.moves;
    const outcome = replay(deal, pending);
    source = pending.length ? "Model replay" : "Solver submitted no moves";
    byId("notice").textContent = `Setter: ${match.setterModel} · Solver: ${match.solverModel} · ${outcome.won ? "Solver wins" : "Setter wins"}`;
  } catch (error) {
    byId("notice").textContent = error.message;
  } finally {
    busy = false;
    render();
    if (pending.length) byId("replay").focus();
  }
};

render();
try {
  const response = await fetch("/api/status");
  live = Boolean(response.ok && (await response.json()).roomAI);
} catch {}
byId("connection").textContent = live ? "Live models available" : "Offline play · configure models in .env for AI matches";
render();
