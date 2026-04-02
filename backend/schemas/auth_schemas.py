from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str  # e.g. "usr_01jdemo..."
    email: str
    name: str
    plan: Literal["free", "premium"]
    created_at: datetime


class AuthResponse(BaseModel):
    token: str  # JWT Bearer
    user: User


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class PasswordResetRequest(BaseModel):
    email: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ChangePasswordResponse(BaseModel):
    message: str
