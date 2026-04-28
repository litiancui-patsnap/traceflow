from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.schemas.requirements import (
    RequirementCreate,
    RequirementDetailResponse,
    RequirementRead,
    RequirementUpdate,
)
from app.core.database import get_session
from app.domain.services.acceptance_run import AcceptanceRunService
from app.domain.services.github_link import GitHubLinkService
from app.domain.services.requirement import RequirementNotFoundError, RequirementService
from app.domain.services.scenario import ScenarioService
from app.domain.services.task import TaskService
from app.domain.services.test_summary import TestSummaryService

router = APIRouter()


def get_requirement_service(session: Session = Depends(get_session)) -> RequirementService:
    return RequirementService(session)


def get_requirement_detail_services(
    session: Session = Depends(get_session),
) -> tuple[
    RequirementService,
    ScenarioService,
    TaskService,
    AcceptanceRunService,
    GitHubLinkService,
    TestSummaryService,
]:
    return (
        RequirementService(session),
        ScenarioService(session),
        TaskService(session),
        AcceptanceRunService(session),
        GitHubLinkService(session),
        TestSummaryService(session),
    )


@router.get("", response_model=list[RequirementRead])
def list_requirements(
    service: RequirementService = Depends(get_requirement_service),
) -> list[RequirementRead]:
    return service.list_requirements()


@router.post("", response_model=RequirementRead, status_code=status.HTTP_201_CREATED)
def create_requirement(
    payload: RequirementCreate,
    service: RequirementService = Depends(get_requirement_service),
) -> RequirementRead:
    return service.create_requirement(payload)


@router.get("/{requirement_id}", response_model=RequirementRead)
def get_requirement(
    requirement_id: int,
    service: RequirementService = Depends(get_requirement_service),
) -> RequirementRead:
    try:
        return service.get_requirement(requirement_id)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{requirement_id}/detail", response_model=RequirementDetailResponse)
def get_requirement_detail(
    requirement_id: int,
    services: tuple[
        RequirementService,
        ScenarioService,
        TaskService,
        AcceptanceRunService,
        GitHubLinkService,
        TestSummaryService,
    ] = Depends(get_requirement_detail_services),
) -> RequirementDetailResponse:
    (
        requirement_service,
        scenario_service,
        task_service,
        acceptance_run_service,
        github_link_service,
        test_summary_service,
    ) = services

    try:
        return RequirementDetailResponse(
            requirement=requirement_service.get_requirement(requirement_id),
            scenarios=scenario_service.list_scenarios(requirement_id),
            tasks=task_service.list_tasks(requirement_id),
            acceptance_runs=acceptance_run_service.list_acceptance_runs(requirement_id),
            github_links=github_link_service.list_requirement_links(requirement_id),
            test_summaries=test_summary_service.list_test_summaries(requirement_id),
        )
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/{requirement_id}", response_model=RequirementRead)
def update_requirement(
    requirement_id: int,
    payload: RequirementUpdate,
    service: RequirementService = Depends(get_requirement_service),
) -> RequirementRead:
    try:
        return service.update_requirement(requirement_id, payload)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
