"""Demo-only staff identity repository and signed access-token service."""

from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from math import ceil
import os
import secrets
from threading import Lock
from time import monotonic
from typing import Any, Callable

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from pwdlib import PasswordHash


load_dotenv()

GOVT_OFFICER = "GOVT_OFFICER"
ASHA_WORKER = "ASHA_WORKER"
WATER_WORKER = "WATER_WORKER"
STAFF_ROLES = (GOVT_OFFICER, ASHA_WORKER, WATER_WORKER)

# A process-random fallback keeps source free of secrets. Set JWT_SECRET_KEY in
# backend/.env for stable local sessions across reloads.
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or secrets.token_urlsafe(48)
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)

# Precomputed once so unknown accounts take the same Argon2 verification path.
DUMMY_PASSWORD_HASH = "$argon2id$v=19$m=65536,t=3,p=4$+L7+PyUbz6gJVOHivBUCCw$P6Cx4xkEOQc67eKRMyCq2pGhuAwtTxTEf5VuB4dP4Ww"

LOGIN_MAX_FAILURES = 5
LOGIN_FAILURE_WINDOW_SECONDS = 60
LOGIN_BLOCK_SECONDS = 60
LOGIN_MAX_TRACKED_IDENTIFIERS = 1000


class LoginRateLimitExceeded(Exception):
    def __init__(self, retry_after: int) -> None:
        super().__init__("Too many failed login attempts")
        self.retry_after = retry_after


@dataclass
class _LoginAttemptState:
    failures: deque[float] = field(default_factory=deque)
    blocked_until: float = 0.0
    last_touched: float = 0.0


class InMemoryLoginAttemptLimiter:
    """Temporary prototype throttling; all attempt state resets on process restart."""

    def __init__(
        self,
        max_failures: int = LOGIN_MAX_FAILURES,
        failure_window_seconds: int = LOGIN_FAILURE_WINDOW_SECONDS,
        block_seconds: int = LOGIN_BLOCK_SECONDS,
        max_tracked_identifiers: int = LOGIN_MAX_TRACKED_IDENTIFIERS,
        clock: Callable[[], float] = monotonic,
    ) -> None:
        self.max_failures = max_failures
        self.failure_window_seconds = failure_window_seconds
        self.block_seconds = block_seconds
        self.max_tracked_identifiers = max_tracked_identifiers
        self._clock = clock
        self._attempts: dict[str, _LoginAttemptState] = {}
        self._lock = Lock()

    def _prune(self, state: _LoginAttemptState, now: float) -> None:
        cutoff = now - self.failure_window_seconds
        while state.failures and state.failures[0] <= cutoff:
            state.failures.popleft()

    def _cleanup(self, now: float) -> None:
        for identifier, state in list(self._attempts.items()):
            self._prune(state, now)
            block_expired = state.blocked_until and state.blocked_until <= now
            if block_expired or (not state.blocked_until and not state.failures):
                self._attempts.pop(identifier, None)
        overflow = len(self._attempts) - self.max_tracked_identifiers
        if overflow > 0:
            oldest = sorted(
                (key for key, state in self._attempts.items() if state.blocked_until <= now),
                key=lambda key: (self._attempts[key].last_touched, key),
            )
            for identifier in oldest[:overflow]:
                self._attempts.pop(identifier, None)

    def reserve_attempt(self, identifier: str) -> None:
        now = self._clock()
        with self._lock:
            self._cleanup(now)
            state = self._attempts.get(identifier)
            if state is not None and state.blocked_until > now:
                raise LoginRateLimitExceeded(max(1, ceil(state.blocked_until - now)))
            if state is None:
                if len(self._attempts) >= self.max_tracked_identifiers:
                    oldest = min(
                        (
                            key
                            for key, candidate in self._attempts.items()
                            if candidate.blocked_until <= now
                        ),
                        key=lambda key: (self._attempts[key].last_touched, key),
                        default=None,
                    )
                    if oldest is None:
                        retry_after = min(
                            max(1, ceil(candidate.blocked_until - now))
                            for candidate in self._attempts.values()
                        )
                        raise LoginRateLimitExceeded(retry_after)
                    self._attempts.pop(oldest, None)
                state = self._attempts.setdefault(identifier, _LoginAttemptState())
            state.failures.append(now)
            state.last_touched = now
            if len(state.failures) >= self.max_failures:
                state.blocked_until = now + self.block_seconds

    def record_success(self, identifier: str) -> None:
        with self._lock:
            self._cleanup(self._clock())
            self._attempts.pop(identifier, None)

    @property
    def tracked_identifier_count(self) -> int:
        with self._lock:
            return len(self._attempts)

    def clear(self) -> None:
        with self._lock:
            self._attempts.clear()


login_attempt_limiter = InMemoryLoginAttemptLimiter()


# DEMO ONLY. These are Argon2 hashes, never plaintext credential records.
# The corresponding obvious demo passwords are documented for hackathon use.
DEMO_USERS: tuple[dict[str, Any], ...] = (
    {
        "id": "USR-GOV-001",
        "name": "Ananya Sharma",
        "email": "officer@aaptirakshak.demo",
        "role": GOVT_OFFICER,
        "assigned_village_ids": [],
        "password_hash": "$argon2id$v=19$m=65536,t=3,p=4$mfp5wwAX5ghBT+dqmwm3qw$WuL5FhMxLrNF5nlfFb45Nk/LLl125Ipq6H8Nv8uRm2c",
    },
    {
        "id": "USR-ASHA-001",
        "name": "Mina Das",
        "email": "asha@aaptirakshak.demo",
        "role": ASHA_WORKER,
        "assigned_village_ids": ["ASM-HLK-003", "ASM-HLK-004", "MNP-UKL-009"],
        "password_hash": "$argon2id$v=19$m=65536,t=3,p=4$xr0UE9V/FCNqnjDQKTnbUA$md4D7tdpE0QbwKCYnRYZ1t+b5mrCQkqoHJRX3H07OqU",
    },
    {
        "id": "USR-WATER-001",
        "name": "Ravi Debbarma",
        "email": "water@aaptirakshak.demo",
        "role": WATER_WORKER,
        "assigned_village_ids": ["ASM-CCH-001", "ASM-KRG-005", "MNP-IMP-007"],
        "password_hash": "$argon2id$v=19$m=65536,t=3,p=4$jEnliR9mi+J4XIgb8OUgHg$A9FnoB7Z8Pc3a1PBgD+fQSwC3++mdQyMTT6oQZJjo1Q",
    },
)


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in user.items() if key != "password_hash"}


def authenticate_user(email: str, password: str) -> dict[str, Any] | None:
    normalized = email.strip().casefold()
    user = next((item for item in DEMO_USERS if item["email"].casefold() == normalized), None)
    verification_hash = user["password_hash"] if user is not None else DUMMY_PASSWORD_HASH
    password_is_valid = password_hash.verify(password, verification_hash)
    if user is None or not password_is_valid:
        return None
    return public_user(user)


def login_attempt_identifier(email: str) -> str:
    return email.strip().casefold()


def create_access_token(user: dict[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user["id"],
        "role": user["role"],
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def _user_by_id(user_id: str) -> dict[str, Any] | None:
    user = next((item for item in DEMO_USERS if item["id"] == user_id), None)
    return public_user(user) if user else None


def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    return _user_by_id(user_id)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or credentials.scheme.casefold() != "bearer":
        raise unauthorized
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except InvalidTokenError as error:
        raise unauthorized from error
    user = _user_by_id(user_id) if isinstance(user_id, str) else None
    if user is None:
        raise unauthorized
    return user


def require_roles(*roles: str):
    async def dependency(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        if user["role"] not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return dependency
