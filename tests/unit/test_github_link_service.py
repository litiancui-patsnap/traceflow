import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

import app.domain.models  # noqa: F401
from app.api.schemas.github_links import GitHubLinkCreate
from app.api.schemas.requirements import RequirementCreate
from app.api.schemas.tasks import TaskCreate
from app.domain.services.github_link import InvalidGitHubLinkError, GitHubLinkService
from app.domain.services.requirement import RequirementService
from app.domain.services.task import TaskService


@pytest.fixture
def services() -> tuple[RequirementService, TaskService, GitHubLinkService]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    session = Session(engine)
    return RequirementService(session), TaskService(session), GitHubLinkService(session)


def test_create_requirement_link_and_list(
    services: tuple[RequirementService, TaskService, GitHubLinkService],
) -> None:
    requirement_service, _, github_link_service = services
    requirement = requirement_service.create_requirement(
        RequirementCreate(title="Req", summary="Req", status="draft")
    )

    github_link_service.create_requirement_link(
        requirement.id,
        GitHubLinkCreate(
            link_type="issue",
            url="https://github.com/org/repo/issues/1",
            label="Issue 1",
        ),
    )

    links = github_link_service.list_requirement_links(requirement.id)

    assert len(links) == 1
    assert links[0].link_type == "issue"


def test_create_task_link_and_list(
    services: tuple[RequirementService, TaskService, GitHubLinkService],
) -> None:
    requirement_service, task_service, github_link_service = services
    requirement = requirement_service.create_requirement(
        RequirementCreate(title="Req", summary="Req", status="draft")
    )
    task = task_service.create_task(
        requirement.id,
        TaskCreate(title="Task", task_type="backend", status="todo"),
    )

    github_link_service.create_task_link(
        task.id,
        GitHubLinkCreate(
            link_type="pr",
            url="https://github.com/org/repo/pull/2",
            label="PR 2",
        ),
    )

    links = github_link_service.list_task_links(task.id)

    assert len(links) == 1
    assert links[0].task_id == task.id


def test_invalid_github_url_is_rejected(
    services: tuple[RequirementService, TaskService, GitHubLinkService],
) -> None:
    requirement_service, _, github_link_service = services
    requirement = requirement_service.create_requirement(
        RequirementCreate(title="Req", summary="Req", status="draft")
    )

    with pytest.raises(InvalidGitHubLinkError):
        github_link_service.create_requirement_link(
            requirement.id,
            GitHubLinkCreate(link_type="issue", url="https://example.com/issue/1"),
        )
