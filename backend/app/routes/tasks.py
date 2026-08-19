from typing import Any

from fastapi import APIRouter

from app.services.mock_data import get_tasks


router = APIRouter(prefix="/api", tags=["verification tasks"])


@router.get("/tasks")
async def list_tasks() -> list[dict[str, Any]]:
    return get_tasks()
