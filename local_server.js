import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { objects } from "./public/catalog.js";
import { solve } from "./lib/solver.js";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
export function createServer({
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_MODEL,
  solveImpl = solve,
} = {}) {
  let busy = false;
  const json = (res, status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  return http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'",
    );
    try {
      if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || ""))
        return json(res, 403, { error: "Only local hostnames are accepted." });
      const url = new URL(req.url, "http://localhost");
      if (req.method === "GET" && url.pathname === "/api/status")
        return json(res, 200, {
          ai: !!(apiKey && model),
          model: model || null,
          version: "1.0.0",
        });
      if (req.method === "POST" && url.pathname === "/api/solve") {
        if (
          req.headers.origin &&
          req.headers.origin !== `http://${req.headers.host}`
        )
          return json(res, 403, {
            error: "Cross-origin requests are not allowed.",
          });
        if (!req.headers["content-type"]?.startsWith("application/json"))
          return json(res, 415, { error: "Use application/json." });
        let body = "";
        for await (const chunk of req) {
          body += chunk;
          if (Buffer.byteLength(body) > 65000)
            return json(res, 413, { error: "Challenge is too large." });
        }
        let input;
        try {
          input = JSON.parse(body);
        } catch {
          return json(res, 400, { error: "Invalid JSON." });
        }
        const c = input.challenge;
        if (
          !c ||
          typeof c.brief !== "string" ||
          !c.brief.trim() ||
          c.brief.length > 4000 ||
          typeof c.success !== "string" ||
          !c.success.trim() ||
          c.success.length > 2000 ||
          !Array.isArray(c.environment) ||
          !Array.isArray(c.rules) ||
          [...c.environment, ...c.rules].some(
            (x) => typeof x !== "string" || x.length > 2000,
          )
        )
          return json(res, 400, {
            error: "Provide a goal, success criterion, environment, and rules.",
          });
        if (
          !Array.isArray(input.inventory) ||
          input.inventory.length > 20 ||
          !input.inventory.length ||
          new Set(input.inventory).size !== input.inventory.length ||
          input.inventory.some((id) => !objects.some((x) => x.id === id))
        )
          return json(res, 400, {
            error: "Provide a nonempty inventory of unique catalog object IDs.",
          });
        if (
          input.feedback != null &&
          (typeof input.feedback !== "string" || input.feedback.length > 4000)
        )
          return json(res, 400, {
            error: "Feedback must be at most 4000 characters.",
          });
        if (busy)
          return json(res, 429, {
            error: "Another AI request is running. Wait for it to finish.",
          });
        busy = true;
        try {
          const plan = await solveImpl(
            {
              challenge: {
                brief: c.brief,
                success: c.success,
                environment: c.environment,
                rules: c.rules,
              },
              inventory: input.inventory.map((id) =>
                objects.find((x) => x.id === id),
              ),
              feedback: input.feedback || "",
              previousPlan: input.previousPlan || null,
            },
            { apiKey, model },
          );
          return json(res, 200, { plan });
        } finally {
          busy = false;
        }
      }
      if (req.method !== "GET" && req.method !== "HEAD")
        return json(res, 405, { error: "Method not allowed." });
      const files = {
        "/": "index.html",
        "/index.html": "index.html",
        "/app.js": "app.js",
        "/styles.css": "styles.css",
        "/catalog.js": "catalog.js",
        "/engine.js": "engine.js",
        "/favicon.svg": "favicon.svg",
      };
      const file = files[url.pathname];
      if (!file) return json(res, 404, { error: "Not found." });
      const data = await readFile(path.join(root, file));
      const ext = path.extname(file);
      res.writeHead(200, {
        "Content-Type": {
          ".html": "text/html; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".js": "text/javascript; charset=utf-8",
          ".svg": "image/svg+xml",
        }[ext],
        "Cache-Control": "no-cache",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch (error) {
      const timeout = error.name === "TimeoutError";
      json(res, error.status || (timeout ? 504 : 500), {
        error: timeout
          ? "AI took too long. Your map is safe; try again."
          : error.status
            ? error.message
            : "The server could not complete this request.",
      });
    }
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const arg = process.argv.indexOf("--port");
  const port = Number(
    process.env.PORT || (arg >= 0 ? process.argv[arg + 1] : 8060),
  );
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be between 1 and 65535.");
  createServer().listen(port, "127.0.0.1", () =>
    console.log(
      `Usage Maps by theUSAGE: http://127.0.0.1:${port}\nLive AI: ${process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL ? "configured" : "offline - authored examples and manual maps available"}`,
    ),
  );
}
