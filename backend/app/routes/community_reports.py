from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.services.community_reports import (
    MAX_IMAGE_BYTES,
    InvalidImageError,
    InvalidReportError,
    ReportNotFoundError,
    get_community_report,
    get_community_reports,
    get_photo,
    get_public_status,
    submit_report,
    update_report_status,
    validate_report_fields,
    validate_and_store_image,
)
from app.services.auth import GOVT_OFFICER, require_roles


router = APIRouter(prefix="/api", tags=["community reports"])


class CommunityStatusUpdate(BaseModel):
    status: str


@router.get("/community-reports")
async def list_community_reports(
    _: dict[str, Any] = Depends(require_roles(GOVT_OFFICER)),
) -> list[dict[str, Any]]:
    return get_community_reports()


@router.post("/community-reports", status_code=201)
async def create_community_report(
    village_id: str = Form(...),
    category: str = Form(...),
    description: str | None = Form(default=None, max_length=500),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    photo: UploadFile | None = File(default=None),
) -> dict[str, Any]:
    image = None
    try:
        # Validate the report envelope before an optional upload reaches disk.
        validate_report_fields(village_id, category, latitude, longitude)
        if photo is not None:
            content = await photo.read(MAX_IMAGE_BYTES + 1)
            image = validate_and_store_image(content, photo.content_type)
        return submit_report(village_id, category, description, latitude, longitude, image)
    except (InvalidReportError, InvalidImageError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    finally:
        if photo is not None:
            await photo.close()


@router.get("/community-reports/{report_id}/status")
async def community_report_status(report_id: str) -> dict[str, Any]:
    try:
        return get_public_status(report_id)
    except ReportNotFoundError as error:
        raise HTTPException(status_code=404, detail="Community report not found") from error


@router.get("/community-reports/{report_id}/photo")
async def community_report_photo(
    report_id: str,
    _: dict[str, Any] = Depends(require_roles(GOVT_OFFICER)),
) -> FileResponse:
    try:
        path, content_type = get_photo(report_id)
        return FileResponse(path, media_type=content_type, filename=f"community-evidence{path.suffix}")
    except ReportNotFoundError as error:
        raise HTTPException(status_code=404, detail="Photo evidence not found") from error


@router.get("/community-reports/{report_id}")
async def community_report_detail(
    report_id: str,
    _: dict[str, Any] = Depends(require_roles(GOVT_OFFICER)),
) -> dict[str, Any]:
    try:
        return get_community_report(report_id)
    except ReportNotFoundError as error:
        raise HTTPException(status_code=404, detail="Community report not found") from error


@router.patch("/community-reports/{report_id}/status")
async def patch_community_report_status(
    report_id: str,
    update: CommunityStatusUpdate,
    _: dict[str, Any] = Depends(require_roles(GOVT_OFFICER)),
) -> dict[str, Any]:
    try:
        return update_report_status(report_id, update.status)
    except ReportNotFoundError as error:
        raise HTTPException(status_code=404, detail="Community report not found") from error
    except InvalidReportError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
