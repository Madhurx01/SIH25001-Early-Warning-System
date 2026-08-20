# AAPTIRAKSHAK

**Community Water Health Early Warning & Response System**

A hackathon prototype for rural Northeast India that combines a protected government operations dashboard, role-specific field-worker portals, and public environmental hazard reporting. Originally developed against Smart India Hackathon problem statement SIH25001.

All villages, locations, users, scores, reports, trends, tasks, thresholds, and evidence are synthetic demonstration data. Risk values are illustrative and not medically validated predictions. Staff and community submissions do not automatically modify disease-risk scores.

## Phase 2C features

- One AAPTIRAKSHAK Staff Portal login with Argon2-hashed demo credentials and signed JWT access tokens.
- Backend-enforced roles: `GOVT_OFFICER`, `ASHA_WORKER`, and `WATER_WORKER`.
- Protected government Overview, Villages, Village Detail, Surveillance, Outlook, Community Reports, and Staff Reports routes/APIs.
- ASHA portal with assigned villages, assigned health tasks, symptom-surveillance submission, field notes, freshness reminders, and personal submission history.
- Water Operations portal with assigned villages/tasks, water tests and infrastructure inspections, explicit `NOT_TESTED` bacterial results, and personal submission history.
- Government Staff Reports view for health and water field submissions.
- Public, minimally identifying citizen hazard submission, optional photo/location evidence, report receipt, and status lookup.
- Role/category/assignee checks for task status changes and government-only task assignment.
- Runtime incident clustering and official government review states: `UNVERIFIED`, `UNDER_REVIEW`, `VERIFIED_HAZARD`, `REJECTED`, and `DUPLICATE`.

## Authentication architecture

```text
React AuthProvider
  ├─ token in browser localStorage (demo limitation)
  ├─ startup validation with GET /api/auth/me
  ├─ Bearer header on protected API calls
  └─ automatic logout and privileged-view removal on HTTP 401
                         ↓
FastAPI HTTP Bearer dependency
  ├─ signed JWT (secret/environment configured)
  ├─ current-user lookup in demo repository
  ├─ reusable role dependencies
  └─ task/report scope checks in backend services
```

Passwords and hashes are never returned by the API. The committed demo user repository contains Argon2 hashes only. When `JWT_SECRET_KEY` is absent, the backend creates a process-random fallback; configure `.env` for stable sessions across reloads.

## Demo credentials

These obvious credentials are for hackathon testing only and must not be used in production.

| Role | Email | Password |
| --- | --- | --- |
| Government Officer | `officer@aaptirakshak.demo` | `Officer@123` |
| ASHA Worker | `asha@aaptirakshak.demo` | `Asha@123` |
| Water Worker | `water@aaptirakshak.demo` | `Water@123` |

## Run locally (Windows PowerShell)

Prerequisites: Node.js 20.19+ or 22.12+, npm, Python 3.10+, and Git.

Backend terminal, from the repository root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Paste the generated value after `JWT_SECRET_KEY=` in `backend/.env`, then start the API:

```powershell
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

- Staff login: http://localhost:5173/#/login
- Public citizen report: http://localhost:5173/#/citizen-report
- Public status lookup: http://localhost:5173/#/report-status
- FastAPI docs: http://localhost:8000/docs

After login, Government is routed to `#/overview`, ASHA to `#/asha`, and Water Worker to `#/water-operations`.

Run verification:

```powershell
cd backend
python -m pytest

cd ..\frontend
npm test
npm run build

cd ..
git diff --check
```

If PowerShell blocks virtual-environment activation, use `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` for that terminal only.

## API boundary

Public:

- `GET /api/health`
- `GET /api/public/villages` (ID/name/district/state only)
- `POST /api/community-reports`
- `GET /api/community-reports/{report_id}/status`
- `POST /api/auth/login`

Authenticated staff:

- `GET /api/auth/me`
- `GET /api/staff/assigned-villages`
- `GET /api/tasks` (role/assignment filtered)
- `GET /api/tasks/{task_id}` (role/assignment checked)
- `PATCH /api/tasks/{task_id}/status` (role/category/assignment checked)

ASHA or Government:

- `GET /api/health-reports`
- `POST /api/health-reports`

Water Worker or Government:

- `GET /api/water-reports`
- `POST /api/water-reports`

Government only:

- `/api/dashboard/*`
- `/api/villages/*`
- `GET /api/community-reports`
- `GET /api/community-reports/{report_id}`
- `GET /api/community-reports/{report_id}/photo`
- `PATCH /api/community-reports/{report_id}/status`
- `PATCH /api/tasks/{task_id}/assignment`

Missing or invalid authentication returns `401`; an authenticated user without the required permission receives `403`.

## Photo handling

Citizen photos are optional. The backend accepts JPEG, PNG, WebP, and GIF content up to 5 MB, verifies MIME type and file signature, discards original filenames, generates random storage names, and serves evidence through a government-protected API route. Runtime files go to ignored `backend/runtime_uploads/`.

## Prototype limitations

- Demo users, tasks, status changes, staff reports, citizen reports, and clusters use in-memory repositories. **Demo session data resets when the backend restarts.** Uploaded runtime files are not durable records.
- Browser `localStorage` is acceptable for this hackathon prototype but a production deployment needs hardened cookie/session handling, CSRF/XSS controls, key rotation, revocation, audit logging, rate limiting, and account lifecycle management.
- There is no production database, government SSO, OTP, citizen account, durable audit trail, or staff account administration.
- There are no real IMD/CWC/IHIP/WQMIS integrations, validated ML models, medical diagnosis, comprehensive pathogen claims, notifications, or automatic risk recalculation.
- A real deployment requires privacy/retention governance, encryption, official integrations, validated thresholds/models, accessibility and security review, operational ownership, and clinical/public-health oversight.
