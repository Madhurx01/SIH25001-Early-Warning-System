from fastapi import APIRouter


router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "SIH25001 Early Warning API",
    }
