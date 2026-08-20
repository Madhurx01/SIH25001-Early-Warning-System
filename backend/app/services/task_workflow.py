"""Runtime-only verification task repository and workflow service."""

from copy import deepcopy
from threading import RLock
from typing import Any

from app.services.mock_data import DEMO_TASKS
from app.services.auth import ASHA_WORKER, GOVT_OFFICER, WATER_WORKER, get_user_by_id


TASK_STATUSES = ("OPEN", "ASSIGNED", "IN_PROGRESS", "VERIFIED", "CLOSED")
TASK_CATEGORIES = ("HEALTH", "WATER", "ENVIRONMENTAL", "GENERAL")
ALLOWED_TRANSITIONS = {
    "OPEN": {"ASSIGNED"},
    "ASSIGNED": {"OPEN", "IN_PROGRESS"},
    "IN_PROGRESS": {"ASSIGNED", "VERIFIED"},
    "VERIFIED": {"IN_PROGRESS", "CLOSED"},
    "CLOSED": set(),
}


class TaskNotFoundError(LookupError):
    pass


class InvalidTaskTransitionError(ValueError):
    pass


class InvalidTaskAssignmentError(ValueError):
    pass


class InMemoryTaskRepository:
    """Small session repository. State intentionally resets on API restart."""

    def __init__(self) -> None:
        self._tasks = {task["id"]: deepcopy(task) for task in DEMO_TASKS}
        self._lock = RLock()

    def list(self) -> list[dict[str, Any]]:
        with self._lock:
            return deepcopy(sorted(self._tasks.values(), key=lambda task: task["priority"]))

    def get(self, task_id: str) -> dict[str, Any] | None:
        with self._lock:
            task = self._tasks.get(task_id)
            return deepcopy(task) if task else None

    def save(self, task: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self._tasks[task["id"]] = deepcopy(task)
            return deepcopy(task)


repository = InMemoryTaskRepository()


def list_tasks(
    village_id: str | None = None,
    include_closed: bool = True,
) -> list[dict[str, Any]]:
    tasks = repository.list()
    if village_id:
        tasks = [task for task in tasks if task["village_id"] == village_id]
    if not include_closed:
        tasks = [task for task in tasks if task["status"] != "CLOSED"]
    return tasks


def get_task(task_id: str) -> dict[str, Any]:
    task = repository.get(task_id)
    if not task:
        raise TaskNotFoundError(task_id)
    return task


def update_task_status(task_id: str, status: str) -> dict[str, Any]:
    task = get_task(task_id)
    next_status = status.upper()
    if next_status not in TASK_STATUSES:
        raise InvalidTaskTransitionError(f"Unsupported task status: {status}")
    current = task["status"]
    if next_status != current and next_status not in ALLOWED_TRANSITIONS[current]:
        raise InvalidTaskTransitionError(f"Cannot move task from {current} to {next_status}")
    task["status"] = next_status
    task["demo_state_notice"] = "Demo session data; task state resets when the backend restarts."
    return repository.save(task)


def task_is_accessible(task: dict[str, Any], user: dict[str, Any]) -> bool:
    if user["role"] == GOVT_OFFICER:
        return True
    expected_category = "HEALTH" if user["role"] == ASHA_WORKER else "WATER" if user["role"] == WATER_WORKER else None
    return (
        expected_category is not None
        and task.get("task_category") == expected_category
        and task.get("assigned_role") == user["role"]
        and task.get("assigned_user_id") in (None, user["id"])
    )


def list_tasks_for_user(user: dict[str, Any]) -> list[dict[str, Any]]:
    return [task for task in list_tasks() if task_is_accessible(task, user)]


def assign_task(
    task_id: str,
    assigned_role: str | None,
    assigned_user_id: str | None,
) -> dict[str, Any]:
    task = get_task(task_id)
    if assigned_role is not None and assigned_role not in (ASHA_WORKER, WATER_WORKER, GOVT_OFFICER):
        raise InvalidTaskAssignmentError("Unsupported assigned role")
    if task["task_category"] == "HEALTH" and assigned_role not in (ASHA_WORKER, GOVT_OFFICER, None):
        raise InvalidTaskAssignmentError("Health tasks cannot be assigned to that role")
    if task["task_category"] == "WATER" and assigned_role not in (WATER_WORKER, GOVT_OFFICER, None):
        raise InvalidTaskAssignmentError("Water tasks cannot be assigned to that role")
    if task["task_category"] in ("ENVIRONMENTAL", "GENERAL") and assigned_role not in (GOVT_OFFICER, None):
        raise InvalidTaskAssignmentError("Environmental and general tasks require government assignment")
    if assigned_user_id is not None:
        assignee = get_user_by_id(assigned_user_id)
        if assignee is None:
            raise InvalidTaskAssignmentError("Unknown assigned user")
        if assigned_role is None or assignee["role"] != assigned_role:
            raise InvalidTaskAssignmentError("Assigned user role does not match assigned role")
    task["assigned_role"] = assigned_role
    task["assigned_user_id"] = assigned_user_id
    task["demo_state_notice"] = "Demo session data; task assignment resets when the backend restarts."
    return repository.save(task)
