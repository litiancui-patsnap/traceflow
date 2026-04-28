# Technical Design

## 1. Architecture Summary

This system is a small internal web application with:

- Python backend
- web frontend
- SQLite database in v1
- AI integration through an LLM abstraction layer

The product should follow spec-driven development and keep AI integration isolated from business rules.

## 2. Recommended Stack

### Backend

- FastAPI
- Pydantic
- SQLModel
- Uvicorn

### Frontend

- React
- TypeScript
- Vite
- Ant Design

### Database

- SQLite for v1
- later migration path to PostgreSQL

### Testing

- pytest for backend
- vitest + React Testing Library for frontend
- Playwright for end-to-end smoke flows later

### AI

- openai Python SDK in v1
- custom `llm_client` abstraction
- base URL and model configured from environment

## 3. Environment Configuration

Required environment variables:

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

Planned defaults for local configuration:

- `OPENAI_BASE_URL=https://ai.hhhl.cc/v1`
- `OPENAI_MODEL=gpt-5.4`

## 4. High-Level Components

### 4.1 Frontend

Responsibilities:

- render requirement, scenario, task, and acceptance pages
- submit CRUD operations to backend API
- invoke AI draft generation requests
- display traceability

### 4.2 Backend API

Responsibilities:

- expose REST API
- validate requests
- coordinate services
- enforce state rules
- persist data

### 4.3 Domain Services

Responsibilities:

- requirement lifecycle rules
- scenario lifecycle rules
- task lifecycle rules
- acceptance state rules
- link aggregation and traceability view composition

### 4.4 Repository Layer

Responsibilities:

- CRUD database access
- query linked entities efficiently

### 4.5 AI Layer

Responsibilities:

- shield business logic from LLM vendor specifics
- build prompts
- call configured LLM endpoint
- return structured draft payloads

## 5. Core Design Principles

- keep business logic out of controllers
- isolate persistence in repositories
- isolate LLM calls in `llm_client`
- make AI outputs drafts, not auto-committed records
- keep acceptance status explicit and auditable
- prefer manual linking over fragile automation in v1

## 6. Proposed Project Structure

```text
app/
  api/
    routes/
    schemas/
    deps/
  core/
    config.py
    database.py
  domain/
    models/
    services/
    repositories/
  ai/
    client.py
    prompts.py
    services.py
  main.py

frontend/
  src/
    pages/
    components/
    api/
    features/

tests/
  unit/
  integration/

docs/
```

## 7. API Design

### 7.1 Requirements

- `GET /api/requirements`
- `POST /api/requirements`
- `GET /api/requirements/{id}`
- `PATCH /api/requirements/{id}`

### 7.2 Scenarios

- `POST /api/requirements/{id}/scenarios`
- `PATCH /api/scenarios/{id}`
- `DELETE /api/scenarios/{id}`

### 7.3 Tasks

- `POST /api/requirements/{id}/tasks`
- `PATCH /api/tasks/{id}`
- `DELETE /api/tasks/{id}`

### 7.4 Acceptance Runs

- `POST /api/requirements/{id}/acceptance-runs`
- `GET /api/requirements/{id}/acceptance-runs`

### 7.5 GitHub Links

- `POST /api/tasks/{id}/github-links`
- `DELETE /api/github-links/{id}`

### 7.6 Test Summaries

- `POST /api/requirements/{id}/test-summaries`
- `GET /api/requirements/{id}/test-summaries`

### 7.7 AI Drafts

- `POST /api/ai/requirement-draft`
- `POST /api/ai/scenario-draft`
- `POST /api/ai/task-breakdown-draft`

## 8. UI Pages

### 8.1 Requirement List

- shows all requirements
- supports status filtering

### 8.2 Requirement Detail

- requirement information
- design links
- linked scenarios
- linked tasks
- acceptance history
- GitHub links
- test summaries

### 8.3 Scenario Editor

- create and edit BDD scenario fields

### 8.4 Task Board / Task List

- list by owner, type, and status

### 8.5 AI Draft Modal

- shows generated draft
- supports copy, edit, and save

## 9. State Rules

### Requirement Status

Proposed states:

- draft
- ready
- in_progress
- in_acceptance
- done
- blocked

### Task Status

- todo
- in_progress
- review
- done
- blocked

### Acceptance Status

- pending
- in_review
- passed
- failed
- blocked

## 10. AI Workflow Design

### 10.1 Requirement Draft

Input:

- raw business input
- optional business context
- optional design hints

Output:

- title
- summary
- business value
- acceptance criteria draft

### 10.2 Scenario Draft

Input:

- requirement content

Output:

- feature name
- one or more scenarios
- given/when/then draft blocks

### 10.3 Task Breakdown Draft

Input:

- requirement content
- scenarios

Output:

- backend tasks
- frontend tasks
- app tasks
- test tasks

## 11. Security and Data Handling

For v1:

- internal deployment only
- no multi-tenant support
- no fine-grained RBAC
- AI requests may contain internal requirement text, so the configured proxy must be approved by the team

## 12. Risks

- third-party OpenAI-compatible proxy may not fully match expected API behavior
- AI output quality may vary and must remain draft-only
- scope creep into full project management platform
- over-automation too early can create fragile workflows

## 13. Migration and Evolution Path

Potential future additions:

- GitHub webhook sync
- CI result ingestion
- notifications
- richer analytics
- switch from SDK-based draft generation to `openai_agents` if workflow complexity grows and endpoint compatibility is verified
