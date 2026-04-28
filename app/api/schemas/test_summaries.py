from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TestSummaryCreate(BaseModel):
    source: str = Field(min_length=1, max_length=100)
    result: str = Field(min_length=1, max_length=50)
    summary: str | None = None
    report_url: str | None = Field(default=None, max_length=1000)
    run_at: datetime | None = None


class TestSummaryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    requirement_id: int
    source: str
    result: str
    summary: str | None
    report_url: str | None
    run_at: datetime | None
    created_at: datetime
