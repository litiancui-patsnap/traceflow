# Tasks

## 1. Delivery Strategy

Build the product in vertical slices, starting from the smallest traceability flow:

`Requirement -> Scenario -> Task -> Acceptance`

After that:

`GitHub Link -> Test Summary -> AI Drafting`

## 2. Phase 0 - Project Bootstrap

### T-001 Initialize backend project

- Create FastAPI app skeleton
- Add config loading
- Add database setup
- Add health endpoint

Acceptance:

- app starts locally
- health endpoint returns 200

### T-002 Initialize frontend project

- Create Vite + React + TypeScript app
- Add routing
- Add basic layout shell

Acceptance:

- frontend starts locally
- layout shell renders

## 3. Phase 1 - Requirement Core

### T-003 Implement requirement model and migration

- Add requirement database table
- Add SQLModel entity

Acceptance:

- table can be created locally
- unit tests cover create/read/update behavior

### T-004 Implement requirement CRUD API

- list requirements
- create requirement
- get detail
- update requirement

Acceptance:

- API tests pass for CRUD flows

### T-005 Build requirement list and detail pages

- render list page
- render detail page
- support create/edit form

Acceptance:

- user can create and view requirement in UI

## 4. Phase 2 - Scenario Core

### T-006 Implement scenario model and migration

Acceptance:

- scenario table exists
- linked to requirement

### T-007 Implement scenario CRUD API

Acceptance:

- create, edit, delete scenario under requirement

### T-008 Build scenario editor in requirement detail

Acceptance:

- user can add and update scenarios from requirement page

## 5. Phase 3 - Task Core

### T-009 Implement task model and migration

Acceptance:

- task table exists
- linked to requirement
- optional link to scenario

### T-010 Implement task CRUD API

Acceptance:

- create, edit, delete tasks

### T-011 Build task list/board UI

Acceptance:

- tasks visible by status and type

## 6. Phase 4 - Acceptance Tracking

### T-012 Implement acceptance run model and API

Acceptance:

- tester can record acceptance status and notes

### T-013 Show latest acceptance state on requirement pages

Acceptance:

- requirement list and detail expose current acceptance state

## 7. Phase 5 - Traceability Additions

### T-014 Implement GitHub link model and API

Acceptance:

- user can attach GitHub links to tasks or requirement

### T-015 Implement test summary model and API

Acceptance:

- user can attach test result summaries to requirement

### T-016 Extend requirement detail view with traceability section

Acceptance:

- user can see scenarios, tasks, GitHub links, test summaries, acceptance history in one page

## 8. Phase 6 - AI Drafting

### T-017 Implement LLM client abstraction

- Read env config
- Call configured OpenAI-compatible endpoint
- Provide a small typed response interface

Acceptance:

- mock-based tests cover client behavior
- real endpoint can be smoke-tested manually

### T-018 Implement requirement card draft generation

Acceptance:

- raw business text returns structured draft

### T-019 Implement BDD scenario draft generation

Acceptance:

- requirement content returns one or more scenario drafts

### T-020 Implement task breakdown draft generation

Acceptance:

- requirement + scenarios return task suggestions grouped by owner type

### T-021 Build AI draft review UI

Acceptance:

- user can preview generated draft before save

## 9. Phase 7 - Quality and Polish

### T-022 Add backend service tests

Acceptance:

- core domain services covered by pytest

### T-023 Add frontend interaction tests

Acceptance:

- key create/edit flows covered

### T-024 Add end-to-end smoke path

Acceptance:

- one full path passes:
  - create requirement
  - add scenario
  - add task
  - record acceptance

### T-025 Build dashboard summary page

- add dashboard route or top-level panel
- render summary cards
- render requirement summary table
- support click-through to requirement detail

Acceptance:

- user can open one page and identify blocked, accepted, and underdefined requirements quickly
- user can drill into any requirement from the summary page

Suggested implementation breakdown:

### T-025A Add dashboard summary view shell

- add dashboard route or top-level panel entry
- create read-only summary page layout
- keep current requirement detail workbench intact

Acceptance:

- user can open a dedicated dashboard summary view from the main UI
- dashboard layout renders without breaking the existing requirement workflow

### T-025B Build frontend summary cards and requirement table

- render top summary cards
- render requirement summary table
- show requirement status, scenario count, task count, latest acceptance, and last updated time

Acceptance:

- user can scan requirement-level summary information from one page
- each requirement row exposes the core progress signals without opening detail first

### T-025C Add dashboard drill-down and lightweight filters

- support click-through from summary row to requirement detail
- add lightweight filters for status, acceptance, and missing traceability
- support clearing filters in one action

Acceptance:

- user can narrow the dashboard to blocked, accepted, or underdefined requirements quickly
- user can jump from the dashboard into the existing requirement detail flow

### T-025D Add derived health and attention-needed sections

- add dedicated `GET /api/dashboard/summary`
- move summary aggregation and derived state logic into backend service layer
- return aggregate counts and requirement summary rows from one backend endpoint

Acceptance:

- frontend can render dashboard data from one summary endpoint
- derived dashboard counts are computed consistently in backend
- API tests cover summary aggregation and edge cases for missing traceability

### T-025E Add derived health, executive summary, and attention-needed sections

- derive dashboard-facing health and risk signals such as missing scenarios, missing tasks, accepted, and at-risk work
- render leadership-oriented summary copy, metric guidance, attention-needed items, and recommended actions
- keep dashboard readable for business, delivery, and release stakeholders without opening each requirement first

Acceptance:

- user can identify the highest-risk requirements without inspecting every row manually
- business and leadership roles can understand what the top metrics mean and what action is needed next
- dashboard highlights accepted scope, definition gaps, and blocked work clearly

## 10. TDD Priorities

The following modules should be built test-first:

- requirement service
- scenario service
- task service
- acceptance state transitions
- GitHub link validation
- AI output parsing

## 11. Deferred Items

- authentication
- user directory
- automatic GitHub sync
- automatic CI ingestion
- comments
- notifications
- analytics dashboard
- openai_agents integration
