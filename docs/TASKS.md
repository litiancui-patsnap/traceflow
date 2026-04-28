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
