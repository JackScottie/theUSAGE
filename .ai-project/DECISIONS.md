# Decisions

## 2026-10-24: Usage Maps modernization
- User authorized a modern branch focused on connecting object uses to complex goals through a constrained invention game.
- Build on `usage-maps`; preserve `main.py` and the old Node replica. Do not merge into `master` automatically.
- Use a dependency-free local Node server and buildless browser app, preserving Foundry port 8060.
- Separate AI proposals, authored hypotheses, structural checks, and self-reported observations.
- Make live AI optional and server-side; require explicit model configuration rather than hardcoding a potentially stale model.
- Use local browser persistence and portable round exports for this branch; no hosting or public sharing added.
- Lock the shared inventory after a head-to-head human submission to preserve comparable constraints.
- Structural validation cannot substitute for physics, semantic rule review, or quantity accounting; expose those limits in the interface.

## 2026-07-12: Repo Memory Is The Source Of Truth
Project state that should travel with the code lives in `.ai-project/`. The dashboard keeps only cache, layout, ordering, and integration state.

## 2026-07-12: Human Approval Gates Stay Visible
Agents can be useful without becoming reckless. Every project declares what an agent may observe, propose, modify, execute, and merge.
