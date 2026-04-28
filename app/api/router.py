from fastapi import APIRouter

from app.api.routes.acceptance_runs import router as acceptance_runs_router
from app.api.routes.ai import router as ai_router
from app.api.routes.github_links import router as github_links_router
from app.api.routes.health import router as health_router
from app.api.routes.requirements import router as requirements_router
from app.api.routes.scenarios import router as scenarios_router
from app.api.routes.test_summaries import router as test_summaries_router
from app.api.routes.tasks import router as tasks_router

api_router = APIRouter()
api_router.include_router(acceptance_runs_router, tags=["acceptance-runs"])
api_router.include_router(ai_router, tags=["ai"])
api_router.include_router(github_links_router, tags=["github-links"])
api_router.include_router(health_router, tags=["health"])
api_router.include_router(requirements_router, prefix="/requirements", tags=["requirements"])
api_router.include_router(scenarios_router, tags=["scenarios"])
api_router.include_router(test_summaries_router, tags=["test-summaries"])
api_router.include_router(tasks_router, tags=["tasks"])
