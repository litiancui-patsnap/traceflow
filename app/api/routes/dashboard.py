from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.schemas.dashboard import DashboardSummaryResponse
from app.core.database import get_session
from app.domain.services.acceptance_run import AcceptanceRunService
from app.domain.services.dashboard import DashboardService
from app.domain.services.requirement import RequirementService
from app.domain.services.scenario import ScenarioService
from app.domain.services.task import TaskService
from app.domain.services.test_summary import TestSummaryService

router = APIRouter(prefix="/dashboard")


def get_dashboard_service(session: Session = Depends(get_session)) -> DashboardService:
    return DashboardService(
        requirement_service=RequirementService(session),
        scenario_service=ScenarioService(session),
        task_service=TaskService(session),
        acceptance_run_service=AcceptanceRunService(session),
        test_summary_service=TestSummaryService(session),
    )


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardSummaryResponse:
    return service.get_summary()
