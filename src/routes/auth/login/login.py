from fastapi import APIRouter, Response

from src.controller.auth.login import check_login
from src.controller.auth.register import create_user
from src.security import create_access_token
from src.types.auth.login import LoginRequest, LoginResponse
from src.types.auth.register import RegisterRequest, RegisterResponse


router = APIRouter(prefix="/api/auth")


@router.post("/login", response_model=LoginResponse, status_code=200)
def login(user: LoginRequest, response: Response):
    user_id = check_login(user)
    access_token = create_access_token(user_id)
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(user: RegisterRequest):
    return {"user": create_user(user)}
