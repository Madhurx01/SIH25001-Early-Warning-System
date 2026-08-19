# SIH25001 Backend

Modular FastAPI service for the SIH25001 Early Warning System. Phase 2A preserves the original health check and adds synthetic dashboard, village, forecast, verification-task, and government-side community-report endpoints.

All Phase 2A domain data is explicitly synthetic. Scores and freshness rules are prototype placeholders, not validated medical thresholds or real government observations. The service layer is intentionally separate from the routes so a real dataset and ML source can replace the mocks later without changing the frontend contract.

## Local setup

From this directory in PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Run tests with:

```powershell
python -m pytest
```

## Endpoints

- `GET /api/health`
- `GET /api/dashboard/overview`
- `GET /api/dashboard/forecast`
- `GET /api/dashboard/rainfall-disease-trend`
- `GET /api/villages`
- `GET /api/villages/{village_id}`
- `GET /api/tasks`
- `GET /api/community-reports`

Village list filters: `alert_level`, `district`, and `needs_verification`.

Interactive API documentation is available at http://localhost:8000/docs.

Community-report rows represent simple synthetic incident clusters. They are unverified evidence inputs and never change disease risk directly. Dengue and malaria are vector-borne diseases; stagnant-water reports indicate only a potential environmental or mosquito-breeding hazard requiring official verification.
