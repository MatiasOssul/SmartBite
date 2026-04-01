from fastapi import FastAPI

from core.database import Base, engine
from models import recipe_model, user_model  # noqa: F401 — registra tablas en Base.metadata
from routers import auth, profile, recipes

app = FastAPI(title="SmartBite API")

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(recipes.router)


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "SmartBite API is running"}
