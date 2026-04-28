# PRD

## 1. Product Overview

- Product name: TBD
- Product type: lightweight internal web tool
- Primary goal: close the traceability gap between requirements, scenarios, development tasks, and acceptance results for a small product team
- Secondary goal: use AI to turn raw business input into structured requirement cards, BDD scenarios, and task breakdown drafts

## 2. Background

The current team structure is:

- 1 backend engineer
- 1 frontend engineer
- 1 app engineer
- 1 tester
- 1 UI designer

Business input typically comes from:

- boss
- product manager
- tester
- UI designer

The current pain point is not lack of test execution. The core problem is that requirements, testing, design, and development are not linked in one visible workflow. This creates repeated clarification, inconsistent understanding, and costly back-and-forth.

## 3. Problem Statement

The team lacks a single lightweight system that can:

- store structured requirements
- convert requirements into BDD-style scenarios
- link scenarios to development tasks
- track acceptance state
- attach GitHub references
- attach test result summaries
- use AI to reduce manual drafting effort

Current work is likely scattered across chat, docs, spreadsheets, issue trackers, and test reports. That fragmentation is the main thing this product should remove.

## 4. Target Users

### 4.1 Tester

- structures raw business input
- creates or reviews scenarios
- drives acceptance
- tracks status across frontend, backend, and app

### 4.2 Developer

- views requirement context
- sees linked scenarios
- works on assigned tasks
- links PRs/commits/issues

### 4.3 UI Designer

- links design resources to requirements
- clarifies screen states and interactions

### 4.4 Boss / Product Input Owner

- provides raw business goals
- reviews progress and acceptance state

## 5. Product Goals

### 5.1 Business Goals

- reduce requirement clarification overhead
- make acceptance criteria visible before implementation
- create a shared language across test, design, and development
- make release readiness visible at requirement level

### 5.2 Product Goals

- requirement to scenario traceability
- scenario to task traceability
- task to GitHub traceability
- acceptance visibility in one place
- AI-assisted drafting for structured artifacts

## 6. Non-Goals

The MVP will not:

- replace GitHub as source control
- replace CI tools such as GitHub Actions or Jenkins
- replace Figma as design tool
- execute tests directly
- provide a full test management suite
- provide enterprise-grade RBAC, audit, SSO, or workflow engine
- implement multi-agent orchestration in v1

## 7. MVP Scope

### 7.1 In Scope

- requirement CRUD
- scenario CRUD
- task CRUD
- acceptance status tracking
- GitHub link association
- test result summary storage and display
- AI generation for:
  - requirement card draft
  - BDD scenario draft
  - task breakdown draft

### 7.2 Out of Scope for v1

- automatic GitHub sync
- automatic test run ingestion from CI
- role-based permissions beyond simple local admin/team use
- notifications
- comments and threaded discussions
- design asset management beyond links/notes

## 8. Core Objects

- Requirement
- Scenario
- Task
- Acceptance Run
- GitHub Link
- Test Summary
- AI Generation Record

## 9. Core User Flows

### 9.1 Requirement Creation

1. Tester or product input owner submits raw business input.
2. User optionally calls AI to draft a structured requirement card.
3. User edits and saves the requirement.

### 9.2 Scenario Creation

1. User opens a requirement.
2. User manually creates scenarios or uses AI to draft them.
3. User reviews and saves scenarios linked to the requirement.

### 9.3 Task Breakdown

1. User opens a requirement or scenario.
2. User uses AI or manual entry to create tasks.
3. Tasks are assigned to frontend, backend, app, or test.

### 9.4 Acceptance Tracking

1. Tester reviews requirement and scenarios.
2. Tester records acceptance result and notes.
3. Team can see current release readiness.

### 9.5 GitHub and Test Summary Linking

1. Developer adds GitHub references to tasks.
2. Tester or developer adds test summary.
3. Requirement page shows linked implementation and latest validation summary.

## 10. Functional Requirements

### 10.1 Requirement Management

- create, edit, archive requirements
- store title, summary, business value, acceptance criteria, design links, status
- view linked scenarios, tasks, acceptance runs, and GitHub links

### 10.2 Scenario Management

- create scenarios under a requirement
- support BDD-style fields:
  - feature
  - scenario title
  - given
  - when
  - then
- allow coverage tags:
  - frontend
  - backend
  - app

### 10.3 Task Management

- create tasks linked to requirement and optional scenario
- assign owner
- assign task type:
  - frontend
  - backend
  - app
  - test
- track status

### 10.4 Acceptance Tracking

- record acceptance result for a requirement
- support states:
  - pending
  - in_review
  - passed
  - failed
  - blocked
- support notes and timestamp

### 10.5 GitHub Links

- store GitHub issue, PR, commit, or discussion link
- link GitHub item to task and optionally requirement

### 10.6 Test Result Summary

- store manual test result summary
- support summary fields such as:
  - source
  - result
  - summary text
  - report URL
  - run timestamp

### 10.7 AI Assistance

- generate structured requirement card from raw input
- generate BDD scenarios from requirement content
- generate task breakdown from requirement and scenarios
- show generated draft before save

## 11. Non-Functional Requirements

- small-team friendly
- easy local development
- minimal ops overhead
- clear data model
- testable backend services
- AI vendor abstraction through a dedicated client layer

## 12. Success Metrics

- fewer ad hoc clarification loops per requirement
- faster transition from raw input to structured requirement
- all active requirements have linked scenarios
- all active requirements have visible acceptance state
- all active development tasks can be traced back to requirement/scenario

## 13. Release Criteria for MVP

- users can create and view requirements, scenarios, tasks, and acceptance runs
- requirement detail page shows full traceability chain
- GitHub links can be attached and displayed
- test result summaries can be attached and displayed
- AI drafting works through configured LLM client
- core backend services have automated tests
