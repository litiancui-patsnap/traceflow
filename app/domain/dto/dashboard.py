from datetime import datetime

from pydantic import BaseModel


class DashboardSummaryRow(BaseModel):
    id: int
    title: str
    status: str
    scenario_count: int
    task_count: int
    latest_acceptance_status: str
    latest_test_summary_result: str
    health: str
    needs_attention: bool
    updated_at: datetime


class DashboardSummaryCounts(BaseModel):
    total_requirements: int
    draft_requirements: int
    ready_requirements: int
    accepted_requirements: int
    at_risk_requirements: int
    missing_scenarios_requirements: int
    missing_tasks_requirements: int
    in_progress_requirements: int
    ready_for_review_requirements: int


class DashboardAttentionItem(BaseModel):
    id: int
    title: str
    health: str
    summary: str


class DashboardRecommendedAction(BaseModel):
    owner: str
    summary: str


class DashboardSummaryResponse(BaseModel):
    counts: DashboardSummaryCounts
    rows: list[DashboardSummaryRow]
    attention_needed: list[DashboardAttentionItem]
    recommended_actions: list[DashboardRecommendedAction]
