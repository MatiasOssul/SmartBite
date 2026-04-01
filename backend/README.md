# SmartBite API — Backend

FastAPI backend para SmartBite. En Fase 1 solo expone el endpoint de salud y los schemas Pydantic.

## Requisitos

- Python 3.10+

## Instalación

```bash
cd backend

# Crear y activar entorno virtual
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac / Linux
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

## Arranque

```bash
uvicorn main:app --reload --port 8000
```

## Verificación

| URL | Resultado esperado |
|-----|-------------------|
| `http://localhost:8000/api/health` | `{"status":"ok","message":"SmartBite API is running"}` |
| `http://localhost:8000/docs` | Swagger UI interactivo |
| `http://localhost:8000/openapi.json` | Esquema OpenAPI con todos los modelos |

## Estructura

```
backend/
├── main.py              # App FastAPI + ruta /api/health
├── requirements.txt
└── schemas/
    ├── auth_schemas.py    # User, AuthResponse, LoginRequest, RegisterRequest
    ├── recipe_schemas.py  # Recipe, Ingredient, NutritionalInfo + wrappers
    └── profile_schemas.py # UserProfile, Preferences, PaymentMethod + wrappers
```

## Proxy Vite (desarrollo)

El frontend Vite enruta `/api/*` → `http://127.0.0.1:8000` automáticamente. No se necesita configuración CORS adicional en desarrollo.
