from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.schemas.acceptance_runs import AcceptanceRunCreate, AcceptanceRunRead
from app.core.database import get_session
from app.domain.services.acceptance_run import (
    AcceptanceRunService,
    InvalidAcceptanceStatusError,
)
from app.domain.services.requirement import RequirementNotFoundError

router = APIRouter()


def get_acceptance_run_service(
    session: Session = Depends(get_session),
) -> AcceptanceRunService:
    return AcceptanceRunService(session)


@router.get(
    "/requirements/{requirement_id}/acceptance-runs",
    response_model=list[AcceptanceRunRead],
)
def list_acceptance_runs(
    requirement_id: int,
    service: AcceptanceRunService = Depends(get_acceptance_run_service),
) -> list[AcceptanceRunRead]:
    try:
        return service.list_acceptance_runs(requirement_id)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post(
    "/requirements/{requirement_id}/acceptance-runs",
    response_model=AcceptanceRunRead,
    status_code=status.HTTP_201_CREATED,
)
def create_acceptance_run(
    requirement_id: int,
    payload: AcceptanceRunCreate,
    service: AcceptanceRunService = Depends(get_acceptance_run_service),
) -> AcceptanceRunRead:
    try:
        return service.create_acceptance_run(requirement_id, payload)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidAcceptanceStatusError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
