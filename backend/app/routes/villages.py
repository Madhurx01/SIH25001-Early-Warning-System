from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from app.services.community_reports import get_community_reports
from app.services.mock_data import get_villages
from app.services.task_workflow import list_tasks
from app.services.village_operations import get_operational_village, get_village_trend
from app.services.auth import GOVT_OFFICER, require_roles


router = APIRouter(
    prefix="/api/villages",
    tags=["villages"],
    dependencies=[Depends(require_roles(GOVT_OFFICER))],
)
public_router = APIRouter(prefix="/api/public", tags=["public"])


@public_router.get("/villages")
async def public_villages() -> list[dict[str, str]]:
    """Privacy-minimal village choices for the public citizen report form."""
    return [
        {"id": item["id"], "name": item["name"], "district": item["district"], "state": item["state"]}
        for item in get_villages()
    ]


@router.get("")
async def list_villages(
    alert_level: str | None = Query(default=None, pattern="^(?i:normal|preparedness|high)$"),
    district: str | None = None,
    needs_verification: bool | None = None,
) -> list[dict[str, Any]]:
    return get_villages(alert_level, district, needs_verification)


@router.get("/{village_id}")
async def village_detail(village_id: str) -> dict[str, Any]:
    village = get_operational_village(village_id)
    if village is None:
        raise HTTPException(status_code=404, detail="Village not found")
    return village


@router.get("/{village_id}/trend")
async def village_trend(village_id: str) -> dict[str, Any]:
    trend = get_village_trend(village_id)
    if trend is None:
        raise HTTPException(status_code=404, detail="Village not found")
    return trend


@router.get("/{village_id}/community-reports")
async def village_community_reports(village_id: str) -> list[dict[str, Any]]:
    if get_operational_village(village_id) is None:
        raise HTTPException(status_code=404, detail="Village not found")
    return get_community_reports(village_id)


@router.get("/{village_id}/tasks")
async def village_tasks(village_id: str) -> list[dict[str, Any]]:
    if get_operational_village(village_id) is None:
        raise HTTPException(status_code=404, detail="Village not found")
    return list_tasks(village_id, include_closed=False)
