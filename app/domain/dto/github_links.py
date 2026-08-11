from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GitHubLinkCreate(BaseModel):
    link_type: str = Field(min_length=1, max_length=50)
    url: str = Field(min_length=1, max_length=1000)
    label: str | None = Field(default=None, max_length=255)


class GitHubLinkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    requirement_id: int | None
    task_id: int | None
    link_type: str
    url: str
    label: str | None
    created_at: datetime
