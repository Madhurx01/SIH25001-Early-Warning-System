from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.community_reports import router as community_reports_router
from app.routes.auth import router as auth_router
from app.routes.dashboard import router as dashboard_router
from app.routes.health import router as health_router
from app.routes.tasks import router as tasks_router
from app.routes.staff_reports import router as staff_reports_router
from app.routes.villages import router as villages_router
from app.routes.villages import public_router as public_villages_router

ALLOWED_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://aaptirakshak.vercel.app",
)


app = FastAPI(
    title="AAPTIRAKSHAK API",
    description="Community Water Health Early Warning & Response System demo API.",
    version="0.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(public_villages_router)
app.include_router(dashboard_router)
app.include_router(villages_router)
app.include_router(tasks_router)
app.include_router(community_reports_router)
app.include_router(staff_reports_router)
