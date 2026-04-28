import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

import app.domain.models  # noqa: F401
from app.api.schemas.requirements import RequirementCreate
from app.api.schemas.scenarios import ScenarioCreate
from app.api.schemas.tasks import TaskCreate, TaskUpdate
from app.domain.services.requirement import RequirementService
from app.domain.services.scenario import ScenarioService
from app.domain.services.task import TaskNotFoundError, TaskService


@pytest.fixture
def services() -> tuple[RequirementService, ScenarioService, TaskService]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    session = Session(engine)
    return RequirementService(session), ScenarioService(session), TaskService(session)


def test_create_and_list_tasks(
    services: tuple[RequirementService, ScenarioService, TaskService],
) -> None:
    requirement_service, scenario_service, task_service = services
    requirement = requirement_service.create_requirement(
        RequirementCreate(title="Invoice", summary="Invoice flow", status="draft")
    )
    scenario = scenario_service.create_scenario(
        requirement.id,
        ScenarioCreate(
            feature_name="Invoice feature",
            scenario_title="Create invoice",
            status="draft",
        ),
    )

    created = task_service.create_task(
        requirement.id,
        TaskCreate(
            title="Build invoice API",
            description="Create backend endpoint",
            task_type="backend",
            owner_name="backend-dev",
            status="todo",
            scenario_id=scenario.id,
        ),
    )

    tasks = task_service.list_tasks(requirement.id)

    assert created.id is not None
    assert len(tasks) == 1
    assert tasks[0].title == "Build invoice API"


def test_update_task_changes_fields(
    services: tuple[RequirementService, ScenarioService, TaskService],
) -> None:
    requirement_service, _, task_service = services
    requirement = requirement_service.create_requirement(
        RequirementCreate(title="Coupons", summary="Coupons flow", status="draft")
    )
    task = task_service.create_task(
        requirement.id,
        TaskCreate(
            title="Build coupon form",
            task_type="frontend",
            status="todo",
        ),
    )

    updated = task_service.update_task(
        task.id,
        TaskUpdate(
            owner_name="frontend-dev",
            status="in_progress",
        ),
    )

    assert updated.owner_name == "frontend-dev"
    assert updated.status == "in_progress"


def test_delete_task_removes_it(
    services: tuple[RequirementService, ScenarioService, TaskService],
) -> None:
    requirement_service, _, task_service = services
    requirement = requirement_service.create_requirement(
        RequirementCreate(title="Settings", summary="Settings flow", status="draft")
    )
    task = task_service.create_task(
        requirement.id,
        TaskCreate(
            title="Implement settings save",
            task_type="backend",
            status="todo",
        ),
    )

    task_service.delete_task(task.id)

    with pytest.raises(TaskNotFoundError):
        task_service.get_task(task.id)


def test_create_task_rejects_scenario_from_another_requirement(
    services: tuple[RequirementService, ScenarioService, TaskService],
) -> None:
    requirement_service, scenario_service, task_service = services
    requirement_a = requirement_service.create_requirement(
        RequirementCreate(title="A", summary="A", status="draft")
    )
    requirement_b = requirement_service.create_requirement(
        RequirementCreate(title="B", summary="B", status="draft")
    )
    scenario = scenario_service.create_scenario(
        requirement_a.id,
        ScenarioCreate(feature_name="A feature", scenario_title="A scenario", status="draft"),
    )

    with pytest.raises(ValueError):
        task_service.create_task(
            requirement_b.id,
            TaskCreate(
                title="Wrong link",
                task_type="backend",
                status="todo",
                scenario_id=scenario.id,
            ),
        )
