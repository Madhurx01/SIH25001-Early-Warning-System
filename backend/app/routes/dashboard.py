from typing import Any

from fastapi import APIRouter

from app.services.mock_data import get_forecast, get_overview, get_rainfall_disease_trend


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview")
async def dashboard_overview() -> dict[str, int | str]:
    return get_overview()


@router.get("/forecast")
async def dashboard_forecast() -> dict[str, Any]:
    return get_forecast()


@router.get("/rainfall-disease-trend")
async def rainfall_disease_trend() -> dict[str, Any]:
    return get_rainfall_disease_trend()
