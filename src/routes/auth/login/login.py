from fastapi import APIRouter, Response

from src.controller.auth.login import check_login
from src.security import create_access_token
from src.types.auth.login import LoginRequest, LoginResponse


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse, status_code=200)
def login(user: LoginRequest, response: Response):
    user_id = check_login(user)
    access_token = create_access_token(user_id)
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
    return {"access_token": access_token, "token_type": "bearer"}
