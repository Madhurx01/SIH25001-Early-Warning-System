from typing import Any

from fastapi import APIRouter

from app.services.community_reports import get_community_reports


router = APIRouter(prefix="/api", tags=["community reports"])


@router.get("/community-reports")
async def list_community_reports() -> list[dict[str, Any]]:
    """Return synthetic, government-visible community incident clusters."""
    return get_community_reports()
