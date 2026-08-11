from typing import Generic, TypeVar

from sqlmodel import Session, SQLModel, select

from app.core.utils import utc_now

ModelT = TypeVar("ModelT", bound=SQLModel)


class BaseRepository(Generic[ModelT]):
    """Shared CRUD for SQLModel-backed repositories.

    Subclasses set ``model`` and, when the default is wrong, ``order_column``.
    Only queries specific to one entity belong in the subclass.
    """

    model: type[ModelT]
    order_column: str = "created_at"

    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, entity_id: int) -> ModelT | None:
        return self.session.get(self.model, entity_id)

    def create(self, entity: ModelT) -> ModelT:
        self.session.add(entity)
        self.session.commit()
        self.session.refresh(entity)
        return entity

    def update(self, entity: ModelT, data: dict[str, object]) -> ModelT:
        for key, value in data.items():
            setattr(entity, key, value)

        if hasattr(entity, "updated_at"):
            entity.updated_at = utc_now()

        self.session.add(entity)
        self.session.commit()
        self.session.refresh(entity)
        return entity

    def delete(self, entity: ModelT) -> None:
        self.session.delete(entity)
        self.session.commit()

    def _ordered(self, statement):
        return statement.order_by(getattr(self.model, self.order_column).desc())

    def _exec(self, statement) -> list[ModelT]:
        return list(self.session.exec(statement))


class RequirementScopedRepository(BaseRepository[ModelT]):
    """Base for entities that hang off a single requirement."""

    def list_by_requirement(self, requirement_id: int) -> list[ModelT]:
        return self._exec(
            self._ordered(select(self.model).where(self.model.requirement_id == requirement_id))
        )
