from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.task_workflow import (
    InvalidTaskTransitionError,
    TaskNotFoundError,
    get_task,
    list_tasks as get_tasks,
    update_task_status,
)


router = APIRouter(prefix="/api", tags=["verification tasks"])


@router.get("/tasks")
async def list_tasks() -> list[dict[str, Any]]:
    return get_tasks()


class TaskStatusUpdate(BaseModel):
    status: str


@router.get("/tasks/{task_id}")
async def task_detail(task_id: str) -> dict[str, Any]:
    try:
        return get_task(task_id)
    except TaskNotFoundError as error:
        raise HTTPException(status_code=404, detail="Task not found") from error


@router.patch("/tasks/{task_id}/status")
async def patch_task_status(task_id: str, update: TaskStatusUpdate) -> dict[str, Any]:
    try:
        return update_task_status(task_id, update.status)
    except TaskNotFoundError as error:
        raise HTTPException(status_code=404, detail="Task not found") from error
    except InvalidTaskTransitionError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
