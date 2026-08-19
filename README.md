# SIH25001 Early Warning System

Smart Community Health Monitoring and Early Warning System for Water-Borne Diseases in Rural Northeast India.

## Project objective

This project will provide a community-focused platform for monitoring health and environmental signals that may support earlier detection of water-borne disease outbreaks in rural Northeast India.

**Current development status:** Phase 2A — Government Monitoring Dashboard + Community Signals follow-up

Phase 2A adds the first operational government monitoring dashboard on top of the Phase 1 React/FastAPI foundation. It presents village risk, assessment confidence, evidence freshness, field-verification priorities, a four-week preparedness outlook, and government-side review of synthetic community environmental hazard reports through reusable REST API contracts.

> **Demo / Synthetic Data:** All village records, scores, signals, tasks, and forecast values in this phase are synthetic. No ML model is integrated yet. Risk values and freshness thresholds are illustrative placeholders, not clinically or epidemiologically validated rules and not real government data. Later phases will replace the backend mock source with real datasets and model outputs while preserving the frontend API contracts.

## Technology stack

- Frontend: React, Vite, JavaScript, Tailwind CSS
- Backend: Python, FastAPI, Uvicorn
- Testing: Pytest and HTTPX ASGI transport

## Folder structure

```text
SIH25001-Early-Warning-System/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── main.py
│   ├── tests/
│   ├── README.md
│   └── requirements.txt
├── .gitignore
└── README.md
```

## Windows setup

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- Python 3.10+
- Git

### Run the frontend

Open PowerShell in the repository root:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

The frontend uses `VITE_API_BASE_URL` from `frontend/.env` to contact the backend. The example value is configured for the local FastAPI server.

### Create and activate a backend virtual environment

Open a second PowerShell window in the repository root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If `py` is unavailable but `python` is installed, use `python -m venv .venv` instead.

If PowerShell blocks activation for the current process, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

### Install and run the backend

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Run backend tests from the `backend` directory:

```powershell
python -m pytest
```

## Local URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- FastAPI docs: http://localhost:8000/docs
- Health API: http://localhost:8000/api/health

## Phase 2A dashboard

The responsive overview page provides:

- totals for monitored, normal, preparedness, high-risk, verification-required, and stale-water-test villages;
- a risk-sorted priority village table that keeps risk and confidence separate;
- water-data freshness categories using explicit prototype rules;
- a field-verification queue that explains which missing evidence would improve an assessment;
- Community Signals metrics and clustered incident reports for government review;
- a 10-week synthetic rainfall-versus-reported-cases trend visualization;
- a synthetic four-week preparedness outlook with a clear non-confirmation disclaimer;
- stable loading, error, and backend-unavailable states;
- navigable Phase 2B placeholders for Villages, Surveillance, and the expanded Outlook view.

## API endpoints

All endpoints return JSON. Phase 2A monitoring responses are marked with `data_source: "synthetic"`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Preserved Phase 1 backend health check |
| `GET` | `/api/dashboard/overview` | Derived dashboard summary counts |
| `GET` | `/api/dashboard/forecast` | Synthetic four-week preparedness outlook and drivers |
| `GET` | `/api/dashboard/rainfall-disease-trend` | Synthetic weekly rainfall and reported disease-case trend |
| `GET` | `/api/villages` | Risk-sorted village summaries |
| `GET` | `/api/villages/{village_id}` | One village detail record; unknown IDs return `404` |
| `GET` | `/api/tasks` | Read-only synthetic field-verification priorities |
| `GET` | `/api/community-reports` | Synthetic clustered community environmental hazard reports |

`GET /api/villages` accepts optional `alert_level`, `district`, and `needs_verification` query parameters. For example:

```text
/api/villages?alert_level=HIGH&needs_verification=true
```

## Community Environmental Hazard Reporting / Community Signals

The government dashboard can review synthetic community observations of stagnant water, flooded areas, sewage overflow, suspected dirty water sources, broken pipelines, garbage near water sources, and possible mosquito-breeding sites. Multiple nearby submissions about the same illustrative locality and hazard are represented as one incident with a `report_count_nearby` value. This is simple demo clustering; advanced GPS clustering and image similarity are not implemented.

Community reports are additional evidence for the verification workflow. A high-priority cluster can create an inspection task, but an unverified report does **not** automatically change a village risk score, confirm contamination, or confirm disease.

> **Important domain distinction:** Dengue and malaria are vector-borne diseases, not water-borne diseases. Stagnant water or a suspected breeding-site report identifies only a potential mosquito-breeding/environmental hazard that requires official verification. It is not proof of dengue, malaria, or any other disease.

### Future citizen interface — Phase 2B

A later citizen-facing workflow is planned to include:

- photo capture/upload;
- issue category selection;
- automatic GPS capture;
- optional description;
- submission status;
- duplicate detection;
- moderation and official verification.

This follow-up implements government-side synthetic monitoring only. It does not include citizen authentication, permanent photo storage, cloud uploads, computer vision, or notification delivery.

## Rainfall and reported disease trend

The overview includes a combined weekly rainfall bar chart and reported diarrhoeal/water-borne disease case line for ten synthetic weeks. The offset between illustrative peaks is provided only to demonstrate the type of relationship that later analysis may investigate. It does not establish causation or a medically validated rainfall-to-disease lag.

Future real environmental and health datasets will be used to estimate rainfall-to-disease lag statistically.

## Verification

From `backend`:

```powershell
python -m pytest
```

From `frontend`:

```powershell
npm run build
```

## Scope notes

Phase 2A does not include real outbreak prediction, authentication, a database, GIS, external government/IoT integrations, production citizen submissions, alert delivery, field-input workflows, medicine-stock prediction, medical recommendations, or automated public alerts. These remain later-phase work.
