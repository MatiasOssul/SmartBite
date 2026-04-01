from datetime import datetime
from enum import Enum
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict


class CookingSkill(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class CardBrand(str, Enum):
    visa = "visa"
    mastercard = "mastercard"
    amex = "amex"


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    avatar_url: str
    plan: Literal["free", "premium"]
    created_at: datetime


class Preferences(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    dietary_restrictions: List[str]  # e.g. ["vegan", "gluten_free"]
    allergen_exclusions: List[str]   # e.g. ["nuts", "shellfish"]
    cooking_skill: CookingSkill
    max_budget_clp: int


class PaymentMethod(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    last_four: str
    brand: CardBrand
    exp_month: int
    exp_year: int
    is_default: bool


# --- Request bodies ---

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class UpdatePreferencesRequest(BaseModel):
    dietary_restrictions: Optional[List[str]] = None
    allergen_exclusions: Optional[List[str]] = None
    cooking_skill: Optional[CookingSkill] = None
    max_budget_clp: Optional[int] = None


class AddPaymentCardRequest(BaseModel):
    last_four: str
    brand: CardBrand
    exp_month: int
    exp_year: int
    is_default: bool = False


# --- Response wrappers ---

class ProfileResponse(BaseModel):
    user: UserProfile
    preferences: Preferences
    payment_methods: List[PaymentMethod]


class UpdateProfileResponse(BaseModel):
    user: UserProfile


class UpdatePreferencesResponse(BaseModel):
    preferences: Preferences


class AddPaymentCardResponse(BaseModel):
    card: PaymentMethod
