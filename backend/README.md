# SIH25001 Backend

FastAPI backend for Phase 2B Interactive Surveillance & Citizen Reporting. Routes call service/repository modules so synthetic sources, session state, and later production integrations remain separate from HTTP contracts.

## Setup

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Tests:

```powershell
python -m pytest
```

Interactive docs: http://localhost:8000/docs

## Endpoints

- `GET /api/health`
- `GET /api/dashboard/overview`
- `GET /api/dashboard/forecast`
- `GET /api/dashboard/rainfall-disease-trend`
- `GET /api/villages`
- `GET /api/villages/{village_id}`
- `GET /api/villages/{village_id}/trend`
- `GET /api/villages/{village_id}/community-reports`
- `GET /api/villages/{village_id}/tasks`
- `GET /api/tasks`
- `GET /api/tasks/{task_id}`
- `PATCH /api/tasks/{task_id}/status`
- `GET /api/community-reports`
- `GET /api/community-reports/{report_id}`
- `POST /api/community-reports`
- `PATCH /api/community-reports/{report_id}/status`
- `GET /api/community-reports/{report_id}/status`
- `GET /api/community-reports/{report_id}/photo`

The POST endpoint uses `multipart/form-data`: `village_id`, `category`, optional `description`, optional `latitude`/`longitude`, and optional `photo`.

## Prototype rules

- Task transitions: `OPEN → ASSIGNED → IN_PROGRESS → VERIFIED → CLOSED`; limited backward correction is supported before closure.
- Community statuses: `UNVERIFIED`, `UNDER_REVIEW`, `VERIFIED_HAZARD`, `REJECTED`, `DUPLICATE`.
- Clustering: same village/category, within 24 hours, and within 500 m when coordinates are available.
- Photos: JPEG/PNG/WebP/GIF, maximum 5 MB, signature checked, randomly named under ignored `backend/runtime_uploads/`, delivered through an API route.
- All workflow and report repository state is in memory and resets on backend restart.

All data and thresholds are synthetic/demo. No ML model or medical diagnosis is implemented. Review status never directly changes village disease risk. Real deployment requires authentication, privacy controls, durable protected storage, auditability, official integrations, and validated public-health governance.
