from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

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
)

router = APIRouter(prefix="/api/recipes", tags=["Recipes"])

# Traducción fiel de MOCK_RECIPES del frontend JS
_MOCK_RECIPES: list[Recipe] = [
    Recipe(
        id="rec_01jdemo0000000000000000001",
        title="Pollo al Limón y Hierbas con Quinoa",
        description="Pechuga de pollo marinada en limón y hierbas frescas, acompañada de quinoa cocida al caldo. Una opción alta en proteínas, libre de gluten y lista en menos de 30 minutos.",
        image_url="https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80",
        prep_time_minutes=20,
        difficulty=Difficulty.easy,
        cost_clp=10180,
        match_score=100,
        tags=["Sin Gluten"],
        ingredients=[
            Ingredient(id="ing_001", name="Pechuga de pollo",  amount=300, unit=IngredientUnit.g),
            Ingredient(id="ing_002", name="Quinoa",             amount=150, unit=IngredientUnit.g),
            Ingredient(id="ing_003", name="Jugo de limón",      amount=45,  unit=IngredientUnit.ml),
            Ingredient(id="ing_004", name="Ajo",                amount=2,   unit=IngredientUnit.units),
            Ingredient(id="ing_005", name="Aceite de oliva",    amount=2,   unit=IngredientUnit.tbsp),
            Ingredient(id="ing_006", name="Orégano seco",       amount=1,   unit=IngredientUnit.tsp),
        ],
        instructions=[
            "Marina el pollo con jugo de limón, ajo picado, orégano y aceite de oliva durante 10 minutos.",
            "Cocina la quinoa en 300 ml de caldo de verduras a fuego medio durante 15 minutos hasta que absorba el líquido.",
            "Sella el pollo en una sartén caliente con un chorrito de aceite, 5 minutos por cada lado hasta dorar.",
            "Baja el fuego, tapa y cocina 3 minutos más hasta que esté cocido por dentro.",
            "Sirve el pollo sobre la quinoa y decora con rodajas de limón y perejil fresco.",
        ],
        nutritional_info=NutritionalInfo(calories_kcal=420, protein_g=48, carbs_g=32, fat_g=10, fiber_g=4),
        is_favorite=False,
        created_at=datetime(2026, 3, 28, 14, 22, 0, tzinfo=timezone.utc),
    ),
    Recipe(
        id="rec_01jdemo0000000000000000002",
        title="Bowl Saludable de Tofu y Verduras",
        description="Bowl vegano con tofu firme salteado, arroz integral y verduras de temporada. Rico en proteínas vegetales y fibra, ideal para una alimentación sostenible.",
        image_url="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
        prep_time_minutes=15,
        difficulty=Difficulty.easy,
        cost_clp=12500,
        match_score=85,
        tags=["Vegano"],
        ingredients=[
            Ingredient(id="ing_007", name="Tofu firme",                       amount=200, unit=IngredientUnit.g),
            Ingredient(id="ing_008", name="Arroz integral",                   amount=120, unit=IngredientUnit.g),
            Ingredient(id="ing_009", name="Brócoli",                          amount=150, unit=IngredientUnit.g),
            Ingredient(id="ing_010", name="Zanahoria",                        amount=1,   unit=IngredientUnit.units),
            Ingredient(id="ing_011", name="Salsa de soya reducida en sodio",  amount=2,   unit=IngredientUnit.tbsp),
            Ingredient(id="ing_012", name="Aceite de sésamo",                 amount=1,   unit=IngredientUnit.tsp),
        ],
        instructions=[
            "Cocina el arroz integral según las instrucciones del envase (aprox. 35 minutos).",
            "Corta el tofu en cubos de 2 cm y presiónalo con papel absorbente para eliminar el exceso de agua.",
            "Saltea el tofu en aceite de sésamo a fuego alto hasta dorar por todos los lados, unos 6 minutos.",
            "Agrega el brócoli en floretes y la zanahoria en juliana; saltea 3 minutos más.",
            "Incorpora la salsa de soya, mezcla bien y sirve sobre el arroz integral.",
        ],
        nutritional_info=NutritionalInfo(calories_kcal=380, protein_g=22, carbs_g=48, fat_g=9, fiber_g=7),
        is_favorite=False,
        created_at=datetime(2026, 3, 29, 9, 5, 0, tzinfo=timezone.utc),
    ),
    Recipe(
        id="rec_01jdemo0000000000000000003",
        title="Salmón al Horno con Espárragos",
        description="Filete de salmón al horno con espárragos frescos, limón y eneldo. Alto en omega-3 y listo en 25 minutos. Perfecto para una cena ligera y nutritiva.",
        image_url="https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80",
        prep_time_minutes=25,
        difficulty=Difficulty.easy,
        cost_clp=14900,
        match_score=78,
        tags=["Sin Gluten", "Alto en Proteínas"],
        ingredients=[
            Ingredient(id="ing_013", name="Filete de salmón",   amount=180, unit=IngredientUnit.g),
            Ingredient(id="ing_014", name="Espárragos frescos", amount=200, unit=IngredientUnit.g),
            Ingredient(id="ing_015", name="Limón",              amount=1,   unit=IngredientUnit.units),
            Ingredient(id="ing_016", name="Eneldo fresco",      amount=10,  unit=IngredientUnit.g),
            Ingredient(id="ing_017", name="Aceite de oliva",    amount=1,   unit=IngredientUnit.tbsp),
        ],
        instructions=[
            "Precalienta el horno a 200°C.",
            "Coloca el salmón y los espárragos en una bandeja con papel de horno.",
            "Rocía con aceite de oliva, jugo de limón y espolvorea eneldo.",
            "Hornea por 15–18 minutos hasta que el salmón se desmenuza fácilmente.",
            "Sirve con rodajas de limón y acompaña con ensalada verde si deseas.",
        ],
        nutritional_info=NutritionalInfo(calories_kcal=350, protein_g=36, carbs_g=8, fat_g=19, fiber_g=3),
        is_favorite=True,
        created_at=datetime(2026, 3, 30, 18, 40, 0, tzinfo=timezone.utc),
    ),
]

_RECIPE_INDEX: dict[str, Recipe] = {r.id: r for r in _MOCK_RECIPES}


@router.post("/generate", response_model=GenerateRecipeResponse)
def generate_recipe(body: GenerateRecipeRequest) -> GenerateRecipeResponse:
    return GenerateRecipeResponse(recipes=_MOCK_RECIPES)


@router.get("/history", response_model=RecipeHistoryResponse)
def get_history(page: int = 1, limit: int = 12) -> RecipeHistoryResponse:
    start = (page - 1) * limit
    items = _MOCK_RECIPES[start : start + limit]
    return RecipeHistoryResponse(items=items, total=len(_MOCK_RECIPES), page=page)


@router.get("/{recipe_id}", response_model=SingleRecipeResponse)
def get_recipe(recipe_id: str) -> SingleRecipeResponse:
    recipe = _RECIPE_INDEX.get(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    return SingleRecipeResponse(recipe=recipe)


@router.post("/{recipe_id}/save", status_code=201)
def save_recipe(recipe_id: str) -> Response:
    return Response(status_code=201)
