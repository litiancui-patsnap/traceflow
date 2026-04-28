REQUIREMENT_SYSTEM_PROMPT = """
You convert raw product input into a structured requirement draft.
Return valid JSON only.
Do not wrap JSON in markdown.
If a field can contain multiple items, still return a single string with newline-separated bullets.
The source input may be Chinese or English. Understand both and respond in the same language as the user input.
""".strip()

SCENARIO_SYSTEM_PROMPT = """
You convert a requirement into BDD-style scenarios.
Return valid JSON only.
Do not wrap JSON in markdown.
Use the exact field names requested.
The source input may be Chinese or English. Understand both and respond in the same language as the user input.
The source input may be Chinese or English. Understand both and respond in the same language as the user input.
""".strip()

TASK_BREAKDOWN_SYSTEM_PROMPT = """
You convert a requirement and its scenarios into implementation task breakdown drafts.
Return valid JSON only.
Do not wrap JSON in markdown.
Use the exact field names requested.
""".strip()


def build_requirement_prompt(
    *,
    raw_input: str,
    business_context: str | None = None,
    design_hints: str | None = None,
) -> str:
    return f"""
Create a requirement draft from the following input.

Raw input:
{raw_input}

Business context:
{business_context or "N/A"}

Design hints:
{design_hints or "N/A"}

Return JSON with:
- title: string
- summary: string
- business_value: string
- acceptance_criteria: string
- status: string, use "draft"
""".strip()


def build_scenario_prompt(
    *,
    title: str,
    summary: str | None = None,
    acceptance_criteria: str | None = None,
) -> str:
    return f"""
Create BDD scenarios for the following requirement.

Title:
{title}

Summary:
{summary or "N/A"}

Acceptance criteria:
{acceptance_criteria or "N/A"}

Return JSON with:
- feature_name: string
- scenarios: array of objects, each containing
  - scenario_title: string
  - given_text: string
  - when_text: string
  - then_text: string
  - coverage_frontend: boolean
  - coverage_backend: boolean
  - coverage_app: boolean
  - status: string, use "draft"
""".strip()


def build_task_breakdown_prompt(
    *,
    title: str,
    summary: str | None = None,
    acceptance_criteria: str | None = None,
    scenarios_text: str | None = None,
) -> str:
    return f"""
Create implementation task breakdown drafts for the following requirement.

Title:
{title}

Summary:
{summary or "N/A"}

Acceptance criteria:
{acceptance_criteria or "N/A"}

Scenarios:
{scenarios_text or "N/A"}

Return JSON with:
- tasks: array of objects, each containing
  - title: string
  - description: string
  - task_type: string, one of "backend", "frontend", "app", "qa", "product"
  - owner_name: string
  - status: string, use "todo"
""".strip()
