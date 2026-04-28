from datetime import datetime, timezone

from sqlmodel import Session, select

from app.domain.models.task import Task


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TaskRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_by_requirement(self, requirement_id: int) -> list[Task]:
        statement = (
            select(Task)
            .where(Task.requirement_id == requirement_id)
            .order_by(Task.updated_at.desc())
        )
        return list(self.session.exec(statement))

    def get(self, task_id: int) -> Task | None:
        return self.session.get(Task, task_id)

    def create(self, task: Task) -> Task:
        self.session.add(task)
        self.session.commit()
        self.session.refresh(task)
        return task

    def update(self, task: Task, data: dict[str, object]) -> Task:
        for key, value in data.items():
            setattr(task, key, value)

        task.updated_at = utc_now()
        self.session.add(task)
        self.session.commit()
        self.session.refresh(task)
        return task

    def delete(self, task: Task) -> None:
        self.session.delete(task)
        self.session.commit()
