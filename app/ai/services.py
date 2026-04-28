from pydantic import ValidationError

from app.ai.client import LLMClient
from app.ai.prompts import (
    REQUIREMENT_SYSTEM_PROMPT,
    SCENARIO_SYSTEM_PROMPT,
    TASK_BREAKDOWN_SYSTEM_PROMPT,
    build_requirement_prompt,
    build_scenario_prompt,
    build_task_breakdown_prompt,
)
from app.api.schemas.ai import (
    RequirementDraftRequest,
    RequirementDraftResponse,
    ScenarioDraft,
    ScenarioDraftRequest,
    ScenarioDraftResponse,
    TaskBreakdownDraftItem,
    TaskBreakdownDraftRequest,
    TaskBreakdownDraftResponse,
)


class AIDraftParsingError(Exception):
    """Raised when AI output cannot be validated."""


class AIDraftService:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def generate_requirement_draft(
        self, payload: RequirementDraftRequest
    ) -> RequirementDraftResponse:
        data = self.llm_client.generate_json(
            system_prompt=REQUIREMENT_SYSTEM_PROMPT,
            user_prompt=build_requirement_prompt(
                raw_input=payload.raw_input,
                business_context=payload.business_context,
                design_hints=payload.design_hints,
            ),
        )
        try:
            return RequirementDraftResponse(**_normalize_requirement_payload(data))
        except ValidationError as exc:
            raise AIDraftParsingError("Invalid requirement draft returned by LLM") from exc

    def generate_scenario_draft(self, payload: ScenarioDraftRequest) -> ScenarioDraftResponse:
        data = self.llm_client.generate_json(
            system_prompt=SCENARIO_SYSTEM_PROMPT,
            user_prompt=build_scenario_prompt(
                title=payload.title,
                summary=payload.summary,
                acceptance_criteria=payload.acceptance_criteria,
            ),
        )
        try:
            normalized = _normalize_scenario_payload(data)
            scenarios = [ScenarioDraft(**item) for item in normalized["scenarios"]]
            return ScenarioDraftResponse(
                feature_name=normalized["feature_name"],
                scenarios=scenarios,
            )
        except (KeyError, TypeError, ValidationError) as exc:
            raise AIDraftParsingError("Invalid scenario draft returned by LLM") from exc

    def generate_task_breakdown_draft(
        self, payload: TaskBreakdownDraftRequest
    ) -> TaskBreakdownDraftResponse:
        data = self.llm_client.generate_json(
            system_prompt=TASK_BREAKDOWN_SYSTEM_PROMPT,
            user_prompt=build_task_breakdown_prompt(
                title=payload.title,
                summary=payload.summary,
                acceptance_criteria=payload.acceptance_criteria,
                scenarios_text=payload.scenarios_text,
            ),
        )
        try:
            normalized = _normalize_task_payload(data)
            tasks = [TaskBreakdownDraftItem(**item) for item in normalized["tasks"]]
            return TaskBreakdownDraftResponse(tasks=tasks)
        except (TypeError, ValidationError) as exc:
            raise AIDraftParsingError("Invalid task breakdown draft returned by LLM") from exc


def _normalize_requirement_payload(data: dict) -> dict:
    normalized = dict(data)
    normalized["acceptance_criteria"] = _stringify_value(
        normalized.get("acceptance_criteria", "")
    )
    normalized["status"] = _stringify_value(normalized.get("status", "draft")) or "draft"
    return normalized


def _normalize_scenario_payload(data: dict) -> dict:
    feature_name = _first_present_string(data, ["feature_name", "feature", "name"])
    raw_scenarios = data.get("scenarios")
    if raw_scenarios is None:
        raw_scenarios = data.get("items", [])
    if not isinstance(raw_scenarios, list):
        raise TypeError("scenarios must be a list")

    scenarios = []
    for item in raw_scenarios:
        if not isinstance(item, dict):
            raise TypeError("scenario item must be an object")
        coverage = item.get("coverage")
        scenarios.append(
            {
                "scenario_title": _first_present_string(item, ["scenario_title", "title", "name"]),
                "given_text": _first_present_string(item, ["given_text", "given"]),
                "when_text": _first_present_string(item, ["when_text", "when"]),
                "then_text": _first_present_string(item, ["then_text", "then"]),
                "coverage_frontend": _coerce_bool(
                    item.get("coverage_frontend"),
                    fallback=_coverage_contains(coverage, "frontend"),
                ),
                "coverage_backend": _coerce_bool(
                    item.get("coverage_backend"),
                    fallback=_coverage_contains(coverage, "backend"),
                ),
                "coverage_app": _coerce_bool(
                    item.get("coverage_app"),
                    fallback=_coverage_contains(coverage, "app"),
                ),
                "status": _stringify_value(item.get("status", "draft")) or "draft",
            }
        )

    return {"feature_name": feature_name, "scenarios": scenarios}


def _normalize_task_payload(data: dict) -> dict:
    raw_tasks = data.get("tasks")
    if raw_tasks is None:
        raw_tasks = data.get("items", [])
    if not isinstance(raw_tasks, list):
        raise TypeError("tasks must be a list")

    tasks = []
    for item in raw_tasks:
        if not isinstance(item, dict):
            raise TypeError("task item must be an object")
        tasks.append(
            {
                "title": _first_present_string(item, ["title", "name"]),
                "description": _stringify_optional(item.get("description", item.get("details"))),
                "task_type": _normalize_task_type(item.get("task_type", item.get("type"))),
                "owner_name": _stringify_optional(item.get("owner_name", item.get("owner"))),
                "status": _stringify_value(item.get("status", "todo")) or "todo",
            }
        )

    return {"tasks": tasks}


def _first_present_string(data: dict, keys: list[str]) -> str:
    for key in keys:
        value = data.get(key)
        text = _stringify_value(value)
        if text:
            return text
    raise KeyError(f"Missing required keys: {', '.join(keys)}")


def _stringify_optional(value: object) -> str | None:
    text = _stringify_value(value)
    return text or None


def _stringify_value(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        parts = [_stringify_value(item) for item in value]
        parts = [part for part in parts if part]
        return "\n".join(f"- {part}" for part in parts)
    if isinstance(value, dict):
        parts = []
        for key, item in value.items():
            text = _stringify_value(item)
            if text:
                parts.append(f"{key}: {text}")
        return "\n".join(parts)
    return str(value).strip()


def _coerce_bool(value: object, *, fallback: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "yes", "1"}:
            return True
        if lowered in {"false", "no", "0"}:
            return False
    return fallback


def _coverage_contains(coverage: object, target: str) -> bool:
    if isinstance(coverage, list):
        return any(_stringify_value(item).lower() == target for item in coverage)
    if isinstance(coverage, str):
        return target in coverage.lower()
    return False


def _normalize_task_type(value: object) -> str:
    normalized = _stringify_value(value).lower()
    aliases = {
        "ios": "app",
        "android": "app",
        "mobile": "app",
        "client": "frontend",
        "test": "qa",
        "testing": "qa",
        "pm": "product",
    }
    if normalized in {"backend", "frontend", "app", "qa", "product"}:
        return normalized
    if normalized in aliases:
        return aliases[normalized]
    return normalized or "backend"
