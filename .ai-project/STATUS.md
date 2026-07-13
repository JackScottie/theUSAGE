# Status

Last updated: 2026-07-12

## Now
- Local faithful replica added for Project Foundry.
- The original source is a Python 2 Google App Engine `webapp2` app in `main.py`.
- The runnable local entrypoint is `local_server.js`, a small Node HTTP server that recreates the root search page without changing the original App Engine artifact.

## Risks
- The original App Engine datastore is not present in this repo.
- The referenced saved Wikipedia Book Creator files, `static/toolbook2.txt` through `static/toolbook18.txt`, are not present in this repo.
- The original Jinja templates and favicon handlers are not present in this repo, so the local page is a close plain-HTML replica of the visible search behavior.

## How To Start Locally
Run one of these from the repo root:

```powershell
npm start
```

or double-click:

```text
Launch theUSAGE.cmd
```

Then open:

```text
http://127.0.0.1:8060/
```

The server honors the `PORT` environment variable and falls back to port `8060`.

## Next Recommended Action
Recover the original datastore export, templates, and `static/toolbook*.txt` corpus if available, then place the corpus under `static/` so the local scanner can populate real search results.
