from sqlmodel import Session, select

from app.domain.models.github_link import GitHubLink


class GitHubLinkRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_by_requirement(self, requirement_id: int) -> list[GitHubLink]:
        statement = (
            select(GitHubLink)
            .where(GitHubLink.requirement_id == requirement_id)
            .order_by(GitHubLink.created_at.desc())
        )
        return list(self.session.exec(statement))

    def list_by_task(self, task_id: int) -> list[GitHubLink]:
        statement = (
            select(GitHubLink)
            .where(GitHubLink.task_id == task_id)
            .order_by(GitHubLink.created_at.desc())
        )
        return list(self.session.exec(statement))

    def get(self, github_link_id: int) -> GitHubLink | None:
        return self.session.get(GitHubLink, github_link_id)

    def create(self, github_link: GitHubLink) -> GitHubLink:
        self.session.add(github_link)
        self.session.commit()
        self.session.refresh(github_link)
        return github_link

    def delete(self, github_link: GitHubLink) -> None:
        self.session.delete(github_link)
        self.session.commit()
