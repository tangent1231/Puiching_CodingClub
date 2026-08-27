"""Admin authentication router with JWT and rate limiting."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field

from app.config import Settings, get_settings

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


class LoginIn(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=200)


class TokenOut(BaseModel):
    access_token: str
    token_type: str


class AdminOut(BaseModel):
    username: str


class _RateLimitBucket:
    """Simple in-memory sliding-window rate limiter keyed by IP."""

    def __init__(self, limit: int, window_seconds: int) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._requests: dict[str, list[datetime]] = {}

    def is_allowed(self, key: str) -> bool:
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(seconds=self.window_seconds)
        timestamps = self._requests.get(key, [])
        timestamps = [ts for ts in timestamps if ts > cutoff]
        allowed = len(timestamps) < self.limit
        if allowed:
            timestamps.append(now)
        self._requests[key] = timestamps
        return allowed


_bucket: _RateLimitBucket | None = None


def _get_bucket(settings: Settings = Depends(get_settings)) -> _RateLimitBucket:
    global _bucket
    if _bucket is None:
        _bucket = _RateLimitBucket(
            settings.login_rate_limit,
            settings.login_rate_limit_window_seconds,
        )
    return _bucket


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_access_token(data: dict[str, Any], settings: Settings) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm
    )


def _get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    settings: Settings = Depends(get_settings),
) -> AdminOut:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        username: str = payload.get("sub")
        if username != settings.admin_username:
            raise JWTError
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    return AdminOut(username=username)


@router.post("/login", response_model=TokenOut)
async def login(
    request: Request,
    payload: LoginIn,
    settings: Settings = Depends(get_settings),
    bucket: _RateLimitBucket = Depends(_get_bucket),
):
    client_ip = _get_client_ip(request)
    if not bucket.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="登入嘗試次數過多，請稍後再試",
        )

    if not settings.admin_password_hash:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="後台尚未配置管理員帳號",
        )

    if payload.username != settings.admin_username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="帳號或密碼錯誤",
        )

    if not _verify_password(payload.password, settings.admin_password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="帳號或密碼錯誤",
        )

    access_token = _create_access_token({"sub": settings.admin_username}, settings)
    return TokenOut(access_token=access_token, token_type="bearer")


@router.post("/refresh", response_model=TokenOut)
async def refresh_token(admin: AdminOut = Depends(_get_current_admin)):
    settings = get_settings()
    access_token = _create_access_token({"sub": admin.username}, settings)
    return TokenOut(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=AdminOut)
async def get_me(admin: AdminOut = Depends(_get_current_admin)):
    return admin
