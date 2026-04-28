from app.api.schemas.dashboard import (
    DashboardAttentionItem,
    DashboardRecommendedAction,
    DashboardSummaryCounts,
    DashboardSummaryResponse,
    DashboardSummaryRow,
)
from app.domain.models.requirement import Requirement
from app.domain.services.acceptance_run import AcceptanceRunService
from app.domain.services.requirement import RequirementService
from app.domain.services.scenario import ScenarioService
from app.domain.services.task import TaskService
from app.domain.services.test_summary import TestSummaryService


class DashboardService:
    def __init__(
        self,
        requirement_service: RequirementService,
        scenario_service: ScenarioService,
        task_service: TaskService,
        acceptance_run_service: AcceptanceRunService,
        test_summary_service: TestSummaryService,
    ):
        self.requirement_service = requirement_service
        self.scenario_service = scenario_service
        self.task_service = task_service
        self.acceptance_run_service = acceptance_run_service
        self.test_summary_service = test_summary_service

    def get_summary(self) -> DashboardSummaryResponse:
        requirements = self.requirement_service.list_requirements()
        rows = [self._build_row(requirement) for requirement in requirements]
        attention_needed = self._build_attention_needed(rows)

        return DashboardSummaryResponse(
            counts=DashboardSummaryCounts(
                total_requirements=len(rows),
                draft_requirements=sum(1 for row in rows if row.status == "draft"),
                ready_requirements=sum(1 for row in rows if row.status == "ready"),
                accepted_requirements=sum(1 for row in rows if row.health == "Accepted"),
                at_risk_requirements=sum(1 for row in rows if row.health == "At Risk"),
                missing_scenarios_requirements=sum(
                    1 for row in rows if row.scenario_count == 0
                ),
                missing_tasks_requirements=sum(1 for row in rows if row.task_count == 0),
                in_progress_requirements=sum(1 for row in rows if row.health == "In Progress"),
                ready_for_review_requirements=sum(
                    1 for row in rows if row.health == "Ready for Review"
                ),
            ),
            rows=rows,
            attention_needed=attention_needed,
            recommended_actions=self._build_recommended_actions(rows),
        )

    def _build_row(self, requirement: Requirement) -> DashboardSummaryRow:
        scenarios = self.scenario_service.list_scenarios(requirement.id)
        tasks = self.task_service.list_tasks(requirement.id)
        acceptance_runs = self.acceptance_run_service.list_acceptance_runs(requirement.id)
        test_summaries = self.test_summary_service.list_test_summaries(requirement.id)

        latest_acceptance_status = acceptance_runs[0].status if acceptance_runs else "none"
        health = self._derive_health(
            scenario_count=len(scenarios),
            task_count=len(tasks),
            latest_acceptance_status=latest_acceptance_status,
        )

        return DashboardSummaryRow(
            id=requirement.id,
            title=requirement.title,
            status=requirement.status,
            scenario_count=len(scenarios),
            task_count=len(tasks),
            latest_acceptance_status=latest_acceptance_status,
            latest_test_summary_result=test_summaries[0].result if test_summaries else "none",
            health=health,
            needs_attention=health in {"At Risk", "Needs Definition"},
            updated_at=requirement.updated_at,
        )

    def _derive_health(
        self,
        *,
        scenario_count: int,
        task_count: int,
        latest_acceptance_status: str,
    ) -> str:
        if latest_acceptance_status == "passed":
            return "Accepted"
        if latest_acceptance_status in {"failed", "blocked"}:
            return "At Risk"
        if scenario_count == 0:
            return "Needs Definition"
        if task_count == 0:
            return "At Risk"
        if latest_acceptance_status in {"in_review", "pending"}:
            return "Ready for Review"
        return "In Progress"

    def _build_attention_needed(self, rows: list[DashboardSummaryRow]) -> list[DashboardAttentionItem]:
        urgent_rows = [row for row in rows if row.needs_attention]
        urgent_rows.sort(key=self._attention_sort_key)
        return [
            DashboardAttentionItem(
                id=row.id,
                title=row.title,
                health=row.health,
                summary=self._build_attention_summary(row),
            )
            for row in urgent_rows[:5]
        ]

    def _attention_sort_key(self, row: DashboardSummaryRow) -> tuple[int, int, int]:
        return (
            0 if row.latest_acceptance_status in {"failed", "blocked"} else 1,
            0 if row.scenario_count == 0 else 1,
            0 if row.task_count == 0 else 1,
        )

    def _build_attention_summary(self, row: DashboardSummaryRow) -> str:
        parts: list[str] = []
        if row.scenario_count == 0:
            parts.append("Missing scenarios")
        if row.task_count == 0:
            parts.append("Missing tasks")
        if row.latest_acceptance_status in {"failed", "blocked"}:
            parts.append(f"Acceptance is {row.latest_acceptance_status}")
        return ". ".join(parts) + "." if parts else "Follow-up required."

    def _build_recommended_actions(self, rows: list[DashboardSummaryRow]) -> list[DashboardRecommendedAction]:
        missing_definition_count = sum(1 for row in rows if row.health == "Needs Definition")
        at_risk_count = sum(1 for row in rows if row.health == "At Risk")
        accepted_count = sum(1 for row in rows if row.health == "Accepted")
        return [
            DashboardRecommendedAction(
                owner="Business Owner",
                summary=(
                    f"Review {missing_definition_count} requirement(s) with missing scenarios to tighten user flows and acceptance intent."
                    if missing_definition_count > 0
                    else "Scenario coverage is present across current requirements; focus on refining acceptance intent where needed."
                ),
            ),
            DashboardRecommendedAction(
                owner="Delivery Lead",
                summary=(
                    f"Prioritize the {at_risk_count} at-risk requirement(s) before pulling more scope into delivery."
                    if at_risk_count > 0
                    else "No at-risk requirements are currently flagged by the dashboard."
                ),
            ),
            DashboardRecommendedAction(
                owner="QA / Release",
                summary=(
                    f"Use the {accepted_count} accepted requirement(s) as the shortlist for demo readiness, rollout planning, and stakeholder updates."
                    if accepted_count > 0
                    else "No requirements are accepted yet; keep validation focus on release-critical scope."
                ),
            ),
        ]
