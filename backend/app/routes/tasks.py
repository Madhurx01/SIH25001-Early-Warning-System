from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.task_workflow import (
    InvalidTaskAssignmentError,
    InvalidTaskTransitionError,
    TaskNotFoundError,
    assign_task,
    get_task,
    list_tasks_for_user,
    task_is_accessible,
    update_task_status,
)
from app.services.auth import GOVT_OFFICER, get_current_user, require_roles


router = APIRouter(prefix="/api", tags=["verification tasks"])


@router.get("/tasks")
async def list_tasks(user: dict[str, Any] = Depends(get_current_user)) -> list[dict[str, Any]]:
    return list_tasks_for_user(user)


class TaskStatusUpdate(BaseModel):
    status: str


class TaskAssignmentUpdate(BaseModel):
    assigned_role: str | None = None
    assigned_user_id: str | None = None


@router.get("/tasks/{task_id}")
async def task_detail(task_id: str, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    try:
        task = get_task(task_id)
        if not task_is_accessible(task, user):
            raise HTTPException(status_code=403, detail="Task is outside the user's permitted assignment")
        return task
    except TaskNotFoundError as error:
        raise HTTPException(status_code=404, detail="Task not found") from error


@router.patch("/tasks/{task_id}/status")
async def patch_task_status(
    task_id: str,
    update: TaskStatusUpdate,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    try:
        task = get_task(task_id)
        if not task_is_accessible(task, user):
            raise HTTPException(status_code=403, detail="Task is outside the user's permitted assignment")
        return update_task_status(task_id, update.status)
    except TaskNotFoundError as error:
        raise HTTPException(status_code=404, detail="Task not found") from error
    except InvalidTaskTransitionError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.patch("/tasks/{task_id}/assignment")
async def patch_task_assignment(
    task_id: str,
    update: TaskAssignmentUpdate,
    _: dict[str, Any] = Depends(require_roles(GOVT_OFFICER)),
) -> dict[str, Any]:
    try:
        return assign_task(task_id, update.assigned_role, update.assigned_user_id)
    except TaskNotFoundError as error:
        raise HTTPException(status_code=404, detail="Task not found") from error
    except InvalidTaskAssignmentError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
