from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")  # loads GOOGLE_API_KEY etc. from backend/.env

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.database import Base, engine
from models import recipe_model, user_model  # noqa: F401 — registra tablas en Base.metadata
from routers import auth, profile, recipes, support

app = FastAPI(title="SmartBite API")

# CORS — permite que el frontend en localhost:5173 llame al backend en :8000
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",   # npm run preview
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(recipes.router)
app.include_router(support.router)


_STATIC_DIR = Path(__file__).parent / "static"
_STATIC_DIR.mkdir(exist_ok=True)
app.mount("/api/static", StaticFiles(directory=_STATIC_DIR), name="static")


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "SmartBite API is running"}
