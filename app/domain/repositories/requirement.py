from sqlmodel import select

from app.domain.models.requirement import Requirement
from app.domain.repositories.base import BaseRepository


class RequirementRepository(BaseRepository[Requirement]):
    model = Requirement
    order_column = "updated_at"

    def list(self) -> list[Requirement]:
        return self._exec(self._ordered(select(Requirement)))
