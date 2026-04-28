# Session Recovery

## Current Project Stage

This repository is beyond bootstrap stage and already implements the MVP core flow:

- Requirement CRUD
- Scenario CRUD
- Task CRUD
- Acceptance run recording
- GitHub link tracking
- Test summary tracking
- AI draft generation for requirements, scenarios, and task breakdowns
- Minimal React UI covering the full traceability workflow

The project is currently in a usable local-demo state with automated tests and a working frontend build.

## What Was Verified

On April 27, 2026, the following checks were run successfully in the local environment:

- Backend tests: `./venv/Scripts/python -m pytest`
- Frontend tests: `npm test`
- Frontend build: `npm run build`
- Backend health endpoint: `http://127.0.0.1:8000/api/health`
- Frontend dev server: `http://127.0.0.1:5173`

Observed backend health response:

```json
{"status":"ok","environment":"development","model":"gpt-5.4"}
```

## Important Local Run Notes

The Windows PowerShell environment in this workspace showed unreliable behavior when starting the frontend through a plain `npm run dev` path.

To make frontend startup stable on IPv4, the following were updated:

- `frontend/vite.config.ts`
- `frontend/package.json`
- `scripts/run_frontend.ps1`

The recommended frontend start command is now:

```powershell
.\scripts\run_frontend.ps1
```

This starts the frontend on:

- `http://127.0.0.1:5173`

Backend can be started with:

```powershell
.\scripts\run_backend.ps1
```

If port `8000` is unexpectedly occupied on Windows by stale listeners from an older reload-based process tree, verify the backend on another local port such as `8001` with a clean non-reload `uvicorn` start.

## Recommended Next Steps

If development resumes, the most likely next useful tasks are:

1. Run a manual smoke flow:
   - create requirement
   - add scenario
   - add task
   - record acceptance
2. Expand frontend interaction coverage beyond the current happy-path tests.
3. Add an end-to-end smoke path matching the plan in `docs/TASKS.md`.
4. Continue polish work around usability and release-readiness.

## Quick File Map

- Product scope: `docs/PRD.md`
- Delivery plan: `docs/TASKS.md`
- Technical design: `docs/TECH_DESIGN.md`
- Database reference: `docs/DB_SCHEMA.md`
- Backend entrypoint: `app/main.py`
- Frontend app: `frontend/src/App.tsx`
- Frontend startup helper: `scripts/run_frontend.ps1`
- Backend startup helper: `scripts/run_backend.ps1`
