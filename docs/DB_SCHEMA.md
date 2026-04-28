# Database Schema

## 1. Overview

The MVP data model focuses on traceability:

- requirement
- scenario
- task
- acceptance run
- GitHub link
- test summary
- AI generation record

## 2. Tables

### 2.1 requirements

Purpose:

- store the main requirement record

Fields:

- `id` UUID / integer primary key
- `title` string, required
- `raw_input` text, nullable
- `summary` text, nullable
- `business_value` text, nullable
- `acceptance_criteria` text, nullable
- `design_links_json` text/json, nullable
- `status` string, required
- `created_at` datetime
- `updated_at` datetime

### 2.2 scenarios

Purpose:

- store BDD-style scenarios under a requirement

Fields:

- `id` primary key
- `requirement_id` foreign key -> requirements.id
- `feature_name` string, required
- `scenario_title` string, required
- `given_text` text, nullable
- `when_text` text, nullable
- `then_text` text, nullable
- `coverage_frontend` boolean, default false
- `coverage_backend` boolean, default false
- `coverage_app` boolean, default false
- `status` string, required
- `created_at` datetime
- `updated_at` datetime

### 2.3 tasks

Purpose:

- store implementation or test tasks

Fields:

- `id` primary key
- `requirement_id` foreign key -> requirements.id
- `scenario_id` foreign key -> scenarios.id, nullable
- `title` string, required
- `description` text, nullable
- `task_type` string, required
- `owner_name` string, nullable
- `status` string, required
- `created_at` datetime
- `updated_at` datetime

`task_type` values:

- frontend
- backend
- app
- test

### 2.4 acceptance_runs

Purpose:

- record acceptance outcomes for a requirement

Fields:

- `id` primary key
- `requirement_id` foreign key -> requirements.id
- `status` string, required
- `notes` text, nullable
- `recorded_by` string, nullable
- `created_at` datetime

### 2.5 github_links

Purpose:

- link GitHub resources to tasks or requirements

Fields:

- `id` primary key
- `requirement_id` foreign key -> requirements.id, nullable
- `task_id` foreign key -> tasks.id, nullable
- `link_type` string, required
- `url` string, required
- `label` string, nullable
- `created_at` datetime

`link_type` values:

- issue
- pr
- commit
- discussion

### 2.6 test_summaries

Purpose:

- store lightweight validation summary data

Fields:

- `id` primary key
- `requirement_id` foreign key -> requirements.id
- `source` string, required
- `result` string, required
- `summary` text, nullable
- `report_url` string, nullable
- `run_at` datetime, nullable
- `created_at` datetime

`result` values:

- passed
- failed
- partial
- blocked

### 2.7 ai_generation_records

Purpose:

- store audit trail of generated drafts

Fields:

- `id` primary key
- `generation_type` string, required
- `input_text` text, required
- `output_text` text, required
- `model_name` string, nullable
- `status` string, required
- `created_at` datetime

`generation_type` values:

- requirement_card
- scenario_draft
- task_breakdown

## 3. Relationships

- one requirement has many scenarios
- one requirement has many tasks
- one scenario may have many tasks
- one requirement has many acceptance runs
- one requirement has many test summaries
- one requirement or task has many GitHub links

## 4. Constraints

- task must belong to a requirement
- scenario must belong to a requirement
- acceptance run must belong to a requirement
- test summary must belong to a requirement
- GitHub link must reference at least one of requirement or task

## 5. Indexing Recommendations

- requirements.status
- scenarios.requirement_id
- tasks.requirement_id
- tasks.scenario_id
- acceptance_runs.requirement_id
- github_links.task_id
- github_links.requirement_id
- test_summaries.requirement_id

## 6. Notes for v1

- use simple enums in application layer first
- avoid premature normalization for owners, teams, tags
- keep design links in JSON/text for v1 unless usage grows
