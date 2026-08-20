from typing import Any

from fastapi import APIRouter, Depends

from app.services.mock_data import get_forecast, get_overview, get_rainfall_disease_trend
from app.services.auth import GOVT_OFFICER, require_roles


router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
    dependencies=[Depends(require_roles(GOVT_OFFICER))],
)


@router.get("/overview")
async def dashboard_overview() -> dict[str, int | str]:
    return get_overview()


@router.get("/forecast")
async def dashboard_forecast() -> dict[str, Any]:
    return get_forecast()


@router.get("/rainfall-disease-trend")
async def rainfall_disease_trend() -> dict[str, Any]:
    return get_rainfall_disease_trend()
