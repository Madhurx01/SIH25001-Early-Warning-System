from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.services.mock_data import get_village, get_villages


router = APIRouter(prefix="/api/villages", tags=["villages"])


@router.get("")
async def list_villages(
    alert_level: str | None = Query(default=None, pattern="^(?i:normal|preparedness|high)$"),
    district: str | None = None,
    needs_verification: bool | None = None,
) -> list[dict[str, Any]]:
    return get_villages(alert_level, district, needs_verification)


@router.get("/{village_id}")
async def village_detail(village_id: str) -> dict[str, Any]:
    village = get_village(village_id)
    if village is None:
        raise HTTPException(status_code=404, detail="Village not found")
    return village
