from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ScenarioBase(BaseModel):
    feature_name: str = Field(min_length=1, max_length=255)
    scenario_title: str = Field(min_length=1, max_length=255)
    given_text: str | None = None
    when_text: str | None = None
    then_text: str | None = None
    coverage_frontend: bool = False
    coverage_backend: bool = False
    coverage_app: bool = False
    status: str = Field(default="draft", min_length=1, max_length=50)


class ScenarioCreate(ScenarioBase):
    pass


class ScenarioUpdate(BaseModel):
    feature_name: str | None = Field(default=None, min_length=1, max_length=255)
    scenario_title: str | None = Field(default=None, min_length=1, max_length=255)
    given_text: str | None = None
    when_text: str | None = None
    then_text: str | None = None
    coverage_frontend: bool | None = None
    coverage_backend: bool | None = None
    coverage_app: bool | None = None
    status: str | None = Field(default=None, min_length=1, max_length=50)


class ScenarioRead(ScenarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    requirement_id: int
    created_at: datetime
    updated_at: datetime
