from fastapi import APIRouter, Depends, HTTPException, status

from app.ai.client import get_llm_client
from app.ai.services import AIDraftParsingError, AIDraftService
from app.api.schemas.ai import (
    RequirementDraftRequest,
    RequirementDraftResponse,
    ScenarioDraftRequest,
    ScenarioDraftResponse,
    TaskBreakdownDraftRequest,
    TaskBreakdownDraftResponse,
)

router = APIRouter(prefix="/ai")


def get_ai_draft_service() -> AIDraftService:
    return AIDraftService(get_llm_client())


@router.post("/requirement-draft", response_model=RequirementDraftResponse)
def generate_requirement_draft(
    payload: RequirementDraftRequest,
    service: AIDraftService = Depends(get_ai_draft_service),
) -> RequirementDraftResponse:
    try:
        return service.generate_requirement_draft(payload)
    except AIDraftParsingError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("/scenario-draft", response_model=ScenarioDraftResponse)
def generate_scenario_draft(
    payload: ScenarioDraftRequest,
    service: AIDraftService = Depends(get_ai_draft_service),
) -> ScenarioDraftResponse:
    try:
        return service.generate_scenario_draft(payload)
    except AIDraftParsingError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("/task-breakdown-draft", response_model=TaskBreakdownDraftResponse)
def generate_task_breakdown_draft(
    payload: TaskBreakdownDraftRequest,
    service: AIDraftService = Depends(get_ai_draft_service),
) -> TaskBreakdownDraftResponse:
    try:
        return service.generate_task_breakdown_draft(payload)
    except AIDraftParsingError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
