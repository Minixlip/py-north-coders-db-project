import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv
from fastapi import HTTPException


load_dotenv(Path(__file__).resolve().parents[1] / ".env")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


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
