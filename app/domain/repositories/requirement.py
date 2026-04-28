from datetime import datetime, timezone

from sqlmodel import Session, select

from app.domain.models.requirement import Requirement


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RequirementRepository:
    def __init__(self, session: Session):
        self.session = session

    def list(self) -> list[Requirement]:
        statement = select(Requirement).order_by(Requirement.updated_at.desc())
        return list(self.session.exec(statement))

    def get(self, requirement_id: int) -> Requirement | None:
        return self.session.get(Requirement, requirement_id)

    def create(self, requirement: Requirement) -> Requirement:
        self.session.add(requirement)
        self.session.commit()
        self.session.refresh(requirement)
        return requirement

    def update(self, requirement: Requirement, data: dict[str, object]) -> Requirement:
        for key, value in data.items():
            setattr(requirement, key, value)

        requirement.updated_at = utc_now()
        self.session.add(requirement)
        self.session.commit()
        self.session.refresh(requirement)
        return requirement
