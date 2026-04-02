import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import cast, String
from fastapi.responses import Response
from sqlalchemy.orm import Session

from core.database import get_db
from core.deps import get_current_user
from core.llm import generate_recipes_from_llm, validate_prompt
from models.recipe_model import RecipeDB
from models.user_model import UserDB
from schemas.recipe_schemas import (
    Difficulty,
    GenerateRecipeRequest,
    GenerateRecipeResponse,
    Ingredient,
    IngredientUnit,
    NutritionalInfo,
    Recipe,
    RecipeHistoryResponse,
    SingleRecipeResponse,
    ValidatePromptRequest,
    ValidatePromptResponse,
)

router = APIRouter(prefix="/api/recipes", tags=["Recipes"])

_DEFAULT_PREFS = {
    "dietary_restrictions": [],
    "allergen_exclusions": [],
    "cooking_skill": "intermediate",
    "max_budget_clp": 15000,
}


def _db_recipe_to_schema(r: RecipeDB) -> Recipe:
    """Converts a RecipeDB ORM object to the Recipe Pydantic schema."""
    ingredients = [
        Ingredient(
            id=ing.get("id", f"ing_{i}"),
            name=ing["name"],
            amount=ing["amount"],
            unit=IngredientUnit(ing["unit"]),
        )
        for i, ing in enumerate(r.ingredients or [])
    ]
    nutritional_info_data = r.nutritional_info or {}
    nutritional_info = NutritionalInfo(
        calories_kcal=nutritional_info_data.get("calories_kcal", 0),
        protein_g=nutritional_info_data.get("protein_g", 0),
        carbs_g=nutritional_info_data.get("carbs_g", 0),
        fat_g=nutritional_info_data.get("fat_g", 0),
        fiber_g=nutritional_info_data.get("fiber_g", 0),
    )
    return Recipe(
        id=r.id,
        title=r.title,
        description=r.description,
        image_url=r.image_url,
        prep_time_minutes=r.prep_time_minutes,
        difficulty=Difficulty(r.difficulty),
        cost_clp=r.cost_clp,
        match_score=r.match_score,
        tags=r.tags or [],
        ingredients=ingredients,
        instructions=r.instructions or [],
        nutritional_info=nutritional_info,
        is_favorite=r.is_favorite,
        created_at=r.created_at,
    )


def _llm_dict_to_recipe_db(raw: dict, user_id: str, now: datetime) -> RecipeDB:
    """
    Converts a raw LLM recipe dict into a RecipeDB ORM instance ready for insertion.
    IDs are always generated server-side to guarantee uniqueness.
    """
    recipe_id = f"rec_{uuid.uuid4().hex}"

    ingredients = []
    for i, ing in enumerate(raw.get("ingredients") or []):
        ingredients.append({
            "id": f"ing_{uuid.uuid4().hex[:8]}",
            "name": ing.get("name", f"Ingrediente {i+1}"),
            "amount": float(ing.get("amount", 0)),
            "unit": ing.get("unit", "g"),
        })

    ni = raw.get("nutritional_info") or {}

    # Validate difficulty — default to "easy" if the LLM returns something unexpected
    raw_diff = str(raw.get("difficulty", "easy")).lower()
    difficulty = raw_diff if raw_diff in {"easy", "medium", "hard"} else "easy"

    return RecipeDB(
        id=recipe_id,
        user_id=user_id,
        title=raw.get("title", "Receta sin nombre"),
        description=raw.get("description", ""),
        image_url=raw.get("image_url", ""),
        prep_time_minutes=int(raw.get("prep_time_minutes", 30)),
        difficulty=difficulty,
        cost_clp=int(raw.get("cost_clp", 0)),
        match_score=int(raw.get("match_score", 80)),
        tags=raw.get("tags") or [],
        ingredients=ingredients,
        instructions=raw.get("instructions") or [],
        nutritional_info={
            "calories_kcal": float(ni.get("calories_kcal", 0)),
            "protein_g": float(ni.get("protein_g", 0)),
            "carbs_g": float(ni.get("carbs_g", 0)),
            "fat_g": float(ni.get("fat_g", 0)),
            "fiber_g": float(ni.get("fiber_g", 0)),
        },
        is_favorite=False,
        created_at=now,
    )


@router.post("/validate", response_model=ValidatePromptResponse)
def validate_recipe_prompt(
    body: ValidatePromptRequest,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ValidatePromptResponse:
    """Valida si el prompt del usuario es apropiado para un asistente de recetas."""
    if not body.prompt.strip():
        return ValidatePromptResponse(is_valid=False, reason="Escribe algo antes de generar recetas.")

    try:
        result = validate_prompt(body.prompt)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception:
        return ValidatePromptResponse(is_valid=True, reason=None)

    return ValidatePromptResponse(is_valid=result["is_valid"], reason=result.get("reason"))


@router.post("/generate", response_model=GenerateRecipeResponse)
def generate_recipe(
    body: GenerateRecipeRequest,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GenerateRecipeResponse:
    """
    Genera sugerencias de recetas personalizadas via Gemini LLM y las persiste en DB.
    """
    prefs = current_user.preferences
    dietary_restrictions = prefs.dietary_restrictions if prefs else _DEFAULT_PREFS["dietary_restrictions"]
    allergen_exclusions  = prefs.allergen_exclusions  if prefs else _DEFAULT_PREFS["allergen_exclusions"]
    cooking_skill        = prefs.cooking_skill        if prefs else _DEFAULT_PREFS["cooking_skill"]
    max_budget_clp       = prefs.max_budget_clp       if prefs else _DEFAULT_PREFS["max_budget_clp"]

    now = datetime.now(timezone.utc)
    current_date = now.strftime("%Y-%m-%dT%H:%M:%SZ")

    try:
        raw_recipes = generate_recipes_from_llm(
            user_prompt=body.prompt or "",
            dietary_restrictions=dietary_restrictions,
            allergen_exclusions=allergen_exclusions,
            cooking_skill=cooking_skill,
            max_budget_clp=max_budget_clp,
            current_date=current_date,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (ValueError, Exception) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Error al generar recetas con el LLM: {exc}",
        ) from exc

    result_recipes: list[Recipe] = []
    for raw in raw_recipes:
        record = _llm_dict_to_recipe_db(raw, current_user.id, now)
        db.add(record)
        db.flush()  # get the id assigned before building the schema
        result_recipes.append(_db_recipe_to_schema(record))

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al guardar las recetas generadas")

    return GenerateRecipeResponse(recipes=result_recipes)


@router.get("/history", response_model=RecipeHistoryResponse)
def get_history(
    page: int = 1,
    limit: int = 12,
    favorites_only: bool = False,
    month_only: bool = False,
    ingredient: str = Query(default="", alias="ingredient"),
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecipeHistoryResponse:
    """Devuelve el historial de recetas guardadas por el usuario autenticado."""
    query = db.query(RecipeDB).filter(RecipeDB.user_id == current_user.id)

    if favorites_only:
        query = query.filter(RecipeDB.is_favorite == True)

    if month_only:
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(RecipeDB.created_at >= month_start)

    if ingredient:
        query = query.filter(cast(RecipeDB.ingredients, String).ilike(f"%{ingredient}%"))

    total = query.count()
    start = (page - 1) * limit
    db_recipes = (
        query.order_by(RecipeDB.created_at.desc())
        .offset(start)
        .limit(limit)
        .all()
    )
    items = [_db_recipe_to_schema(r) for r in db_recipes]
    return RecipeHistoryResponse(items=items, total=total, page=page)


@router.get("/{recipe_id}", response_model=SingleRecipeResponse)
def get_recipe(
    recipe_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SingleRecipeResponse:
    recipe = db.query(RecipeDB).filter(
        RecipeDB.id == recipe_id,
        RecipeDB.user_id == current_user.id,
    ).first()
    if recipe is None:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    return SingleRecipeResponse(recipe=_db_recipe_to_schema(recipe))


@router.post("/{recipe_id}/save", status_code=201)
def save_recipe(
    recipe_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Marca una receta como favorita en la DB."""
    recipe = db.query(RecipeDB).filter(
        RecipeDB.id == recipe_id,
        RecipeDB.user_id == current_user.id,
    ).first()
    if recipe:
        recipe.is_favorite = not recipe.is_favorite
        db.commit()
    return Response(status_code=201)

@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(
    recipe_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Elimina una receta del historial del usuario."""
    recipe = db.query(RecipeDB).filter(
        RecipeDB.id == recipe_id,
        RecipeDB.user_id == current_user.id,
    ).first()
    if recipe:
        db.delete(recipe)
        db.commit()
    return Response(status_code=204)
