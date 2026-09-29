---
name: start-dev
description: Start (or restart / stop / check) the insclix-wizard dev server — the SvelteKit + Vite app with the 10 wizard concepts on http://localhost:5180. Use when the user says "start dev", "start the app", "is the wizard up", or before Pinta / Playwright work.
metadata:
  author: local
  version: "1.0.0"
---

# insclix-wizard start-dev

One script owns health checks and start/restart decisions:

```bash
bash .claude/skills/start-dev/start-dev.sh            # start if down, wait until http://localhost:5180 answers 200
bash .claude/skills/start-dev/start-dev.sh --status   # just report
bash .claude/skills/start-dev/start-dev.sh --restart  # kill (only if it is our vite) and start again
bash .claude/skills/start-dev/start-dev.sh --stop
```

- Frontend only — there is no backend; all data is in `src/lib/wizard/products.ts`.
- Port **5180** stays clear of the machine-wide table (5173 claims-forms Vite, 8083 BCP/claims,
  8084 AWP, 9876 GWT codeserver). The script refuses to kill a process on 5180 that isn't vite.
- No login. Entry points: `/` (gallery, Settings FAB bottom-right) and `/concept/<slug>`.
- Logs: `.claude/skills/start-dev/dev.log`.
- QA helpers: `node scripts/e2e.mjs [slug]` (walks every concept × product to "Contract created"),
  `MSYS_NO_PATHCONV=1 node scripts/shot.mjs <path> <w> <h> <out.png> [steps] [theme] [preClick]`.
