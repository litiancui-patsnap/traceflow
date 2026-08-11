from datetime import datetime

from sqlmodel import Field, SQLModel

from app.core.utils import utc_now


class GitHubLink(SQLModel, table=True):
    __tablename__ = "github_links"

    id: int | None = Field(default=None, primary_key=True)
    requirement_id: int | None = Field(default=None, foreign_key="requirements.id", index=True)
    task_id: int | None = Field(default=None, foreign_key="tasks.id", index=True)
    link_type: str = Field(max_length=50)
    url: str = Field(max_length=1000)
    label: str | None = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
