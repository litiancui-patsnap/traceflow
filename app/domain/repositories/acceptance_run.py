from app.domain.models.acceptance_run import AcceptanceRun
from app.domain.repositories.base import RequirementScopedRepository


class AcceptanceRunRepository(RequirementScopedRepository[AcceptanceRun]):
    model = AcceptanceRun
