# SIH25001 Backend

Modular FastAPI foundation for the SIH25001 Early Warning System. This phase exposes only a health endpoint; ML and domain services will be added in later phases.

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

The health endpoint is available at http://localhost:8000/api/health.
