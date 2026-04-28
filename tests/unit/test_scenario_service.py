import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

import app.domain.models  # noqa: F401
from app.api.schemas.requirements import RequirementCreate
from app.api.schemas.scenarios import ScenarioCreate, ScenarioUpdate
from app.domain.services.requirement import RequirementService
from app.domain.services.scenario import ScenarioNotFoundError, ScenarioService


@pytest.fixture
def services() -> tuple[RequirementService, ScenarioService]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    session = Session(engine)
    return RequirementService(session), ScenarioService(session)


def test_create_and_list_scenarios(services: tuple[RequirementService, ScenarioService]) -> None:
    requirement_service, scenario_service = services
    requirement = requirement_service.create_requirement(
        RequirementCreate(title="Order creation", summary="Order flow", status="draft")
    )

    created = scenario_service.create_scenario(
        requirement.id,
        ScenarioCreate(
            feature_name="Order feature",
            scenario_title="Create order successfully",
            given_text="User is on checkout page",
            when_text="User submits order",
            then_text="System creates an order",
            coverage_frontend=True,
            coverage_backend=True,
            status="draft",
        ),
    )

    scenarios = scenario_service.list_scenarios(requirement.id)

    assert created.id is not None
    assert len(scenarios) == 1
    assert scenarios[0].feature_name == "Order feature"


def test_update_scenario_changes_fields(services: tuple[RequirementService, ScenarioService]) -> None:
    requirement_service, scenario_service = services
    requirement = requirement_service.create_requirement(
        RequirementCreate(title="Refund", summary="Refund flow", status="draft")
    )
    scenario = scenario_service.create_scenario(
        requirement.id,
        ScenarioCreate(
            feature_name="Refund feature",
            scenario_title="Initial scenario",
            status="draft",
        ),
    )

    updated = scenario_service.update_scenario(
        scenario.id,
        ScenarioUpdate(
            scenario_title="Updated scenario",
            coverage_app=True,
            status="ready",
        ),
    )

    assert updated.scenario_title == "Updated scenario"
    assert updated.coverage_app is True
    assert updated.status == "ready"


def test_delete_scenario_removes_it(services: tuple[RequirementService, ScenarioService]) -> None:
    requirement_service, scenario_service = services
    requirement = requirement_service.create_requirement(
        RequirementCreate(title="Profile edit", summary="Edit profile", status="draft")
    )
    scenario = scenario_service.create_scenario(
        requirement.id,
        ScenarioCreate(
            feature_name="Profile feature",
            scenario_title="Edit profile successfully",
            status="draft",
        ),
    )

    scenario_service.delete_scenario(scenario.id)

    with pytest.raises(ScenarioNotFoundError):
        scenario_service.get_scenario(scenario.id)
