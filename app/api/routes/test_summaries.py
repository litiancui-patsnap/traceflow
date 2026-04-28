from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.schemas.test_summaries import TestSummaryCreate, TestSummaryRead
from app.core.database import get_session
from app.domain.services.requirement import RequirementNotFoundError
from app.domain.services.test_summary import InvalidTestSummaryError, TestSummaryService

router = APIRouter()


def get_test_summary_service(session: Session = Depends(get_session)) -> TestSummaryService:
    return TestSummaryService(session)


@router.get("/requirements/{requirement_id}/test-summaries", response_model=list[TestSummaryRead])
def list_test_summaries(
    requirement_id: int,
    service: TestSummaryService = Depends(get_test_summary_service),
) -> list[TestSummaryRead]:
    try:
        return service.list_test_summaries(requirement_id)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post(
    "/requirements/{requirement_id}/test-summaries",
    response_model=TestSummaryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_test_summary(
    requirement_id: int,
    payload: TestSummaryCreate,
    service: TestSummaryService = Depends(get_test_summary_service),
) -> TestSummaryRead:
    try:
        return service.create_test_summary(requirement_id, payload)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidTestSummaryError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
