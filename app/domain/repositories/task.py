from app.domain.models.task import Task
from app.domain.repositories.base import RequirementScopedRepository


class TaskRepository(RequirementScopedRepository[Task]):
    model = Task
    order_column = "updated_at"
