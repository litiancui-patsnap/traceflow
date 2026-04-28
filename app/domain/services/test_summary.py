from sqlmodel import Session

from app.api.schemas.test_summaries import TestSummaryCreate
from app.domain.models.test_summary import TestSummary
from app.domain.repositories.test_summary import TestSummaryRepository
from app.domain.services.requirement import RequirementService

VALID_TEST_SUMMARY_RESULTS = {"passed", "failed", "partial", "blocked"}


class InvalidTestSummaryError(Exception):
    """Raised when test summary payload is invalid."""


class TestSummaryService:
    def __init__(self, session: Session):
        self.repository = TestSummaryRepository(session)
        self.requirement_service = RequirementService(session)

    def list_test_summaries(self, requirement_id: int) -> list[TestSummary]:
        self.requirement_service.get_requirement(requirement_id)
        return self.repository.list_by_requirement(requirement_id)

    def create_test_summary(
        self, requirement_id: int, payload: TestSummaryCreate
    ) -> TestSummary:
        self.requirement_service.get_requirement(requirement_id)
        if payload.result not in VALID_TEST_SUMMARY_RESULTS:
            raise InvalidTestSummaryError(f"Invalid test summary result: {payload.result}")

        test_summary = TestSummary(requirement_id=requirement_id, **payload.model_dump())
        return self.repository.create(test_summary)
