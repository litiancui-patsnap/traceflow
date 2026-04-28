from sqlmodel import Session

from app.api.schemas.acceptance_runs import AcceptanceRunCreate
from app.domain.models.acceptance_run import AcceptanceRun
from app.domain.repositories.acceptance_run import AcceptanceRunRepository
from app.domain.services.requirement import RequirementService

VALID_ACCEPTANCE_STATUSES = {"pending", "in_review", "passed", "failed", "blocked"}


class InvalidAcceptanceStatusError(Exception):
    """Raised when an acceptance status is invalid."""


class AcceptanceRunService:
    def __init__(self, session: Session):
        self.repository = AcceptanceRunRepository(session)
        self.requirement_service = RequirementService(session)

    def list_acceptance_runs(self, requirement_id: int) -> list[AcceptanceRun]:
        self.requirement_service.get_requirement(requirement_id)
        return self.repository.list_by_requirement(requirement_id)

    def create_acceptance_run(
        self, requirement_id: int, payload: AcceptanceRunCreate
    ) -> AcceptanceRun:
        self.requirement_service.get_requirement(requirement_id)
        if payload.status not in VALID_ACCEPTANCE_STATUSES:
            raise InvalidAcceptanceStatusError(
                f"Invalid acceptance status: {payload.status}"
            )

        acceptance_run = AcceptanceRun(requirement_id=requirement_id, **payload.model_dump())
        return self.repository.create(acceptance_run)
