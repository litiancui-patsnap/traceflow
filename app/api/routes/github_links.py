from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session

from app.api.schemas.github_links import GitHubLinkCreate, GitHubLinkRead
from app.core.database import get_session
from app.domain.services.github_link import (
    GitHubLinkNotFoundError,
    GitHubLinkService,
    InvalidGitHubLinkError,
)
from app.domain.services.requirement import RequirementNotFoundError
from app.domain.services.task import TaskNotFoundError

router = APIRouter()


def get_github_link_service(session: Session = Depends(get_session)) -> GitHubLinkService:
    return GitHubLinkService(session)


@router.get("/requirements/{requirement_id}/github-links", response_model=list[GitHubLinkRead])
def list_requirement_github_links(
    requirement_id: int,
    service: GitHubLinkService = Depends(get_github_link_service),
) -> list[GitHubLinkRead]:
    try:
        return service.list_requirement_links(requirement_id)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post(
    "/requirements/{requirement_id}/github-links",
    response_model=GitHubLinkRead,
    status_code=status.HTTP_201_CREATED,
)
def create_requirement_github_link(
    requirement_id: int,
    payload: GitHubLinkCreate,
    service: GitHubLinkService = Depends(get_github_link_service),
) -> GitHubLinkRead:
    try:
        return service.create_requirement_link(requirement_id, payload)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidGitHubLinkError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/tasks/{task_id}/github-links", response_model=list[GitHubLinkRead])
def list_task_github_links(
    task_id: int,
    service: GitHubLinkService = Depends(get_github_link_service),
) -> list[GitHubLinkRead]:
    try:
        return service.list_task_links(task_id)
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post(
    "/tasks/{task_id}/github-links",
    response_model=GitHubLinkRead,
    status_code=status.HTTP_201_CREATED,
)
def create_task_github_link(
    task_id: int,
    payload: GitHubLinkCreate,
    service: GitHubLinkService = Depends(get_github_link_service),
) -> GitHubLinkRead:
    try:
        return service.create_task_link(task_id, payload)
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidGitHubLinkError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/github-links/{github_link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_github_link(
    github_link_id: int,
    service: GitHubLinkService = Depends(get_github_link_service),
) -> Response:
    try:
        service.delete_link(github_link_id)
    except GitHubLinkNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)
