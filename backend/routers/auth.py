import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from core.database import get_db
from core.deps import get_current_user
from core.security import create_access_token, hash_password, verify_password
from models.user_model import PasswordResetCodeDB, PreferencesDB, UserDB
from schemas.auth_schemas import (
    AuthResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    LoginRequest,
    PasswordResetRequest,
    RegisterRequest,
    User,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    if db.query(UserDB).filter(UserDB.email == body.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user_id = f"usr_{uuid.uuid4().hex}"
    user_db = UserDB(
        id=user_id,
        email=body.email,
        hashed_password=hash_password(body.password),
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

    token = create_access_token({"sub": user_db.id})
    return AuthResponse(token=token, user=User.model_validate(user_db))


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user_db = db.query(UserDB).filter(UserDB.email == body.email).first()
    if not user_db or not verify_password(body.password, user_db.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_access_token({"sub": user_db.id})
    return AuthResponse(token=token, user=User.model_validate(user_db))


@router.post("/logout", status_code=204)
def logout() -> Response:
    return Response(status_code=204)


@router.post("/reset", status_code=200)
def request_password_reset(body: PasswordResetRequest) -> dict:
    # En producción: enviar email con el código. Por ahora retorna vacío.
    return {}


@router.put("/change-password", response_model=ChangePasswordResponse)
def change_password(
    body: ChangePasswordRequest,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChangePasswordResponse:
    """
    Cambia la contraseña del usuario autenticado.

    Flujo actual: verifica contraseña actual → cambia directamente.
    Flujo futuro con email: generar código → enviar email → confirmar con POST /confirm-reset.
    En ambos casos se persiste un registro en `password_reset_codes` como auditoría.
    """
    # 1. Verificar contraseña actual
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    # 2. Validar nueva contraseña (mínimo 6 caracteres)
    if len(body.new_password) < 6:
        raise HTTPException(status_code=422, detail="La nueva contraseña debe tener al menos 6 caracteres")

    # 3. Registrar código de auditoría (hash del token, nunca en texto plano)
    #    Cuando se implemente email: guardar used=False y enviar el código al usuario.
    #    Luego agregar endpoint POST /confirm-reset para consumir el código.
    raw_code = secrets.token_urlsafe(32)
    code_record = PasswordResetCodeDB(
        id=f"prc_{uuid.uuid4().hex}",
        user_id=current_user.id,
        code_hash=hash_password(raw_code),   # nunca guardamos texto plano
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        used=True,   # cambiado a False cuando implementemos el flujo email
        notes="direct_change",  # distinguir del flujo email en el futuro
    )

    # 4. Actualizar contraseña
    current_user.hashed_password = hash_password(body.new_password)

    try:
        db.add(code_record)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar la contraseña") from exc

    return ChangePasswordResponse(message="Contraseña actualizada correctamente")
