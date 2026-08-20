import asyncio
from concurrent.futures import ThreadPoolExecutor
import inspect
from threading import Barrier, Event, Lock
from typing import Any

from httpx import ASGITransport, AsyncClient, Response
import pytest

from app.routes import auth as auth_routes
from app.main import app
from app.services import auth as auth_service
from app.services.auth import DEMO_USERS, InMemoryLoginAttemptLimiter, LoginRateLimitExceeded, login_attempt_limiter, public_user


DEMO_CREDENTIALS = {
    "GOVT_OFFICER": ("officer@aaptirakshak.demo", "Officer@123"),
    "ASHA_WORKER": ("asha@aaptirakshak.demo", "Asha@123"),
    "WATER_WORKER": ("water@aaptirakshak.demo", "Water@123"),
}


@pytest.fixture(autouse=True)
def reset_login_attempt_limiter():
    login_attempt_limiter.clear()
    yield
    login_attempt_limiter.clear()


def request(method: str, path: str, token: str | None = None, **kwargs: Any) -> Response:
    async def make_request() -> Response:
        transport = ASGITransport(app=app)
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.request(method, path, headers=headers, **kwargs)

    return asyncio.run(make_request())


def login(role: str) -> tuple[str, dict[str, Any]]:
    email, password = DEMO_CREDENTIALS[role]
    response = request("POST", "/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    payload = response.json()
    assert payload["user"]["role"] == role
    assert "password" not in payload["user"]
    assert "password_hash" not in payload["user"]
    return payload["access_token"], payload["user"]


def health_payload(village_id: str = "ASM-HLK-003") -> dict[str, Any]:
    return {
        "village_id": village_id,
        "report_date": "2026-08-20T08:00:00Z",
        "diarrhoeal_cases": 2,
        "vomiting_cases": 1,
        "fever_cases": 3,
        "suspected_acute_watery_diarrhoea_cases": 0,
        "households_visited": 25,
        "unusual_symptom_cluster": False,
        "common_water_source": "Community hand pump",
        "remarks": "Demo symptom observation only",
    }


def water_payload(village_id: str = "ASM-CCH-001") -> dict[str, Any]:
    return {
        "village_id": village_id,
        "water_source_name": "Community Well W01",
        "inspection_date": "2026-08-20T09:00:00Z",
        "source_type": "COMMUNITY_WELL",
        "ph": 7.2,
        "turbidity_ntu": 3.4,
        "residual_chlorine_mg_l": 0.2,
        "bacterial_contamination_result": "NOT_TESTED",
        "infrastructure_condition": "No visible pipeline leak; drain requires clearing",
        "remarks": "Demo field reading",
    }


def test_valid_logins_and_me() -> None:
    for role in DEMO_CREDENTIALS:
        token, user = login(role)
        response = request("GET", "/api/auth/me", token)
        assert response.status_code == 200
        assert response.json()["id"] == user["id"]
    assert request("GET", "/api/auth/me").status_code == 401
    assert request("GET", "/api/auth/me", "invalid.jwt.token").status_code == 401


def test_invalid_password_and_unknown_user() -> None:
    invalid = request("POST", "/api/auth/login", json={"email": "asha@aaptirakshak.demo", "password": "wrong"})
    unknown = request("POST", "/api/auth/login", json={"email": "nobody@example.test", "password": "wrong"})
    assert invalid.status_code == unknown.status_code == 401
    assert invalid.json() == unknown.json() == {"detail": "Invalid email or password"}


@pytest.mark.parametrize(
    ("email", "expected_hash"),
    [
        ("nobody@example.test", auth_service.DUMMY_PASSWORD_HASH),
        (DEMO_USERS[1]["email"], DEMO_USERS[1]["password_hash"]),
    ],
)
def test_invalid_authentication_performs_one_verification_against_expected_hash(
    monkeypatch, email, expected_hash
) -> None:
    verification_calls = []

    class RecordingPasswordHash:
        def verify(self, password, encoded_hash):
            verification_calls.append((password, encoded_hash))
            return False

    monkeypatch.setattr(auth_service, "password_hash", RecordingPasswordHash())
    assert auth_service.authenticate_user(email, "wrong") is None
    assert verification_calls == [("wrong", expected_hash)]


@pytest.mark.parametrize(
    "payload",
    [
        {"email": f"{'a' * 250}@test.invalid", "password": "wrong"},
        {"email": "asha@aaptirakshak.demo", "password": "x" * 129},
    ],
)
def test_oversized_credentials_are_rejected_before_authentication(monkeypatch, payload) -> None:
    def unexpected_authentication(*_args):
        raise AssertionError("Oversized credentials reached password verification")

    monkeypatch.setattr(auth_routes, "authenticate_user", unexpected_authentication)
    response = request("POST", "/api/auth/login", json=payload)
    assert response.status_code == 422


def test_repeated_failed_logins_are_temporarily_throttled(monkeypatch) -> None:
    verification_count = 0

    class RejectingPasswordHash:
        def verify(self, _password, _encoded_hash):
            nonlocal verification_count
            verification_count += 1
            return False

    monkeypatch.setattr(auth_service, "password_hash", RejectingPasswordHash())
    payload = {"email": "unknown-throttle@example.test", "password": "wrong"}
    for _ in range(5):
        assert request("POST", "/api/auth/login", json=payload).status_code == 401
    limited = request("POST", "/api/auth/login", json=payload)
    assert limited.status_code == 429
    assert int(limited.headers["Retry-After"]) >= 1
    assert verification_count == 5


def test_stale_login_identifiers_are_globally_evicted() -> None:
    now = [0.0]
    limiter = InMemoryLoginAttemptLimiter(
        failure_window_seconds=10,
        block_seconds=10,
        max_tracked_identifiers=10,
        clock=lambda: now[0],
    )
    limiter.reserve_attempt("stale-a@example.test")
    limiter.reserve_attempt("stale-b@example.test")
    assert limiter.tracked_identifier_count == 2

    now[0] = 11.0
    limiter.reserve_attempt("fresh@example.test")
    assert limiter.tracked_identifier_count == 1


def test_login_identifier_storage_never_exceeds_configured_bound() -> None:
    limiter = InMemoryLoginAttemptLimiter(max_tracked_identifiers=3, clock=lambda: 1.0)
    for index in range(20):
        limiter.reserve_attempt(f"unique-{index}@example.test")
        assert limiter.tracked_identifier_count <= 3


def test_active_login_block_survives_capacity_pressure_and_full_active_capacity() -> None:
    now = [0.0]
    limiter = InMemoryLoginAttemptLimiter(
        max_failures=2,
        failure_window_seconds=10,
        block_seconds=10,
        max_tracked_identifiers=3,
        clock=lambda: now[0],
    )
    limiter.reserve_attempt("blocked@example.test")
    limiter.reserve_attempt("blocked@example.test")

    for index in range(20):
        now[0] += 0.25
        limiter.reserve_attempt(f"unique-{index}@example.test")
        assert limiter.tracked_identifier_count <= 3

    with pytest.raises(LoginRateLimitExceeded) as blocked:
        limiter.reserve_attempt("blocked@example.test")
    assert blocked.value.retry_after == 5

    now[0] = 9.0
    with pytest.raises(LoginRateLimitExceeded) as still_blocked:
        limiter.reserve_attempt("blocked@example.test")
    assert still_blocked.value.retry_after == 1

    now[0] = 10.0
    limiter.reserve_attempt("blocked@example.test")
    assert limiter.tracked_identifier_count <= 3

    all_blocked = InMemoryLoginAttemptLimiter(
        max_failures=1,
        max_tracked_identifiers=2,
        clock=lambda: 0.0,
    )
    all_blocked.reserve_attempt("active-a@example.test")
    all_blocked.reserve_attempt("active-b@example.test")
    with pytest.raises(LoginRateLimitExceeded):
        all_blocked.reserve_attempt("declined@example.test")
    assert all_blocked.tracked_identifier_count == 2


def test_concurrent_bad_logins_reserve_before_password_verification(monkeypatch) -> None:
    worker_count = 12
    allowed_attempts = 5
    start = Barrier(worker_count)
    release_verification = Event()
    count_lock = Lock()
    verification_count = 0

    def slow_invalid_authentication(_email, _password):
        nonlocal verification_count
        with count_lock:
            verification_count += 1
            if verification_count == allowed_attempts:
                release_verification.set()
        assert release_verification.wait(timeout=5)
        return None

    monkeypatch.setattr(auth_routes, "authenticate_user", slow_invalid_authentication)
    payload = {"email": "asha@aaptirakshak.demo", "password": "wrong"}

    def concurrent_login():
        start.wait(timeout=5)
        return request("POST", "/api/auth/login", json=payload).status_code

    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        statuses = list(executor.map(lambda _index: concurrent_login(), range(worker_count)))

    assert statuses.count(401) == allowed_attempts
    assert statuses.count(429) == worker_count - allowed_attempts
    assert verification_count == allowed_attempts
    assert login_attempt_limiter.tracked_identifier_count == 1
    assert request("POST", "/api/auth/login", json=payload).status_code == 429
    assert verification_count == allowed_attempts


def test_successful_login_resets_failed_attempt_state(monkeypatch) -> None:
    demo_user = public_user(DEMO_USERS[1])

    def fast_authentication(_email, password):
        return demo_user if password == "Asha@123" else None

    monkeypatch.setattr(auth_routes, "authenticate_user", fast_authentication)
    wrong = {"email": demo_user["email"], "password": "wrong"}
    for _ in range(3):
        assert request("POST", "/api/auth/login", json=wrong).status_code == 401
    valid = request(
        "POST",
        "/api/auth/login",
        json={"email": demo_user["email"], "password": "Asha@123"},
    )
    assert valid.status_code == 200
    for _ in range(3):
        assert request("POST", "/api/auth/login", json=wrong).status_code == 401


def test_login_password_verification_is_offloaded_by_fastapi() -> None:
    assert not inspect.iscoroutinefunction(auth_routes.login)


def test_government_permissions() -> None:
    token, _ = login("GOVT_OFFICER")
    assert request("GET", "/api/dashboard/overview", token).status_code == 200
    assert request("GET", "/api/community-reports", token).status_code == 200
    assert request("PATCH", "/api/community-reports/CR-001/status", token, json={"status": "UNDER_REVIEW"}).status_code == 200
    assignment = request(
        "PATCH", "/api/tasks/TASK-001/assignment", token,
        json={"assigned_role": "WATER_WORKER", "assigned_user_id": "USR-WATER-001"},
    )
    assert assignment.status_code == 200
    health_assignment = request(
        "PATCH", "/api/tasks/TASK-002/assignment", token,
        json={"assigned_role": "ASHA_WORKER", "assigned_user_id": "USR-ASHA-001"},
    )
    assert health_assignment.status_code == 200
    assert request("GET", "/api/health-reports", token).status_code == 200
    assert request("GET", "/api/water-reports", token).status_code == 200


def test_public_citizen_boundary() -> None:
    assert request("GET", "/api/dashboard/overview").status_code == 401
    assert request("POST", "/api/health-reports", json=health_payload()).status_code == 401
    assert request("POST", "/api/water-reports", json=water_payload()).status_code == 401
    villages = request("GET", "/api/public/villages")
    assert villages.status_code == 200
    assert set(villages.json()[0]) == {"id", "name", "district", "state"}
    report = request(
        "POST", "/api/community-reports",
        data={"village_id": "TRP-DLI-013", "category": "FLOODED_AREA", "description": "Demo public report"},
    )
    assert report.status_code == 201


def test_asha_permissions_and_scope() -> None:
    token, user = login("ASHA_WORKER")
    assert request("POST", "/api/health-reports", token, json=health_payload()).status_code == 201
    own_reports = request("GET", "/api/health-reports", token)
    assert own_reports.status_code == 200
    assert all(item["submitted_by_id"] == user["id"] for item in own_reports.json())
    assert request("POST", "/api/health-reports", token, json=health_payload("ASM-CCH-001")).status_code == 403
    assert request("POST", "/api/water-reports", token, json=water_payload()).status_code == 403
    assert request("PATCH", "/api/community-reports/CR-001/status", token, json={"status": "VERIFIED_HAZARD"}).status_code == 403
    assert request("GET", "/api/dashboard/overview", token).status_code == 403
    tasks = request("GET", "/api/tasks", token).json()
    assert tasks and all(item["task_category"] == "HEALTH" for item in tasks)
    assert request("PATCH", "/api/tasks/TASK-001/status", token, json={"status": "ASSIGNED"}).status_code == 403
    assert user["assigned_village_ids"]


def test_water_worker_permissions_and_scope() -> None:
    token, user = login("WATER_WORKER")
    assert request("POST", "/api/water-reports", token, json=water_payload()).status_code == 201
    own_reports = request("GET", "/api/water-reports", token)
    assert own_reports.status_code == 200
    assert all(item["submitted_by_id"] == user["id"] for item in own_reports.json())
    assert request("POST", "/api/water-reports", token, json=water_payload("ASM-HLK-003")).status_code == 403
    assert request("POST", "/api/health-reports", token, json=health_payload()).status_code == 403
    assert request("PATCH", "/api/community-reports/CR-001/status", token, json={"status": "REJECTED"}).status_code == 403
    tasks = request("GET", "/api/tasks", token).json()
    assert tasks and all(item["task_category"] == "WATER" for item in tasks)
    assert request("PATCH", "/api/tasks/TASK-002/status", token, json={"status": "ASSIGNED"}).status_code == 403
