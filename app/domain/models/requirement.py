from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Requirement(SQLModel, table=True):
    __tablename__ = "requirements"

    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(index=True, max_length=255)
    raw_input: str | None = None
    summary: str | None = None
    business_value: str | None = None
    acceptance_criteria: str | None = None
    design_links_json: str | None = None
    status: str = Field(default="draft", index=True, max_length=50)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)
