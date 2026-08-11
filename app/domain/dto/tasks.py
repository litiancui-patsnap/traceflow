from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    task_type: str = Field(default="backend", min_length=1, max_length=50)
    owner_name: str | None = Field(default=None, max_length=100)
    status: str = Field(default="todo", min_length=1, max_length=50)


class TaskCreate(TaskBase):
    scenario_id: int | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    task_type: str | None = Field(default=None, min_length=1, max_length=50)
    owner_name: str | None = Field(default=None, max_length=100)
    status: str | None = Field(default=None, min_length=1, max_length=50)
    scenario_id: int | None = None


class TaskRead(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    requirement_id: int
    scenario_id: int | None
    created_at: datetime
    updated_at: datetime
