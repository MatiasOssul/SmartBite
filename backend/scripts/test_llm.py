"""
Prueba rápida de la integración con Gemini.
Ejecutar desde la carpeta backend/:
    python scripts/test_llm.py
"""

import json
import sys
from pathlib import Path

# Permite importar módulos de backend/ sin instalar el paquete
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from core.llm import generate_recipes_from_llm

# ── Parámetros de prueba ──────────────────────────────────────────────────────
TEST_PARAMS = {
    "user_prompt": "Quiero algo con pollo, rápido y saludable",
    "dietary_restrictions": ["gluten_free"],
    "allergen_exclusions": ["mariscos"],
    "cooking_skill": "intermediate",
    "max_budget_clp": 12000,
    "current_date": "2026-04-01T22:00:00Z",
}

REQUIRED_RECIPE_KEYS = {
    "id", "title", "description", "image_url", "prep_time_minutes",
    "difficulty", "cost_clp", "match_score", "tags",
    "ingredients", "instructions", "nutritional_info", "is_favorite", "created_at",
}
REQUIRED_NUTRITIONAL_KEYS = {"calories_kcal", "protein_g", "carbs_g", "fat_g", "fiber_g"}
VALID_DIFFICULTIES = {"easy", "medium", "hard"}
VALID_UNITS = {"g", "ml", "units", "tbsp", "tsp", "cups"}


def validate(recipes: list[dict]) -> list[str]:
    errors = []
    if not (2 <= len(recipes) <= 3):
        errors.append(f"Se esperaban 2–3 recetas, se obtuvieron {len(recipes)}")

    for i, r in enumerate(recipes):
        prefix = f"Receta[{i}]"
        missing = REQUIRED_RECIPE_KEYS - r.keys()
        if missing:
            errors.append(f"{prefix} campos faltantes: {missing}")

        diff = r.get("difficulty")
        if diff not in VALID_DIFFICULTIES:
            errors.append(f"{prefix} difficulty inválido: {diff!r}")

        cost = r.get("cost_clp", 0)
        if cost > TEST_PARAMS["max_budget_clp"]:
            errors.append(f"{prefix} cost_clp={cost} supera el presupuesto {TEST_PARAMS['max_budget_clp']}")

        ni = r.get("nutritional_info") or {}
        missing_ni = REQUIRED_NUTRITIONAL_KEYS - ni.keys()
        if missing_ni:
            errors.append(f"{prefix} nutritional_info campos faltantes: {missing_ni}")

        for j, ing in enumerate(r.get("ingredients") or []):
            unit = ing.get("unit")
            if unit not in VALID_UNITS:
                errors.append(f"{prefix} ingrediente[{j}] unit inválido: {unit!r}")

    return errors


def main():
    print("=" * 60)
    print("  SmartBite — Test de integración LLM (Gemini)")
    print("=" * 60)
    print(f"\nPrompt : {TEST_PARAMS['user_prompt']}")
    print(f"Budget : ${TEST_PARAMS['max_budget_clp']:,} CLP")
    print(f"Skill  : {TEST_PARAMS['cooking_skill']}")
    print(f"Dieta  : {TEST_PARAMS['dietary_restrictions']}")
    print(f"Excluir: {TEST_PARAMS['allergen_exclusions']}")
    print("\nLlamando a Gemini... ", end="", flush=True)

    try:
        recipes = generate_recipes_from_llm(**TEST_PARAMS)
        print("OK\n")
    except Exception as exc:
        print(f"ERROR\n\n{exc}")
        sys.exit(1)

    # Validar estructura
    errors = validate(recipes)

    # Imprimir resumen de cada receta
    for i, r in enumerate(recipes, 1):
        print(f"  Receta {i}: {r.get('title', '???')}")
        print(f"    Dificultad : {r.get('difficulty')}  |  Tiempo: {r.get('prep_time_minutes')} min")
        print(f"    Costo      : ${r.get('cost_clp', 0):,} CLP  |  Match: {r.get('match_score')}/100")
        print(f"    Tags       : {r.get('tags')}")
        print(f"    Ingredientes: {len(r.get('ingredients') or [])}")
        ni = r.get("nutritional_info") or {}
        print(f"    Calorías   : {ni.get('calories_kcal')} kcal  |  Proteína: {ni.get('protein_g')}g")
        img = r.get('image_url', '')
        src = 'pexels' if 'pexels' in img else ('unsplash' if 'unsplash' in img else 'otro')
        print(f"    Imagen     : [{src}] {img[:80]}...")
        print()

    if errors:
        print("⚠  Problemas de validación detectados:")
        for e in errors:
            print(f"   • {e}")
        sys.exit(1)
    else:
        print(f"✓ {len(recipes)} recetas generadas y validadas correctamente.")
        print("\nJSON completo:")
        print(json.dumps(recipes, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
