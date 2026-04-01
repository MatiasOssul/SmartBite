import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from core.database import get_db
from models.user_model import PreferencesDB, UserDB
from schemas.auth_schemas import (
    AuthResponse,
    LoginRequest,
    PasswordResetRequest,
    RegisterRequest,
    User,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

_DEMO_TOKEN = "demo-token"


@router.post("/register", response_model=AuthResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    if db.query(UserDB).filter(UserDB.email == body.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user_id = f"usr_{uuid.uuid4().hex}"
    user_db = UserDB(
        id=user_id,
        email=body.email,
        hashed_password=body.password,  # texto plano — hash en Fase 7
        name=body.name,
        plan="free",
        created_at=datetime.now(timezone.utc),
    )
    prefs_db = PreferencesDB(
        user_id=user_id,
        dietary_restrictions=[],
        allergen_exclusions=[],
        cooking_skill="intermediate",
        max_budget_clp=15000,
    )
    try:
        db.add(user_db)
        db.add(prefs_db)
        db.commit()
        db.refresh(user_db)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al crear el usuario") from exc

    return AuthResponse(token=_DEMO_TOKEN, user=User.model_validate(user_db))


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user_db = db.query(UserDB).filter(UserDB.email == body.email).first()
    if not user_db or user_db.hashed_password != body.password:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    return AuthResponse(token=_DEMO_TOKEN, user=User.model_validate(user_db))


@router.post("/logout", status_code=204)
def logout() -> Response:
    return Response(status_code=204)


@router.post("/reset", status_code=200)
def request_password_reset(body: PasswordResetRequest) -> dict:
    return {}
