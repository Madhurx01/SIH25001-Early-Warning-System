from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.services.auth import (
    LoginRateLimitExceeded,
    authenticate_user,
    create_access_token,
    get_current_user,
    login_attempt_identifier,
    login_attempt_limiter,
)


router = APIRouter(prefix="/api/auth", tags=["authentication"])


class LoginRequest(BaseModel):
    email: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=128)


@router.post("/login")
def login(credentials: LoginRequest) -> dict[str, Any]:
    identifier = login_attempt_identifier(credentials.email)
    try:
        login_attempt_limiter.reserve_attempt(identifier)
    except LoginRateLimitExceeded as error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Try again later.",
            headers={"Retry-After": str(error.retry_after)},
        ) from error

    user = authenticate_user(credentials.email, credentials.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    login_attempt_limiter.record_success(identifier)
    return {"access_token": create_access_token(user), "token_type": "bearer", "user": user}


@router.get("/me")
async def current_user(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return user
