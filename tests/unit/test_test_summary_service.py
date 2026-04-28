import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

import app.domain.models  # noqa: F401
from app.api.schemas.requirements import RequirementCreate
from app.api.schemas.test_summaries import TestSummaryCreate as SummaryCreateSchema
from app.domain.services.requirement import RequirementService
from app.domain.services.test_summary import (
    InvalidTestSummaryError,
    TestSummaryService as SummaryService,
)


@pytest.fixture
def services() -> tuple[RequirementService, SummaryService]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    session = Session(engine)
    return RequirementService(session), SummaryService(session)


def test_create_and_list_test_summaries(
    services: tuple[RequirementService, SummaryService],
) -> None:
    requirement_service, test_summary_service = services
    requirement = requirement_service.create_requirement(
        RequirementCreate(title="Req", summary="Req", status="draft")
    )

    test_summary_service.create_test_summary(
        requirement.id,
        SummaryCreateSchema(
            source="playwright",
            result="passed",
            summary="Smoke passed",
            report_url="https://example.com/report",
        ),
    )

    summaries = test_summary_service.list_test_summaries(requirement.id)

    assert len(summaries) == 1
    assert summaries[0].source == "playwright"


def test_invalid_test_summary_result_is_rejected(
    services: tuple[RequirementService, SummaryService],
) -> None:
    requirement_service, test_summary_service = services
    requirement = requirement_service.create_requirement(
        RequirementCreate(title="Req", summary="Req", status="draft")
    )

    with pytest.raises(InvalidTestSummaryError):
        test_summary_service.create_test_summary(
            requirement.id,
            SummaryCreateSchema(source="playwright", result="unknown"),
        )
