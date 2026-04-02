import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")  # loads GOOGLE_API_KEY etc. from backend/.env

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware

import logging

from core.database import Base, engine
from models import recipe_model, user_model  # noqa: F401 — registra modelos en Base.metadata (incluye DailyUsageDB)
from routers import auth, profile, recipes, support

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smartbite")

# ---------------------------------------------------------------------------
# Etiquetas legibles para los campos de los schemas
# ---------------------------------------------------------------------------
# Artículo incluido para concordancia de género
_FIELD_LABELS: dict[str, str] = {
    "email":            "El correo electrónico",
    "password":         "La contraseña",
    "name":             "El nombre",
    "current_password": "La contraseña actual",
    "new_password":     "La nueva contraseña",
}


def _pydantic_error_to_spanish(err: dict) -> str:
    field_key   = str(err["loc"][-1]) if err.get("loc") else "campo"
    field_label = _FIELD_LABELS.get(field_key, f"El campo '{field_key}'")
    etype       = err.get("type", "")
    ctx         = err.get("ctx", {})

    if etype == "string_too_short":
        return f"{field_label} debe tener al menos {ctx.get('min_length', '?')} caracteres."
    if etype == "string_too_long":
        return f"{field_label} es demasiado larga (máximo {ctx.get('max_length', '?')} caracteres)."
    if etype in ("value_error", "email_address_invalid") or "email" in etype:
        return f"{field_label} no tiene un formato válido."
    if etype == "missing":
        return f"{field_label} es obligatorio."
    if etype == "string_type":
        return f"{field_label} debe ser texto."
    return f"{field_label} no es válido."

# ---------------------------------------------------------------------------
# Rate limiter (global — routers añaden límites por endpoint)
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(title="SmartBite API", docs_url=None, redoc_url=None)  # disable docs in prod

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Convierte errores de validación Pydantic (422) a mensajes en español."""
    errors = exc.errors()
    message = _pydantic_error_to_spanish(errors[0]) if errors else "Datos de entrada inválidos."
    return JSONResponse(status_code=422, content={"detail": message})

# ---------------------------------------------------------------------------
# Security headers
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
_FRONTEND_URL = os.getenv("FRONTEND_URL", "").strip()
logger.info("CORS allow_origins — FRONTEND_URL: %r", _FRONTEND_URL or "(not set)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        *([_FRONTEND_URL] if _FRONTEND_URL else []),
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",   # npm run preview
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Accept-Language", "Cache-Control"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(recipes.router)
app.include_router(support.router)

_STATIC_DIR = Path(__file__).parent / "static"
_STATIC_DIR.mkdir(exist_ok=True)
app.mount("/api/static", StaticFiles(directory=_STATIC_DIR), name="static")

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
