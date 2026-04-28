from sqlmodel import Session, select

from app.domain.models.acceptance_run import AcceptanceRun


class AcceptanceRunRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_by_requirement(self, requirement_id: int) -> list[AcceptanceRun]:
        statement = (
            select(AcceptanceRun)
            .where(AcceptanceRun.requirement_id == requirement_id)
            .order_by(AcceptanceRun.created_at.desc())
        )
        return list(self.session.exec(statement))

    def create(self, acceptance_run: AcceptanceRun) -> AcceptanceRun:
        self.session.add(acceptance_run)
        self.session.commit()
        self.session.refresh(acceptance_run)
        return acceptance_run
