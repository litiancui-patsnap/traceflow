from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session

from app.api.schemas.tasks import TaskCreate, TaskRead, TaskUpdate
from app.core.database import get_session
from app.domain.services.requirement import RequirementNotFoundError
from app.domain.services.scenario import ScenarioNotFoundError
from app.domain.services.task import TaskNotFoundError, TaskService

router = APIRouter()


def get_task_service(session: Session = Depends(get_session)) -> TaskService:
    return TaskService(session)


@router.get("/requirements/{requirement_id}/tasks", response_model=list[TaskRead])
def list_tasks(
    requirement_id: int,
    service: TaskService = Depends(get_task_service),
) -> list[TaskRead]:
    try:
        return service.list_tasks(requirement_id)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post(
    "/requirements/{requirement_id}/tasks",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    requirement_id: int,
    payload: TaskCreate,
    service: TaskService = Depends(get_task_service),
) -> TaskRead:
    try:
        return service.create_task(requirement_id, payload)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ScenarioNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/tasks/{task_id}", response_model=TaskRead)
def get_task(
    task_id: int,
    service: TaskService = Depends(get_task_service),
) -> TaskRead:
    try:
        return service.get_task(task_id)
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    service: TaskService = Depends(get_task_service),
) -> TaskRead:
    try:
        return service.update_task(task_id, payload)
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ScenarioNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    service: TaskService = Depends(get_task_service),
) -> Response:
    try:
        service.delete_task(task_id)
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)
