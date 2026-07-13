/*
 * Local replica for theUSAGE.
 * Project Foundry detects the default URL: http://127.0.0.1:8060
 *
 * The original app was a Python 2 Google App Engine webapp2 service backed by
 * App Engine datastore records and saved Wikipedia Book Creator exports. Those
 * runtime pieces are not present in this repository, so this server recreates
 * the visible search page and reports missing corpus results honestly.
 */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URLSearchParams } = require("node:url");

const HOST = "127.0.0.1";
const DEFAULT_PORT = 8060;

const expectedBooks = Array.from({ length: 17 }, (_, index) => {
  const bookNumber = index + 2;
  return path.join(__dirname, "static", `toolbook${bookNumber}.txt`);
});

function commandLinePort(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if ((arg === "--port" || arg === "-p") && argv[index + 1]) {
      return argv[index + 1];
    }
    const match = arg.match(/^--port=(\d+)$/);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function configuredPort() {
  const value = process.env.PORT || commandLinePort(process.argv.slice(2)) || DEFAULT_PORT;
  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${value}`);
  }
  return port;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadCorpusEntries() {
  const presentBooks = expectedBooks.filter((book) => fs.existsSync(book));
  if (presentBooks.length === 0) {
    return {
      source: "missing",
      entries: [],
      message:
        "The original App Engine datastore and static/toolbook2.txt through static/toolbook18.txt corpus files are not present in this repo.",
    };
  }

  const entries = [];
  const articleTitlePattern = /([A-Za-z][A-Za-z0-9 ()'/-]{1,80})\s+\d+/g;
  const usagePattern =
    /(?:(?:\bis a\b)|(?:\bis an\b)|(?:\bare\b))[\s\S]{3,120}?(?:(?:\bwhich\b)|(?:\bfor\b)|(?:\bthat\b)|(?:\bto\b))[\s\S]+?\./i;
  const fallbackTerms = [
    " used",
    "used",
    "designed to",
    "is a tool for",
    "useful for",
    "Usage",
    "meant for",
    "purpose of the",
    "function is",
    " uses",
    "They use",
    "is a machine",
  ];

  for (const book of presentBooks) {
    const data = fs.readFileSync(book, "utf8");
    const titles = [];
    let match;
    while ((match = articleTitlePattern.exec(data)) && titles.length < 400) {
      const title = match[1].replace(/\s+/g, " ").trim();
      if (title && !titles.includes(title)) {
        titles.push(title);
      }
    }

    let searchFrom = Math.max(0, data.indexOf("Article Licenses"));
    for (const title of titles) {
      const articleStart = data.indexOf(title, searchFrom);
      if (articleStart === -1) {
        continue;
      }
      searchFrom = articleStart + title.length;
      const articleEnd = data.indexOf("References", articleStart);
      const excerptEnd = articleEnd === -1 ? Math.min(data.length, articleStart + 2500) : articleEnd;
      const excerpt = data.slice(articleStart, excerptEnd).replace(/\s+/g, " ");
      const regexUse = excerpt.match(usagePattern);
      let use = regexUse ? regexUse[0] : "";

      if (!use) {
        const firstTerm = fallbackTerms
          .map((term) => {
            const index = excerpt.indexOf(term);
            return index === -1 ? null : { term, index };
          })
          .filter(Boolean)
          .sort((a, b) => a.index - b.index)[0];
        if (firstTerm) {
          const sentenceEnd = excerpt.indexOf(".", firstTerm.index);
          use =
            sentenceEnd === -1
              ? excerpt.slice(firstTerm.index, firstTerm.index + 160)
              : excerpt.slice(firstTerm.index, sentenceEnd + 1);
        }
      }

      if (use) {
        entries.push({
          searchTool: title.toLowerCase(),
          tool: title,
          use: use.length > 2000 ? use.slice(0, 140) : use,
        });
      }
    }
  }

  return {
    source: "toolbooks",
    entries,
    message: `Loaded ${entries.length} extracted use records from ${presentBooks.length} saved Wikipedia book file(s).`,
  };
}

function renderPage({ tool = "", result = null, error = "", corpus }) {
  const resultMarkup = result
    ? `<section class="result">
        <h2>${escapeHtml(result.tool)}</h2>
        <p>${escapeHtml(result.use)}</p>
      </section>`
    : "";
  const errorMarkup = error ? `<p class="error">${escapeHtml(error)}</p>` : "";
  const noticeMarkup =
    corpus.source === "missing"
      ? `<aside class="notice">${escapeHtml(corpus.message)} The original search UI is available here as a local replica.</aside>`
      : `<aside class="notice">${escapeHtml(corpus.message)}</aside>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>theUSAGE</title>
  <style>
    body {
      margin: 0;
      background: #f4f1e8;
      color: #222;
      font-family: Georgia, "Times New Roman", serif;
    }
    main {
      max-width: 760px;
      margin: 54px auto;
      padding: 0 24px;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 46px;
      font-weight: normal;
      letter-spacing: 0;
    }
    .tagline {
      margin: 0 0 34px;
      color: #555;
      font-size: 19px;
    }
    form {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 20px;
      border: 1px solid #c9c1a8;
      background: #fffdf6;
    }
    label {
      width: 100%;
      font-size: 15px;
      color: #333;
    }
    input[type="text"] {
      flex: 1 1 260px;
      min-width: 0;
      padding: 9px 10px;
      border: 1px solid #a9a188;
      font: 18px Georgia, "Times New Roman", serif;
      background: white;
    }
    button {
      padding: 9px 14px;
      border: 1px solid #5b574c;
      background: #2f2f2b;
      color: white;
      font: 16px Georgia, "Times New Roman", serif;
      cursor: pointer;
    }
    .result,
    .notice,
    .error {
      margin-top: 20px;
      padding: 16px 18px;
      border: 1px solid #d0c7ad;
      background: #fffdf6;
    }
    .result h2 {
      margin: 0 0 8px;
      font-size: 26px;
      font-weight: normal;
    }
    .result p,
    .notice,
    .error {
      line-height: 1.45;
      font-size: 16px;
    }
    .error {
      color: #7c231b;
    }
    footer {
      margin-top: 36px;
      color: #6c6658;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <main>
    <h1>theUSAGE</h1>
    <p class="tagline">A tool to help robots understand the world through the usage of objects.</p>
    <form method="post" action="/">
      <label for="tool">What object should the robot understand?</label>
      <input id="tool" name="tool" type="text" value="${escapeHtml(tool)}" autofocus>
      <button type="submit">Find Use</button>
      <button type="submit" name="is_rand" value="True">Random</button>
    </form>
    ${errorMarkup}
    ${resultMarkup}
    ${noticeMarkup}
    <footer>Local faithful replica of the original Python 2 Google App Engine app.</footer>
  </main>
</body>
</html>`;
}

function findResult(params, corpus) {
  if (corpus.entries.length === 0) {
    return {
      tool: params.get("tool") || "",
      result: null,
      error: "There were not any results.",
    };
  }

  let tool = (params.get("tool") || "").trim();
  if (!tool && params.get("is_rand") === "True") {
    const entry = corpus.entries[Math.floor(Math.random() * corpus.entries.length)];
    return { tool: entry.tool, result: entry, error: "" };
  }

  if (!tool) {
    return { tool: "", result: null, error: "" };
  }

  const result = corpus.entries.find((entry) => entry.searchTool === tool.toLowerCase());
  return {
    tool,
    result,
    error: result ? "" : "There were not any results.",
  };
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

const corpus = loadCorpusEntries();
const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "GET" && (request.url === "/" || request.url === "/index.html")) {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(renderPage({ corpus }));
      return;
    }

    if (request.method === "GET" && request.url === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.method === "POST" && request.url === "/") {
      const body = await readBody(request);
      const params = new URLSearchParams(body);
      const lookup = findResult(params, corpus);
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(renderPage({ ...lookup, corpus }));
      return;
    }

    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error.stack || String(error));
  }
});

const port = configuredPort();
server.listen(port, HOST, () => {
  console.log(`theUSAGE local replica running at http://${HOST}:${port}`);
  console.log(corpus.message);
});
