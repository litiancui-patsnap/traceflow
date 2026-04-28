from sqlmodel import Session

from app.api.schemas.github_links import GitHubLinkCreate
from app.domain.models.github_link import GitHubLink
from app.domain.repositories.github_link import GitHubLinkRepository
from app.domain.services.requirement import RequirementService
from app.domain.services.task import TaskService

VALID_GITHUB_LINK_TYPES = {"issue", "pr", "commit", "discussion"}


class GitHubLinkNotFoundError(Exception):
    """Raised when a GitHub link cannot be found."""


class InvalidGitHubLinkError(Exception):
    """Raised when GitHub link payload is invalid."""


class GitHubLinkService:
    def __init__(self, session: Session):
        self.repository = GitHubLinkRepository(session)
        self.requirement_service = RequirementService(session)
        self.task_service = TaskService(session)

    def list_requirement_links(self, requirement_id: int) -> list[GitHubLink]:
        self.requirement_service.get_requirement(requirement_id)
        return self.repository.list_by_requirement(requirement_id)

    def list_task_links(self, task_id: int) -> list[GitHubLink]:
        self.task_service.get_task(task_id)
        return self.repository.list_by_task(task_id)

    def create_requirement_link(
        self, requirement_id: int, payload: GitHubLinkCreate
    ) -> GitHubLink:
        self.requirement_service.get_requirement(requirement_id)
        self._validate_payload(payload)
        link = GitHubLink(requirement_id=requirement_id, **payload.model_dump())
        return self.repository.create(link)

    def create_task_link(self, task_id: int, payload: GitHubLinkCreate) -> GitHubLink:
        task = self.task_service.get_task(task_id)
        self._validate_payload(payload)
        link = GitHubLink(
            requirement_id=task.requirement_id,
            task_id=task_id,
            **payload.model_dump(),
        )
        return self.repository.create(link)

    def delete_link(self, github_link_id: int) -> None:
        link = self.repository.get(github_link_id)
        if link is None:
            raise GitHubLinkNotFoundError(f"GitHub link {github_link_id} not found")
        self.repository.delete(link)

    def _validate_payload(self, payload: GitHubLinkCreate) -> None:
        if payload.link_type not in VALID_GITHUB_LINK_TYPES:
            raise InvalidGitHubLinkError(f"Invalid GitHub link type: {payload.link_type}")
        if "github.com" not in payload.url:
            raise InvalidGitHubLinkError("GitHub link URL must point to github.com")
