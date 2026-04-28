from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AcceptanceRun(SQLModel, table=True):
    __tablename__ = "acceptance_runs"

    id: int | None = Field(default=None, primary_key=True)
    requirement_id: int = Field(foreign_key="requirements.id", index=True)
    status: str = Field(default="pending", index=True, max_length=50)
    notes: str | None = None
    recorded_by: str | None = Field(default=None, max_length=100)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
