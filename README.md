# SIH25001 Early Warning System

Smart Community Health Monitoring and Early Warning System prototype for rural Northeast India.

**Current status:** Phase 2B — Interactive Surveillance & Citizen Reporting.

All village locations, scores, evidence, trends, tasks, thresholds, and seeded reports are synthetic demonstration data. No ML model is integrated. Risk scores are illustrative outbreak-concern values, not medically validated predictions. Community reports—whether unverified or verified—never directly modify current risk classifications.

## Phase 2B features

- Searchable/filterable/sortable village directory with a React-Leaflet/OpenStreetMap demo map and an accessible list fallback.
- Village operational detail with separate risk and confidence, prioritization drivers, freshness states, village trend, community signals, and tasks.
- Runtime verification workflow: `OPEN → ASSIGNED → IN_PROGRESS → VERIFIED → CLOSED`.
- Government incident review with `UNVERIFIED`, `UNDER_REVIEW`, `VERIFIED_HAZARD`, `REJECTED`, and `DUPLICATE` states.
- Mobile-first citizen form with optional photo capture/preview, permission-based geolocation, manual village fallback, submission receipt, and report-status lookup.
- Four-week preparedness page and closed-loop workflow explanation with future model integration clearly separated.
- Stable loading, error, offline/API-unavailable, keyboard, form-label, and non-colour-only status behavior.

Dengue and malaria are vector-borne diseases. Standing water is represented only as a potential mosquito-breeding/environmental hazard requiring verification; citizen photos are not analyzed or used for diagnosis.

## Architecture

```text
React + Vite + Tailwind + React-Leaflet
                ↓ REST
             FastAPI
                ↓
     service / repository layer
                ↓
 synthetic seeds + runtime-only demo state
```

No production database, authentication, OTP, external government integration, medical diagnosis, computer vision, notification service, or real ML model is included.

## Run locally (Windows PowerShell)

Prerequisites: Node.js 20.19+ or 22.12+, npm, Python 3.10+, and Git.

Backend terminal, from the repository root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Frontend terminal, from the repository root:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open:

- Government dashboard: http://localhost:5173/#/overview
- Villages: http://localhost:5173/#/villages
- Citizen report: http://localhost:5173/#/citizen-report
- FastAPI docs: http://localhost:8000/docs

Run verification:

```powershell
cd backend
python -m pytest

cd ..\frontend
npm run build

cd ..
git diff --check
```

If PowerShell blocks virtual-environment activation, use `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` for that terminal only.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Service health |
| `GET` | `/api/dashboard/overview` | Existing overview totals |
| `GET` | `/api/dashboard/forecast` | Four-week preparedness outlook |
| `GET` | `/api/dashboard/rainfall-disease-trend` | Existing synthetic trend |
| `GET` | `/api/villages` | Village summaries and optional filters |
| `GET` | `/api/villages/{village_id}` | Enriched operational detail |
| `GET` | `/api/villages/{village_id}/trend` | Village-specific synthetic trend |
| `GET` | `/api/villages/{village_id}/community-reports` | Village incident clusters |
| `GET` | `/api/villages/{village_id}/tasks` | Village verification tasks |
| `GET` | `/api/tasks` | Verification task list |
| `GET` | `/api/tasks/{task_id}` | Task detail |
| `PATCH` | `/api/tasks/{task_id}/status` | Validated workflow transition |
| `GET` | `/api/community-reports` | Government incident list |
| `GET` | `/api/community-reports/{report_id}` | Incident/report detail |
| `POST` | `/api/community-reports` | Multipart citizen submission |
| `PATCH` | `/api/community-reports/{report_id}/status` | Government review state |
| `GET` | `/api/community-reports/{report_id}/status` | Privacy-minimal citizen lookup |
| `GET` | `/api/community-reports/{report_id}/photo` | Stored evidence via safe API route |

`GET /api/villages` preserves the Phase 2A `alert_level`, `district`, and `needs_verification` filters. Existing Phase 2A endpoints remain compatible; additions are additive.

## Photo handling

Citizen photos are optional. The backend accepts JPEG, PNG, WebP, and GIF content up to 5 MB, checks both MIME type and a file signature, discards the original filename, generates a random storage name, and serves evidence through an API route without exposing filesystem paths. Files go to ignored `backend/runtime_uploads/`. This is hackathon-only local storage and is not suitable for production privacy, retention, or access-control requirements.

## Demo clustering and persistence

A new report joins an incident when it has the same village and category, is within 24 hours, and—when both reports provide coordinates—is within 500 metres using Haversine distance. These are demonstration rules, not scientifically validated thresholds. The government list represents incident clusters so duplicate submissions are not presented as separate physical hazards.

Tasks, report statuses, clusters, and citizen submissions live in process memory and reset whenever the backend restarts. Uploaded files are runtime artifacts and are not committed; orphan/retention cleanup would be required for production.

## Deployment limitations

A real government/public-health deployment requires authentication and authorization, consent and privacy controls, encryption and retention policies, durable production storage, audit logs, official datasets/APIs, validated models and thresholds, operational ownership, and security review. Community evidence may become an input only to a future governed evidence/model cycle; it does not directly change risk here.
