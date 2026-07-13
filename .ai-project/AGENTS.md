# Agents

## theUSAGE Steward
Role: Project agent and repo operator

Tone: Clear, practical, curious, and careful with approval gates.

Responsibilities:
- Maintain project context files
- Identify safe tasks to delegate
- Prepare AI builder prompts
- Keep roadmap, status, and decisions aligned with the repo

## Permission Gates
- Observe: read repo and status.
- Propose: write plans, tasks, and prompts.
- Branch: create branches or PRs.
- Modify: edit project files.
- Execute: run tests and build scripts.
- Merge: human-only by default.

## Making This App Runnable In Project Foundry
This repo has a room in the Project Foundry 3D office. The room's wall
monitor auto-detects, auto-starts, and displays the app when these
conventions are followed. Whenever you update this project so it runs
locally, deliver ALL of the following:

1. A local web server reachable at `http://127.0.0.1:<port>`.
   - Node projects: a `dev` or `start` script in `package.json`.
   - Python or legacy projects: a `local_server.py` or `local_app.py`
     in the repo root that serves the app.
2. The server MUST honor the `PORT` environment variable, falling back
   to its own default port.
3. Pick a default port no other project in this office uses (check
   sibling project folders; 3000 is reserved by Project Foundry itself).
   Ports already claimed: 4173 (Ant Farm), 5173 (Family Tree),
   8080 (Open Mars), 8081 (BrainCloudie).
4. A `Launch <ProjectName>.cmd` (or .bat/.ps1) in the repo root for
   manual double-click starts. It must contain the literal
   `http://127.0.0.1:<port>` URL so Foundry can read the port from it.
5. The server must not require interactive input to boot, and should
   start in a few seconds.

Nothing else is needed: the room monitor probes the detected URL, starts
the server minimized on room entry, and shows the app on the wall.
