from sqlmodel import Session

from app.api.schemas.tasks import TaskCreate, TaskUpdate
from app.domain.models.task import Task
from app.domain.repositories.task import TaskRepository
from app.domain.services.requirement import RequirementService
from app.domain.services.scenario import ScenarioNotFoundError, ScenarioService


class TaskNotFoundError(Exception):
    """Raised when a task cannot be found."""


class TaskService:
    def __init__(self, session: Session):
        self.repository = TaskRepository(session)
        self.requirement_service = RequirementService(session)
        self.scenario_service = ScenarioService(session)

    def list_tasks(self, requirement_id: int) -> list[Task]:
        self.requirement_service.get_requirement(requirement_id)
        return self.repository.list_by_requirement(requirement_id)

    def get_task(self, task_id: int) -> Task:
        task = self.repository.get(task_id)
        if task is None:
            raise TaskNotFoundError(f"Task {task_id} not found")
        return task

    def create_task(self, requirement_id: int, payload: TaskCreate) -> Task:
        self.requirement_service.get_requirement(requirement_id)

        if payload.scenario_id is not None:
            scenario = self.scenario_service.get_scenario(payload.scenario_id)
            if scenario.requirement_id != requirement_id:
                raise ValueError("Scenario does not belong to the given requirement")

        task = Task(requirement_id=requirement_id, **payload.model_dump())
        return self.repository.create(task)

    def update_task(self, task_id: int, payload: TaskUpdate) -> Task:
        task = self.get_task(task_id)
        update_data = payload.model_dump(exclude_unset=True)

        scenario_id = update_data.get("scenario_id")
        if scenario_id is not None:
            scenario = self.scenario_service.get_scenario(scenario_id)
            if scenario.requirement_id != task.requirement_id:
                raise ValueError("Scenario does not belong to the task requirement")

        return self.repository.update(task, update_data)

    def delete_task(self, task_id: int) -> None:
        task = self.get_task(task_id)
        self.repository.delete(task)
