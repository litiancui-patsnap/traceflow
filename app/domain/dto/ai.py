from pydantic import BaseModel, Field


class RequirementDraftRequest(BaseModel):
    raw_input: str = Field(min_length=1)
    business_context: str | None = None
    design_hints: str | None = None


class RequirementDraftResponse(BaseModel):
    title: str
    summary: str
    business_value: str
    acceptance_criteria: str
    status: str = "draft"


class ScenarioDraftRequest(BaseModel):
    title: str = Field(min_length=1)
    summary: str | None = None
    acceptance_criteria: str | None = None


class ScenarioDraft(BaseModel):
    scenario_title: str
    given_text: str | None = None
    when_text: str | None = None
    then_text: str | None = None
    coverage_frontend: bool = False
    coverage_backend: bool = False
    coverage_app: bool = False
    status: str = "draft"


class ScenarioDraftResponse(BaseModel):
    feature_name: str
    scenarios: list[ScenarioDraft]


class TaskBreakdownDraftRequest(BaseModel):
    title: str = Field(min_length=1)
    summary: str | None = None
    acceptance_criteria: str | None = None
    scenarios_text: str | None = None


class TaskBreakdownDraftItem(BaseModel):
    title: str
    description: str | None = None
    task_type: str
    owner_name: str | None = None
    status: str = "todo"


class TaskBreakdownDraftResponse(BaseModel):
    tasks: list[TaskBreakdownDraftItem]
