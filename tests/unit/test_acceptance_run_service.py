import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

import app.domain.models  # noqa: F401
from app.api.schemas.acceptance_runs import AcceptanceRunCreate
from app.api.schemas.requirements import RequirementCreate
from app.domain.services.acceptance_run import (
    AcceptanceRunService,
    InvalidAcceptanceStatusError,
)
from app.domain.services.requirement import RequirementService


@pytest.fixture
def services() -> tuple[RequirementService, AcceptanceRunService]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    session = Session(engine)
    return RequirementService(session), AcceptanceRunService(session)


def test_create_and_list_acceptance_runs(
    services: tuple[RequirementService, AcceptanceRunService],
) -> None:
    requirement_service, acceptance_run_service = services
    requirement = requirement_service.create_requirement(
        RequirementCreate(title="Login acceptance", summary="Login", status="draft")
    )

    created = acceptance_run_service.create_acceptance_run(
        requirement.id,
        AcceptanceRunCreate(
            status="in_review",
            notes="Smoke check started",
            recorded_by="tester",
        ),
    )

    runs = acceptance_run_service.list_acceptance_runs(requirement.id)

    assert created.id is not None
    assert len(runs) == 1
    assert runs[0].status == "in_review"


def test_invalid_acceptance_status_is_rejected(
    services: tuple[RequirementService, AcceptanceRunService],
) -> None:
    requirement_service, acceptance_run_service = services
    requirement = requirement_service.create_requirement(
        RequirementCreate(title="Register acceptance", summary="Register", status="draft")
    )

    with pytest.raises(InvalidAcceptanceStatusError):
        acceptance_run_service.create_acceptance_run(
            requirement.id,
            AcceptanceRunCreate(status="done-ish"),
        )
