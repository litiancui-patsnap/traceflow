from datetime import datetime, timezone

from sqlmodel import Session, select

from app.domain.models.scenario import Scenario


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ScenarioRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_by_requirement(self, requirement_id: int) -> list[Scenario]:
        statement = (
            select(Scenario)
            .where(Scenario.requirement_id == requirement_id)
            .order_by(Scenario.updated_at.desc())
        )
        return list(self.session.exec(statement))

    def get(self, scenario_id: int) -> Scenario | None:
        return self.session.get(Scenario, scenario_id)

    def create(self, scenario: Scenario) -> Scenario:
        self.session.add(scenario)
        self.session.commit()
        self.session.refresh(scenario)
        return scenario

    def update(self, scenario: Scenario, data: dict[str, object]) -> Scenario:
        for key, value in data.items():
            setattr(scenario, key, value)

        scenario.updated_at = utc_now()
        self.session.add(scenario)
        self.session.commit()
        self.session.refresh(scenario)
        return scenario

    def delete(self, scenario: Scenario) -> None:
        self.session.delete(scenario)
        self.session.commit()
