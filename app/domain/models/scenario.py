from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Scenario(SQLModel, table=True):
    __tablename__ = "scenarios"

    id: int | None = Field(default=None, primary_key=True)
    requirement_id: int = Field(foreign_key="requirements.id", index=True)
    feature_name: str = Field(max_length=255)
    scenario_title: str = Field(max_length=255)
    given_text: str | None = None
    when_text: str | None = None
    then_text: str | None = None
    coverage_frontend: bool = False
    coverage_backend: bool = False
    coverage_app: bool = False
    status: str = Field(default="draft", index=True, max_length=50)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)
