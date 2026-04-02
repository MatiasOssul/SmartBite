from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class IngredientUnit(str, Enum):
    g = "g"
    kg = "kg"
    ml = "ml"
    l = "l"
    units = "units"
    tbsp = "tbsp"
    tsp = "tsp"
    cups = "cups"
    slices = "slices"
    pieces = "pieces"
    cloves = "cloves"
    pinch = "pinch"
    oz = "oz"
    lb = "lb"


class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class Ingredient(BaseModel):
    id: str
    name: str
    amount: float
    unit: IngredientUnit


class NutritionalInfo(BaseModel):
    calories_kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float


class Recipe(BaseModel):
    id: str  # e.g. "rec_01jdemo..."
    title: str
    description: str
    image_url: str
    prep_time_minutes: int
    difficulty: Difficulty
    cost_clp: int  # precio estimado en pesos chilenos
    match_score: int  # 0–100, afinidad con las preferencias del usuario
    tags: List[str]
    ingredients: List[Ingredient]
    instructions: List[str]  # pasos ordenados en español
    nutritional_info: NutritionalInfo
    is_favorite: bool
    created_at: datetime


# --- Request bodies ---

class GenerateRecipeRequest(BaseModel):
    prompt: Optional[str] = None
    filters: List[str] = []


# --- Response wrappers (espejo exacto de lo que consume el frontend) ---

class GenerateRecipeResponse(BaseModel):
    recipes: List[Recipe]


class RecipeHistoryResponse(BaseModel):
    items: List[Recipe]
    total: int
    page: int


class SingleRecipeResponse(BaseModel):
    recipe: Recipe


class ValidatePromptRequest(BaseModel):
    prompt: str


class ValidatePromptResponse(BaseModel):
    is_valid: bool
    reason: Optional[str] = None
