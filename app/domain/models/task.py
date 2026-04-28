from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: int | None = Field(default=None, primary_key=True)
    requirement_id: int = Field(foreign_key="requirements.id", index=True)
    scenario_id: int | None = Field(default=None, foreign_key="scenarios.id", index=True)
    title: str = Field(max_length=255)
    description: str | None = None
    task_type: str = Field(default="backend", index=True, max_length=50)
    owner_name: str | None = Field(default=None, max_length=100)
    status: str = Field(default="todo", index=True, max_length=50)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)
