import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


load_dotenv(Path(__file__).resolve().parents[1] / ".env")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(user_id: int) -> str:
    secret_key = os.getenv("JWT_SECRET_KEY", "")
    if len(secret_key.encode("utf-8")) < 32:
        raise HTTPException(
            status_code=503, detail="Authentication is not configured."
        )

    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user_id),
            "iat": now,
            "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        },
        secret_key,
        algorithm=JWT_ALGORITHM,
    )


def check_access_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> int:
    unauthorized = HTTPException(
        status_code=401,
        detail="Invalid or missing access token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    secret_key = os.getenv("JWT_SECRET_KEY", "")
    if len(secret_key.encode("utf-8")) < 32:
        raise HTTPException(status_code=503, detail="Authentication is not configured.")

    try:
        payload = jwt.decode(
            credentials.credentials,
            secret_key,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "exp"]},
        )
        user_id = int(payload["sub"])
        if user_id <= 0:
            raise ValueError
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise unauthorized from None

    return user_id
