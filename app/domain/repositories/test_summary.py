from app.domain.models.test_summary import TestSummary
from app.domain.repositories.base import RequirementScopedRepository


class TestSummaryRepository(RequirementScopedRepository[TestSummary]):
    model = TestSummary
