from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from core.database import get_db
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


@router.get("/", response_model=ProfileResponse)
def get_profile(db: Session = Depends(get_db)) -> ProfileResponse:
    user_db = db.query(UserDB).first()
    if not user_db:
        raise HTTPException(status_code=404, detail="No hay usuarios en la base de datos")

    user = UserProfile.model_validate(
        user_db, update={"avatar_url": user_db.avatar_url or ""}
    )
    preferences = (
        Preferences.model_validate(user_db.preferences)
        if user_db.preferences
        else _DEFAULT_PREFERENCES
    )
    payment_methods = [PaymentMethod.model_validate(c) for c in user_db.payment_methods]

    return ProfileResponse(user=user, preferences=preferences, payment_methods=payment_methods)


@router.put("/", response_model=UpdateProfileResponse)
def update_profile(body: UpdateProfileRequest) -> UpdateProfileResponse:
    # Mock — conectar a DB en una fase posterior
    updates = body.model_dump(exclude_none=True)
    placeholder = UserProfile(
        id="mock",
        email="mock@example.com",
        name=updates.get("name", "Usuario"),
        avatar_url=updates.get("avatar_url", ""),
        plan="free",
        created_at=datetime.now(timezone.utc),
    )
    return UpdateProfileResponse(user=placeholder)


@router.put("/preferences", response_model=UpdatePreferencesResponse)
def update_preferences(body: UpdatePreferencesRequest) -> UpdatePreferencesResponse:
    # Mock — conectar a DB en una fase posterior
    updates = body.model_dump(exclude_none=True)
    updated_prefs = _DEFAULT_PREFERENCES.model_copy(update=updates)
    return UpdatePreferencesResponse(preferences=updated_prefs)


@router.post("/cards", response_model=AddPaymentCardResponse, status_code=201)
def add_payment_card(body: AddPaymentCardRequest) -> AddPaymentCardResponse:
    # Mock — conectar a DB en una fase posterior
    card = PaymentMethod(
        id=f"pm_{int(datetime.now(tz=timezone.utc).timestamp())}",
        **body.model_dump(),
    )
    return AddPaymentCardResponse(card=card)


@router.delete("/cards/{card_id}", status_code=204)
def delete_payment_card(card_id: str) -> Response:
    return Response(status_code=204)
