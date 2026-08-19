# SIH25001 Early Warning System

Smart Community Health Monitoring and Early Warning System for Water-Borne Diseases in Rural Northeast India.

## Project objective

This project will provide a community-focused platform for monitoring health and environmental signals that may support earlier detection of water-borne disease outbreaks in rural Northeast India.

**Current development status:** Phase 1 — Project Foundation

Phase 1 establishes a clean React frontend and a modular FastAPI backend. Dashboard development is planned for Phase 2. Synthetic dataset integration and ML model integration will be added in later phases.

## Technology stack

- Frontend: React, Vite, JavaScript, Tailwind CSS
- Backend: Python, FastAPI, Uvicorn
- Testing: Pytest and HTTPX ASGI transport

## Folder structure

```text
SIH25001-Early-Warning-System/
├── frontend/
│   ├── src/
│   │   ├── assets/
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

## Scope notes

The Phase 1 foundation intentionally does not include a production dashboard, authentication, a database, maps, disease or risk prediction logic, medical thresholds, synthetic data, or an ML model.
