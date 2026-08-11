from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.dto.acceptance_runs import AcceptanceRunRead
from app.domain.dto.github_links import GitHubLinkRead
from app.domain.dto.scenarios import ScenarioRead
from app.domain.dto.tasks import TaskRead
from app.domain.dto.test_summaries import TestSummaryRead


class RequirementBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    raw_input: str | None = None
    summary: str | None = None
    business_value: str | None = None
    acceptance_criteria: str | None = None
    design_links_json: str | None = None
    status: str = Field(default="draft", min_length=1, max_length=50)


class RequirementCreate(RequirementBase):
    pass


class RequirementUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    raw_input: str | None = None
    summary: str | None = None
    business_value: str | None = None
    acceptance_criteria: str | None = None
    design_links_json: str | None = None
    status: str | None = Field(default=None, min_length=1, max_length=50)


class RequirementRead(RequirementBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class RequirementDetailResponse(BaseModel):
    requirement: RequirementRead
    scenarios: list[ScenarioRead]
    tasks: list[TaskRead]
    acceptance_runs: list[AcceptanceRunRead]
    github_links: list[GitHubLinkRead]
    test_summaries: list[TestSummaryRead]
