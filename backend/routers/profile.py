import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

AVATARS_DIR = Path(__file__).parent.parent / "static" / "avatars"
AVATARS_DIR.mkdir(parents=True, exist_ok=True)

_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
_MAX_BYTES = 2 * 1024 * 1024  # 2 MB

from core.database import get_db
from core.deps import get_current_user
from models.user_model import PaymentMethodDB, PreferencesDB, UserDB
from schemas.profile_schemas import (
    AddPaymentCardRequest,
    AddPaymentCardResponse,
    CookingSkill,
    PaymentMethod,
    Preferences,
    ProfileResponse,
    UpdatePreferencesRequest,
    UpdatePreferencesResponse,
    UpdateProfileRequest,
    UpdateProfileResponse,
    UserProfile,
)

router = APIRouter(prefix="/api/profile", tags=["Profile"])

_DEFAULT_PREFERENCES = Preferences(
    dietary_restrictions=[],
    allergen_exclusions=[],
    cooking_skill=CookingSkill.intermediate,
    max_budget_clp=15000,
)


@router.get("", response_model=ProfileResponse)
def get_profile(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    user = UserProfile.model_validate(current_user)
    preferences = (
        Preferences.model_validate(current_user.preferences)
        if current_user.preferences
        else _DEFAULT_PREFERENCES
    )
    payment_methods = [PaymentMethod.model_validate(c) for c in current_user.payment_methods]

    return ProfileResponse(user=user, preferences=preferences, payment_methods=payment_methods)


@router.put("", response_model=UpdateProfileResponse)
def update_profile(
    body: UpdateProfileRequest,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UpdateProfileResponse:
    updates = body.model_dump(exclude_none=True)
    for field, value in updates.items():
        setattr(current_user, field, value)
    try:
        db.commit()
        db.refresh(current_user)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar el perfil") from exc

    return UpdateProfileResponse(user=UserProfile.model_validate(current_user))


@router.put("/preferences", response_model=UpdatePreferencesResponse)
def update_preferences(
    body: UpdatePreferencesRequest,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UpdatePreferencesResponse:
    prefs_db = current_user.preferences
    if prefs_db is None:
        prefs_db = PreferencesDB(
            user_id=current_user.id,
            dietary_restrictions=[],
            allergen_exclusions=[],
            cooking_skill="intermediate",
            max_budget_clp=15000,
        )
        db.add(prefs_db)

    updates = body.model_dump(exclude_none=True)
    for field, value in updates.items():
        # cooking_skill comes as CookingSkill enum, store as str value
        setattr(prefs_db, field, value.value if hasattr(value, "value") else value)

    try:
        db.commit()
        db.refresh(prefs_db)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar preferencias") from exc

    return UpdatePreferencesResponse(preferences=Preferences.model_validate(prefs_db))


@router.post("/cards", response_model=AddPaymentCardResponse, status_code=201)
def add_payment_card(
    body: AddPaymentCardRequest,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AddPaymentCardResponse:
    card_id = f"pm_{uuid.uuid4().hex[:16]}"
    card_db = PaymentMethodDB(
        id=card_id,
        user_id=current_user.id,
        last_four=body.last_four,
        brand=body.brand.value,
        exp_month=body.exp_month,
        exp_year=body.exp_year,
        is_default=body.is_default,
    )

    # Si la nueva tarjeta es predeterminada, desmarcar el resto
    if body.is_default:
        db.query(PaymentMethodDB).filter(
            PaymentMethodDB.user_id == current_user.id
        ).update({"is_default": False})

    try:
        db.add(card_db)
        db.commit()
        db.refresh(card_db)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al agregar tarjeta") from exc

    return AddPaymentCardResponse(card=PaymentMethod.model_validate(card_db))


@router.delete("/cards/{card_id}", status_code=204)
def delete_payment_card(
    card_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    card = db.query(PaymentMethodDB).filter(
        PaymentMethodDB.id == card_id,
        PaymentMethodDB.user_id == current_user.id,  # seguridad: solo el dueño
    ).first()

    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    db.delete(card)
    db.commit()
    return Response(status_code=204)


@router.post("/avatar", status_code=200)
async def upload_avatar(
    file: UploadFile,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Formato no permitido. Usa JPG, PNG, GIF o WebP.")

    contents = await file.read()
    if len(contents) > _MAX_BYTES:
        raise HTTPException(status_code=400, detail="El archivo supera el límite de 2 MB.")

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    filename = f"{current_user.id}.{ext}"
    dest = AVATARS_DIR / filename
    dest.write_bytes(contents)

    avatar_url = f"/api/static/avatars/{filename}"
    current_user.avatar_url = avatar_url
    db.commit()

    return {"avatar_url": avatar_url}
