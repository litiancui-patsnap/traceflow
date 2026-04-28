from sqlmodel import Session, select

from app.domain.models.test_summary import TestSummary


class TestSummaryRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_by_requirement(self, requirement_id: int) -> list[TestSummary]:
        statement = (
            select(TestSummary)
            .where(TestSummary.requirement_id == requirement_id)
            .order_by(TestSummary.created_at.desc())
        )
        return list(self.session.exec(statement))

    def create(self, test_summary: TestSummary) -> TestSummary:
        self.session.add(test_summary)
        self.session.commit()
        self.session.refresh(test_summary)
        return test_summary
