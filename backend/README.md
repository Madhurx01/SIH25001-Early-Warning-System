# AAPTIRAKSHAK API

FastAPI backend for the Community Water Health Early Warning & Response System prototype. HTTP routes call authentication, workflow, and repository services so demo session storage can later be replaced without changing the API boundary.

## Setup

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Paste the generated value into `JWT_SECRET_KEY` in `.env`, then run:

```powershell
python -m uvicorn app.main:app --reload
```

Interactive docs: http://localhost:8000/docs

Tests:

```powershell
python -m pytest
```

## Security boundary

Passwords are stored as Argon2 hashes. Successful login issues a short-lived signed JWT. Reusable FastAPI dependencies provide current-user and role checks; task services additionally enforce category, assigned role, and assigned user. Missing/invalid tokens return `401`, while authenticated but forbidden requests return `403`.

See the repository README for endpoint permissions, demo credentials, and complete local run instructions.

## Demo persistence

All users, tasks, staff reports, community reports, clustering, and review state use demo repositories. The bounded in-memory login-attempt limiter evicts stale identifiers and applies a temporary cooldown after repeated failures; its state resets when the backend restarts. This prototype has no production account lifecycle, token revocation, durable storage, or audit log.
