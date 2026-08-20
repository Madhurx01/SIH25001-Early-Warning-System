from datetime import datetime
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.services.auth import ASHA_WORKER, GOVT_OFFICER, WATER_WORKER, get_current_user, require_roles
from app.services.staff_reports import (
    InvalidStaffReportError,
    assigned_villages,
    create_health_report,
    create_water_report,
    list_health_reports,
    list_water_reports,
)


router = APIRouter(prefix="/api", tags=["staff field reports"])


class HealthReportInput(BaseModel):
    village_id: str
    report_date: datetime
    diarrhoeal_cases: int = Field(ge=0, le=10000)
    vomiting_cases: int = Field(ge=0, le=10000)
    fever_cases: int = Field(ge=0, le=10000)
    suspected_acute_watery_diarrhoea_cases: int = Field(ge=0, le=10000)
    households_visited: int = Field(ge=0, le=100000)
    unusual_symptom_cluster: bool
    common_water_source: str | None = Field(default=None, max_length=200)
    remarks: str | None = Field(default=None, max_length=1000)
    field_evidence_note: str | None = Field(default=None, max_length=500)


class WaterReportInput(BaseModel):
    village_id: str
    water_source_name: str = Field(min_length=1, max_length=200)
    inspection_date: datetime
    source_type: str = Field(min_length=1, max_length=100)
    ph: float | None = Field(default=None, ge=0, le=14)
    turbidity_ntu: float | None = Field(default=None, ge=0, le=10000)
    residual_chlorine_mg_l: float | None = Field(default=None, ge=0, le=100)
    bacterial_contamination_result: Literal["POSITIVE", "NEGATIVE", "NOT_TESTED"]
    infrastructure_condition: str = Field(min_length=1, max_length=500)
    remarks: str | None = Field(default=None, max_length=1000)
    field_evidence_note: str | None = Field(default=None, max_length=500)


@router.get("/staff/assigned-villages")
async def get_assigned_villages(user: dict[str, Any] = Depends(get_current_user)) -> list[dict[str, str]]:
    return assigned_villages(user)


@router.post("/health-reports", status_code=201)
async def submit_health_report(
    report: HealthReportInput,
    user: dict[str, Any] = Depends(require_roles(ASHA_WORKER, GOVT_OFFICER)),
) -> dict[str, Any]:
    try:
        return create_health_report(report.model_dump(), user)
    except InvalidStaffReportError as error:
        raise HTTPException(status_code=403 if "scope" in str(error) else 422, detail=str(error)) from error


@router.get("/health-reports")
async def get_health_reports(
    user: dict[str, Any] = Depends(require_roles(ASHA_WORKER, GOVT_OFFICER)),
) -> list[dict[str, Any]]:
    return list_health_reports(user)


@router.post("/water-reports", status_code=201)
async def submit_water_report(
    report: WaterReportInput,
    user: dict[str, Any] = Depends(require_roles(WATER_WORKER, GOVT_OFFICER)),
) -> dict[str, Any]:
    try:
        return create_water_report(report.model_dump(), user)
    except InvalidStaffReportError as error:
        raise HTTPException(status_code=403 if "scope" in str(error) else 422, detail=str(error)) from error


@router.get("/water-reports")
async def get_water_reports(
    user: dict[str, Any] = Depends(require_roles(WATER_WORKER, GOVT_OFFICER)),
) -> list[dict[str, Any]]:
    return list_water_reports(user)
