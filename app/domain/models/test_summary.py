from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TestSummary(SQLModel, table=True):
    __tablename__ = "test_summaries"

    id: int | None = Field(default=None, primary_key=True)
    requirement_id: int = Field(foreign_key="requirements.id", index=True)
    source: str = Field(max_length=100)
    result: str = Field(max_length=50)
    summary: str | None = None
    report_url: str | None = Field(default=None, max_length=1000)
    run_at: datetime | None = None
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
