# Traceflow

Open-source traceability for modern product delivery.

Traceflow helps small product teams turn raw ideas into structured requirements, BDD scenarios, delivery tasks, test evidence, and visible acceptance status in one lightweight workspace.

For a quick status handoff after session loss, see `docs/SESSION_RECOVERY.md`.

## Why Traceflow

Product delivery information is often scattered across chat, docs, issue trackers, pull requests, and test notes. Traceflow brings those pieces together so teams can keep requirement intent, implementation progress, and validation results connected.

## What It Supports

- Requirement management
- BDD scenario management
- Task breakdown and tracking
- Acceptance run recording
- GitHub link traceability
- Test summary tracking
- AI-assisted drafting for requirements, scenarios, and tasks

## Current Scope

The current MVP already supports:

- Requirement CRUD
- Scenario CRUD
- Task CRUD
- Acceptance run recording
- Requirement and task GitHub links
- Requirement test summaries
- AI requirement draft generation
- AI scenario draft generation
- AI task breakdown draft generation
- Minimal React UI for the full traceability flow

## Tech Stack

### Backend

- FastAPI
- SQLModel
- SQLite
- pytest
- OpenAI-compatible client abstraction

### Frontend

- React
- TypeScript
- Vite
- Vitest

## Prerequisites

- Python 3.11+
- Node.js 20+
- npm

## Environment Files

Backend:

- Copy [.env.example](E:\projects\openai_agents_demo\.env.example) to `.env`

Frontend:

- Copy [frontend/.env.example](E:\projects\openai_agents_demo\frontend\.env.example) to `frontend/.env`

Recommended backend values:

```env
APP_NAME=Traceflow
APP_ENV=development
APP_HOST=127.0.0.1
APP_PORT=8000
DATABASE_URL=sqlite:///./app.db
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://ai.hhhl.cc/v1
OPENAI_MODEL=gpt-5.4
OPENAI_TRUST_ENV=false
```

Proxy note:

- The backend OpenAI client defaults to `OPENAI_TRUST_ENV=false` so local `HTTP_PROXY` or `ALL_PROXY` settings do not break requests.
- If you explicitly need to route model traffic through environment proxy variables, set `OPENAI_TRUST_ENV=true`.
- If `ALL_PROXY` points to a SOCKS proxy, install `socksio` in the backend environment first.

Recommended frontend values:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Backend Setup

Create a virtual environment if needed:

```bash
python -m venv venv
```

Install backend dependencies:

```bash
.\venv\Scripts\python -m pip install -e .[dev]
```

Run backend tests:

```bash
.\venv\Scripts\python -m pytest
```

Start backend:

```bash
.\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

PowerShell helper:

```powershell
.\scripts\run_backend.ps1
```

The PowerShell helper starts a stable non-reload backend on `http://127.0.0.1:8000`, which avoids stale reload process issues seen on some Windows setups.

If `127.0.0.1:8000` is still occupied by stale Windows listeners from an older reload-based process tree, start a clean verification instance on another local port such as `8001`.

## Frontend Setup

Install frontend dependencies:

```bash
cd frontend
npm install
```

Run frontend tests:

```bash
npm test
```

Build frontend:

```bash
npm run build
```

Start frontend dev server:

```bash
npm run dev
```

This starts Vite on `http://127.0.0.1:5173`.

PowerShell helper:

```powershell
.\scripts\run_frontend.ps1
```

The PowerShell helper uses the local Vite binary directly so it reliably binds to `127.0.0.1:5173` on Windows.

## Local Run Order

1. Start backend on `http://127.0.0.1:8000`
2. Start frontend on `http://127.0.0.1:5173`
3. Open the frontend in a browser

## Main API Endpoints

### Requirements

- `GET /api/requirements`
- `POST /api/requirements`
- `GET /api/requirements/{id}`
- `GET /api/requirements/{id}/detail`
- `PATCH /api/requirements/{id}`

### Scenarios

- `GET /api/requirements/{id}/scenarios`
- `POST /api/requirements/{id}/scenarios`
- `GET /api/scenarios/{id}`
- `PATCH /api/scenarios/{id}`
- `DELETE /api/scenarios/{id}`

### Tasks

- `GET /api/requirements/{id}/tasks`
- `POST /api/requirements/{id}/tasks`
- `GET /api/tasks/{id}`
- `PATCH /api/tasks/{id}`
- `DELETE /api/tasks/{id}`

### Acceptance

- `GET /api/requirements/{id}/acceptance-runs`
- `POST /api/requirements/{id}/acceptance-runs`

### Traceability

- `GET /api/requirements/{id}/github-links`
- `POST /api/requirements/{id}/github-links`
- `GET /api/tasks/{id}/github-links`
- `POST /api/tasks/{id}/github-links`
- `DELETE /api/github-links/{id}`
- `GET /api/requirements/{id}/test-summaries`
- `POST /api/requirements/{id}/test-summaries`

### AI

- `POST /api/ai/requirement-draft`
- `POST /api/ai/scenario-draft`
- `POST /api/ai/task-breakdown-draft`

## Project Structure

```text
app/
  ai/
  api/
  core/
  domain/
docs/
frontend/
scripts/
tests/
```

## Current Validation Status

Backend:

- `.\venv\Scripts\python -m pytest`

Frontend:

- `npm test`
- `npm run build`
