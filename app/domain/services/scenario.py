from sqlmodel import Session

from app.api.schemas.scenarios import ScenarioCreate, ScenarioUpdate
from app.domain.models.scenario import Scenario
from app.domain.repositories.scenario import ScenarioRepository
from app.domain.services.requirement import RequirementService


class ScenarioNotFoundError(Exception):
    """Raised when a scenario cannot be found."""


class ScenarioService:
    def __init__(self, session: Session):
        self.repository = ScenarioRepository(session)
        self.requirement_service = RequirementService(session)

    def list_scenarios(self, requirement_id: int) -> list[Scenario]:
        self.requirement_service.get_requirement(requirement_id)
        return self.repository.list_by_requirement(requirement_id)

    def get_scenario(self, scenario_id: int) -> Scenario:
        scenario = self.repository.get(scenario_id)
        if scenario is None:
            raise ScenarioNotFoundError(f"Scenario {scenario_id} not found")
        return scenario

    def create_scenario(self, requirement_id: int, payload: ScenarioCreate) -> Scenario:
        self.requirement_service.get_requirement(requirement_id)
        scenario = Scenario(requirement_id=requirement_id, **payload.model_dump())
        return self.repository.create(scenario)

    def update_scenario(self, scenario_id: int, payload: ScenarioUpdate) -> Scenario:
        scenario = self.get_scenario(scenario_id)
        update_data = payload.model_dump(exclude_unset=True)
        return self.repository.update(scenario, update_data)

    def delete_scenario(self, scenario_id: int) -> None:
        scenario = self.get_scenario(scenario_id)
        self.repository.delete(scenario)
