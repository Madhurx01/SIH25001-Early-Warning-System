from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.community_reports import router as community_reports_router
from app.routes.dashboard import router as dashboard_router
from app.routes.health import router as health_router
from app.routes.tasks import router as tasks_router
from app.routes.villages import router as villages_router


app = FastAPI(
    title="SIH25001 Early Warning API",
    description="Synthetic monitoring API for the SIH25001 early warning system.",
    version="0.2.1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(dashboard_router)
app.include_router(villages_router)
app.include_router(tasks_router)
app.include_router(community_reports_router)
