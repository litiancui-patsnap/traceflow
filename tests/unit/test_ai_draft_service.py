import pytest

from app.ai.services import AIDraftParsingError, AIDraftService
from app.api.schemas.ai import (
    RequirementDraftRequest,
    ScenarioDraftRequest,
    TaskBreakdownDraftRequest,
)


class StubLLMClient:
    def __init__(self, payload):
        self.payload = payload

    def generate_json(self, *, system_prompt: str, user_prompt: str):
        return self.payload


def test_generate_requirement_draft_returns_valid_response() -> None:
    service = AIDraftService(
        StubLLMClient(
            {
                "title": "Login requirement",
                "summary": "Support a standard login flow",
                "business_value": "Reduce support tickets",
                "acceptance_criteria": "User can log in with valid credentials",
                "status": "draft",
            }
        )
    )

    result = service.generate_requirement_draft(
        RequirementDraftRequest(raw_input="Need a login page")
    )

    assert result.title == "Login requirement"
    assert result.business_value == "Reduce support tickets"


def test_generate_requirement_draft_normalizes_acceptance_criteria_list() -> None:
    service = AIDraftService(
        StubLLMClient(
            {
                "title": "Login requirement",
                "summary": "Support a standard login flow",
                "business_value": "Reduce support tickets",
                "acceptance_criteria": [
                    "User enters valid credentials",
                    "System redirects to dashboard",
                ],
            }
        )
    )

    result = service.generate_requirement_draft(
        RequirementDraftRequest(raw_input="Need a login page")
    )

    assert result.acceptance_criteria == (
        "- User enters valid credentials\n- System redirects to dashboard"
    )


def test_generate_scenario_draft_returns_scenarios() -> None:
    service = AIDraftService(
        StubLLMClient(
            {
                "feature_name": "Login feature",
                "scenarios": [
                    {
                        "scenario_title": "User logs in successfully",
                        "given_text": "User is on login page",
                        "when_text": "User submits valid credentials",
                        "then_text": "System redirects to dashboard",
                        "coverage_frontend": True,
                        "coverage_backend": True,
                        "coverage_app": False,
                        "status": "draft",
                    }
                ],
            }
        )
    )

    result = service.generate_scenario_draft(
        ScenarioDraftRequest(title="Login", summary="Simple login")
    )

    assert result.feature_name == "Login feature"
    assert len(result.scenarios) == 1
    assert result.scenarios[0].scenario_title == "User logs in successfully"


def test_generate_scenario_draft_normalizes_alias_fields() -> None:
    service = AIDraftService(
        StubLLMClient(
            {
                "feature": "Login feature",
                "items": [
                    {
                        "title": "User logs in successfully",
                        "given": "User is on login page",
                        "when": "User submits valid credentials",
                        "then": "System redirects to dashboard",
                        "coverage": ["frontend", "backend"],
                    }
                ],
            }
        )
    )

    result = service.generate_scenario_draft(
        ScenarioDraftRequest(title="Login", summary="Simple login")
    )

    assert result.feature_name == "Login feature"
    assert result.scenarios[0].coverage_frontend is True
    assert result.scenarios[0].coverage_backend is True


def test_invalid_requirement_draft_raises_error() -> None:
    service = AIDraftService(StubLLMClient({"summary": "missing required fields"}))

    with pytest.raises(AIDraftParsingError):
        service.generate_requirement_draft(RequirementDraftRequest(raw_input="Need login"))


def test_generate_task_breakdown_returns_tasks() -> None:
    service = AIDraftService(
        StubLLMClient(
            {
                "tasks": [
                    {
                        "title": "Implement login endpoint",
                        "description": "Create backend login API",
                        "task_type": "backend",
                        "owner_name": "backend-dev",
                        "status": "todo",
                    },
                    {
                        "title": "Build login form",
                        "description": "Create frontend login UI",
                        "task_type": "frontend",
                        "owner_name": "frontend-dev",
                        "status": "todo",
                    },
                ]
            }
        )
    )

    result = service.generate_task_breakdown_draft(
        TaskBreakdownDraftRequest(title="Login", summary="Login flow")
    )

    assert len(result.tasks) == 2
    assert result.tasks[0].task_type == "backend"


def test_generate_task_breakdown_normalizes_alias_fields() -> None:
    service = AIDraftService(
        StubLLMClient(
            {
                "items": [
                    {
                        "name": "Add mobile login support",
                        "details": "Implement app login flow",
                        "type": "ios",
                        "owner": "app-dev",
                    }
                ]
            }
        )
    )

    result = service.generate_task_breakdown_draft(
        TaskBreakdownDraftRequest(title="Login", summary="Login flow")
    )

    assert result.tasks[0].task_type == "app"
    assert result.tasks[0].owner_name == "app-dev"
