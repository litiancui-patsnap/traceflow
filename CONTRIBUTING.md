# Contributing to Traceflow

Thanks for contributing to Traceflow.

This project is a lightweight workspace for requirements, scenarios, tasks, acceptance tracking, and AI-assisted delivery planning. Contributions should stay focused, practical, and easy to validate locally.

## Before You Start

- Read `README.md` for setup and local run commands.
- Read `docs/SESSION_RECOVERY.md` for the latest known local runtime notes.
- Prefer small, focused pull requests.
- Avoid mixing refactors with feature work unless they are necessary for the change.

## Local Setup

### Backend

```powershell
python -m venv venv
.\venv\Scripts\python -m pip install -e .[dev]
```

### Frontend

```powershell
cd frontend
npm install
```

## Environment Files

- Copy `.env.example` to `.env`
- Copy `frontend/.env.example` to `frontend/.env`

Do not commit local secrets or populated `.env` files.

## Running the Project

### Recommended Windows startup

Backend:

```powershell
.\scripts\run_backend.ps1
```

Frontend:

```powershell
.\scripts\run_frontend.ps1
```

These helpers are the preferred local entrypoints for this repository on Windows.

## Tests

Run the relevant checks before opening a pull request.

Backend:

```powershell
.\venv\Scripts\python -m pytest
```

Frontend tests:

```powershell
cd frontend
npm test
```

Frontend build:

```powershell
cd frontend
npm run build
```

If your change only affects one area, start with the narrowest relevant validation and then run broader checks when appropriate.

## Contribution Guidelines

- Keep changes aligned with the existing project structure.
- Update docs when behavior, setup, or workflow changes.
- Add or update tests when modifying user-visible behavior or core business logic.
- Do not commit temporary files, local databases, virtual environments, or secrets.

## Pull Requests

When opening a pull request:

- explain what changed
- explain why it changed
- list how you validated it
- call out known limitations or follow-up work

Use the pull request template in `.github/pull_request_template.md`.
