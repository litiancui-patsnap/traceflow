from sqlmodel import select

from app.domain.models.github_link import GitHubLink
from app.domain.repositories.base import RequirementScopedRepository


class GitHubLinkRepository(RequirementScopedRepository[GitHubLink]):
    model = GitHubLink

    def list_by_task(self, task_id: int) -> list[GitHubLink]:
        return self._exec(self._ordered(select(GitHubLink).where(GitHubLink.task_id == task_id)))
