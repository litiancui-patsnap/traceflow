from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session

from app.api.schemas.scenarios import ScenarioCreate, ScenarioRead, ScenarioUpdate
from app.core.database import get_session
from app.domain.services.requirement import RequirementNotFoundError
from app.domain.services.scenario import ScenarioNotFoundError, ScenarioService

router = APIRouter()


def get_scenario_service(session: Session = Depends(get_session)) -> ScenarioService:
    return ScenarioService(session)


@router.get("/requirements/{requirement_id}/scenarios", response_model=list[ScenarioRead])
def list_scenarios(
    requirement_id: int,
    service: ScenarioService = Depends(get_scenario_service),
) -> list[ScenarioRead]:
    try:
        return service.list_scenarios(requirement_id)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post(
    "/requirements/{requirement_id}/scenarios",
    response_model=ScenarioRead,
    status_code=status.HTTP_201_CREATED,
)
def create_scenario(
    requirement_id: int,
    payload: ScenarioCreate,
    service: ScenarioService = Depends(get_scenario_service),
) -> ScenarioRead:
    try:
        return service.create_scenario(requirement_id, payload)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/scenarios/{scenario_id}", response_model=ScenarioRead)
def get_scenario(
    scenario_id: int,
    service: ScenarioService = Depends(get_scenario_service),
) -> ScenarioRead:
    try:
        return service.get_scenario(scenario_id)
    except ScenarioNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/scenarios/{scenario_id}", response_model=ScenarioRead)
def update_scenario(
    scenario_id: int,
    payload: ScenarioUpdate,
    service: ScenarioService = Depends(get_scenario_service),
) -> ScenarioRead:
    try:
        return service.update_scenario(scenario_id, payload)
    except ScenarioNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/scenarios/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scenario(
    scenario_id: int,
    service: ScenarioService = Depends(get_scenario_service),
) -> Response:
    try:
        service.delete_scenario(scenario_id)
    except ScenarioNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)
