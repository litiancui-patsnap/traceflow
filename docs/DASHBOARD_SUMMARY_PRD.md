# Dashboard / Summary Page PRD

## 1. Purpose

This page is intended for non-technical or low-frequency users such as:

- boss
- product input owner
- tester acting as release coordinator
- project lead

The goal is to let them understand delivery status without opening individual requirement detail pages one by one.

## 2. Problem to Solve

The current Traceflow UI is effective as a working console for editing requirements, scenarios, tasks, and acceptance records.

However, it is still too operational for leadership or business-facing review because it requires users to:

- open requirements one at a time
- understand implementation-oriented fields
- infer overall progress manually

The Dashboard / Summary page should provide an at-a-glance view of:

- how many active requirements exist
- which requirements are blocked or failing acceptance
- which items are ready for release
- where work is missing traceability

## 3. Primary Users

### 3.1 Boss / Business Owner

Needs to know:

- what is in progress
- what is at risk
- what is already accepted
- what still lacks clarity or implementation evidence

### 3.2 Product / Tester Coordinator

Needs to know:

- which requirements still lack scenarios
- which requirements still lack tasks
- which requirements have no recent acceptance result
- which items need follow-up before release review

## 4. Goals

### 4.1 Business Goals

- reduce the cost of progress reporting
- make release readiness visible at requirement level
- expose missing traceability early
- give business users a clearer summary than the current workbench layout

### 4.2 Product Goals

- show requirement-level health in one screen
- surface the latest acceptance state clearly
- highlight missing scenarios, tasks, or test evidence
- allow quick drill-down into requirement detail

## 5. Non-Goals

The first version of this page should not:

- replace the current requirement detail workbench
- provide advanced analytics or forecasting
- replace a BI dashboard
- include role-based visibility rules beyond the current local-use model

## 6. Key Questions the Page Must Answer

The page should make it easy to answer:

- How many active requirements exist right now?
- How many are draft, ready, in progress, blocked, or accepted?
- Which requirements are currently blocked?
- Which requirements have no scenario coverage yet?
- Which requirements have no tasks yet?
- Which requirements have no acceptance result yet?
- Which requirements failed or were blocked in the latest acceptance run?
- Which requirements are closest to release readiness?

## 7. Information Architecture

The first version should include four sections.

### 7.1 Top Summary Cards

Show high-level counts such as:

- total requirements
- draft requirements
- ready requirements
- requirements with latest acceptance `passed`
- requirements with latest acceptance `failed` or `blocked`
- requirements missing scenarios
- requirements missing tasks

### 7.2 Release Readiness Summary

Show grouped counts or compact rows for:

- ready for acceptance
- waiting on development
- waiting on test
- blocked
- accepted

This section should use simple business language instead of low-level technical wording.

### 7.3 Attention Needed List

Show requirements that need action soon.

Examples:

- no scenarios linked
- no tasks linked
- latest acceptance failed
- latest acceptance blocked
- no test summary
- no GitHub implementation link

This list should be sorted by urgency.

### 7.4 Requirement Summary Table

Show one row per requirement with the most important summary fields.

Recommended columns:

- title
- status
- scenario count
- task count
- latest acceptance status
- latest test summary result
- last updated time
- quick action: open detail

## 8. Requirement Row Health Rules

Each requirement row should have a derived health state.

Suggested logic:

- `At Risk`
  - latest acceptance is `failed` or `blocked`
  - or no tasks exist after scenarios are already defined
- `Needs Definition`
  - no scenarios exist
- `In Progress`
  - scenarios exist and tasks exist, but no passing acceptance yet
- `Ready for Review`
  - tasks exist and latest acceptance is `in_review` or pending final validation
- `Accepted`
  - latest acceptance is `passed`

This is a UI-level summary state and does not need to replace the underlying domain statuses.

## 9. Filters and Interactions

The first version should support lightweight filters.

Recommended filters:

- requirement status
- latest acceptance status
- health state
- has scenarios / no scenarios
- has tasks / no tasks

Recommended interactions:

- click a summary card to filter the table
- click a requirement row to open the existing detail view
- clear filters in one action

## 10. Data Needed from Backend

The page can be built either from:

### Option A: Frontend aggregation from existing APIs

Use current APIs and aggregate client-side.

Pros:

- faster to prototype
- no new backend endpoint required initially

Cons:

- less efficient
- more summary logic duplicated in frontend

### Option B: Dedicated dashboard summary endpoint

Recommended long-term endpoint example:

- `GET /api/dashboard/summary`

Suggested response payload:

- aggregate counts
- requirement summary rows
- attention-needed rows

Pros:

- simpler frontend
- consistent derived health logic
- easier to expand later

Cons:

- requires new backend service and schema

## 11. Suggested MVP Delivery Plan

### Phase A - Fast UI Value

- build a read-only dashboard route/page
- compute summary cards in frontend from existing data
- render requirement summary table
- support click-through into requirement detail

### Phase B - Better Summary Quality

- add derived health rules
- add attention-needed section
- add lightweight filters

### Phase C - Backend Summary API

- move aggregation into backend
- standardize derived states and counts
- improve performance and consistency

## 12. Acceptance Criteria

The Dashboard / Summary page is acceptable when:

- a boss or business user can identify blocked requirements within seconds
- a tester or product lead can see which requirements are missing scenarios or tasks
- a user can understand high-level release readiness without opening every detail page
- every summary row can drill into the existing requirement detail view
- the page remains readable for a small-team dataset without requiring advanced training

## 13. Out-of-Scope Future Enhancements

Possible future additions:

- trend charts across weeks or releases
- owner-level workload summary
- release milestone grouping
- auto-ingested CI/test signals
- GitHub sync status summary
- design link coverage summary

## 14. Recommended Next Implementation Ticket

Suggested next delivery slice:

### T-025 Build dashboard summary page

Scope:

- add dashboard route or top-level panel
- render summary cards
- render requirement summary table
- support click-through to requirement detail

Acceptance:

- user can open one page and identify blocked, accepted, and underdefined requirements quickly
- user can drill into any requirement from the summary page
