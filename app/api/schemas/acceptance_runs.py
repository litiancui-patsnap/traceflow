from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AcceptanceRunCreate(BaseModel):
    status: str = Field(min_length=1, max_length=50)
    notes: str | None = None
    recorded_by: str | None = Field(default=None, max_length=100)


class AcceptanceRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    requirement_id: int
    status: str
    notes: str | None
    recorded_by: str | None
    created_at: datetime
