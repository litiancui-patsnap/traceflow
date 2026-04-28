from sqlmodel import Session

from app.api.schemas.requirements import RequirementCreate, RequirementUpdate
from app.domain.models.requirement import Requirement
from app.domain.repositories.requirement import RequirementRepository


class RequirementNotFoundError(Exception):
    """Raised when a requirement cannot be found."""


class RequirementService:
    def __init__(self, session: Session):
        self.repository = RequirementRepository(session)

    def list_requirements(self) -> list[Requirement]:
        return self.repository.list()

    def get_requirement(self, requirement_id: int) -> Requirement:
        requirement = self.repository.get(requirement_id)
        if requirement is None:
            raise RequirementNotFoundError(f"Requirement {requirement_id} not found")
        return requirement

    def create_requirement(self, payload: RequirementCreate) -> Requirement:
        requirement = Requirement(**payload.model_dump())
        return self.repository.create(requirement)

    def update_requirement(self, requirement_id: int, payload: RequirementUpdate) -> Requirement:
        requirement = self.get_requirement(requirement_id)
        update_data = payload.model_dump(exclude_unset=True)
        return self.repository.update(requirement, update_data)
