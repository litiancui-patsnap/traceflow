# Localization and Encoding Rules

## 1. Purpose

This document defines the rules for localizing this project into Chinese without introducing encoding corruption, broken UI text, or unstable tests.

The primary goal is not only to translate visible copy, but also to preserve source-file integrity and keep the application behavior unchanged.

## 2. Non-Negotiable Encoding Rules

- All source files must use UTF-8.
- Prefer UTF-8 without BOM for frontend and backend source files.
- Never rely on shell-default encodings when rewriting files on Windows.
- Never perform bulk full-file rewrites unless the encoding is explicitly controlled.
- If a file is suspected to contain corrupted characters, repair encoding first before continuing localization.

Applies to:

- frontend/src/**/*.ts
- frontend/src/**/*.tsx
- frontend/src/**/*.css
- app/**/*.py
- tests/**/*.py
- docs/**/*.md

## 3. Localization Scope

The first localization pass should only translate user-visible copy.

Translate:

- page titles
- button labels
- section headings
- helper text
- empty, loading, and error states
- dashboard copy
- table column labels
- display labels for statuses and health states

Do not translate yet:

- API routes
- request and response field names
- TypeScript identifiers
- Python identifiers
- database values
- internal enum values used by business logic

## 4. Data and Display Separation

Underlying stored values must remain unchanged.

Examples:

- draft
- ready
- in_progress
- blocked
- passed
- failed

These values should continue to be used in:

- backend logic
- API payloads
- filters and internal state
- tests that validate behavior rather than display language

Chinese should be introduced through display mappings only.

## 5. Required Localization Structure

Do not scatter Chinese strings directly across many components.

Before translating the UI, add a centralized copy layer such as:

- frontend/src/copy.ts
- or frontend/src/i18n/zh-CN.ts

This layer should hold:

- page copy
- button text
- status display maps
- health display maps
- dashboard labels

Benefits:

- consistent terminology
- lower risk of mixed translations
- easier review and future bilingual support

## 6. Terminology Rules

Define a stable glossary before changing UI copy.

At the rule-definition stage, do not store Chinese glossary entries in this file unless you have already verified a safe UTF-8 editing path in the current environment.

For now, define and review the source-term list first:

- Dashboard
- Workspace
- Delivery Summary
- Executive Summary
- Metric Guide
- Attention Needed
- Recommended Actions
- Accepted Scope Snapshot
- Draft
- Ready
- In Progress
- Blocked
- Done
- Accepted
- At Risk
- Needs Definition
- Ready for Review
- Missing Scenarios
- Missing Tasks

After the editing path is proven safe, create a dedicated glossary file and add approved Chinese translations there.

Once selected, the same translation must be used everywhere.

## 7. Safe Editing Rules

- Prefer patch-style edits over whole-file rewrite operations.
- Change a small number of files at a time.
- Keep translation changes separate from business-logic changes.
- If a file contains both logic work and localization work, finish logic stabilization first.
- After each localization batch, review the exact rendered text in tests or UI validation.

## 8. Windows Safety Rules

This project is often edited in a Windows PowerShell environment, which increases encoding risk.

Extra precautions:

- do not use shell-default redirection to rewrite source files
- do not assume PowerShell output encoding matches file encoding
- avoid mass search-and-replace commands across the whole repo
- explicitly preserve UTF-8 when any scripted rewrite is unavoidable

## 9. Character and Punctuation Rules

Use stable characters consistently.

- define special UI symbols only after a verified UTF-8-safe editing path exists
- avoid accidental replacement with visually broken characters
- pick one standard for colon usage and stay consistent
- pick one standard for ellipsis usage and stay consistent

Never allow these into committed source:

- Unicode replacement character
- accidental mojibake fragments
- mixed punctuation styles that make UI inconsistent

## 10. Test Strategy for Localization

Localization can break tests even when product behavior is correct.

Rules:

- prefer testing stable labels and roles instead of long paragraphs
- reduce assertions on full explanatory sentences when those sentences are likely to change during localization
- add tests for translated labels only after terminology is finalized
- keep behavior tests independent from language where possible

Recommended validation after each localization batch:

- frontend App tests
- dashboard-related frontend tests
- any backend tests affected by display-layer assumptions

## 11. Implementation Order

Recommended rollout order:

1. define glossary
2. add centralized copy layer
3. localize dashboard page first
4. localize workspace shell and shared actions
5. localize detail forms and helper text
6. update tests to align with translated UI labels
7. add lightweight corrupted-character scanning if needed

## 12. Definition of Done for Localization Batches

A localization batch is acceptable only when:

- all edited files remain valid UTF-8
- no corrupted characters appear in source files
- visible UI copy is translated consistently
- internal logic and API values remain unchanged
- frontend tests still pass
- no new unstable text assertions are introduced unnecessarily

## 13. Prohibited Changes During Initial Localization

Do not combine initial localization with:

- API contract redesign
- database value migration
- status enum renaming
- business rule changes
- large refactors unrelated to copy extraction or display mapping

## 14. Recommended Next Step

Before modifying application code, create a minimal centralized copy module and a glossary-backed status and health display mapping.

Only after that should the first UI slice be translated.
