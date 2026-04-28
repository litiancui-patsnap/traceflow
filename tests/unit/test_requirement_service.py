import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool

import app.domain.models  # noqa: F401
from app.api.schemas.requirements import RequirementCreate, RequirementUpdate
from app.domain.services.requirement import RequirementNotFoundError, RequirementService


@pytest.fixture
def service() -> RequirementService:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    session = Session(engine)
    return RequirementService(session)


def test_create_and_list_requirements(service: RequirementService) -> None:
    created = service.create_requirement(
        RequirementCreate(
            title="Login feature",
            raw_input="Boss wants a simpler login flow.",
            summary="Simplify login.",
            business_value="Reduce support cost.",
            acceptance_criteria="User can log in successfully.",
            status="draft",
        )
    )

    requirements = service.list_requirements()

    assert created.id is not None
    assert len(requirements) == 1
    assert requirements[0].title == "Login feature"


def test_update_requirement_changes_fields(service: RequirementService) -> None:
    created = service.create_requirement(
        RequirementCreate(
            title="Payment retry",
            summary="Initial summary",
            status="draft",
        )
    )

    updated = service.update_requirement(
        created.id,
        RequirementUpdate(
            summary="Updated summary",
            status="ready",
        ),
    )

    assert updated.summary == "Updated summary"
    assert updated.status == "ready"


def test_get_requirement_raises_when_missing(service: RequirementService) -> None:
    with pytest.raises(RequirementNotFoundError):
        service.get_requirement(999)
