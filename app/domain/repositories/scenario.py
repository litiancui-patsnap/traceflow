from app.domain.models.scenario import Scenario
from app.domain.repositories.base import RequirementScopedRepository


class ScenarioRepository(RequirementScopedRepository[Scenario]):
    model = Scenario
    order_column = "updated_at"
