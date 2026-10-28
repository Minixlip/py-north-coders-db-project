from datetime import datetime

from pydantic import BaseModel, Field, SecretStr


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=1, max_length=255)
    password: SecretStr = Field(min_length=1)


class RegisteredUser(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime


class RegisterResponse(BaseModel):
    user: RegisteredUser
