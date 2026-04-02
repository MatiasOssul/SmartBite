"""
Script de utilidad para resetear la base de datos SQLite.

Uso:
    cd backend
    python -m scripts.reset_db

ADVERTENCIA: Borra TODOS los datos (usuarios, recetas, tarjetas, preferencias).
Usar solo en desarrollo para limpiar passwords en texto plano o schemas desactualizados.
"""
import sys
import os

# Asegurar que el directorio backend está en el path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database import Base, engine
from models import recipe_model, user_model  # noqa: F401 — registra tablas

def reset():
    print("⚠️  Reseteando base de datos SmartBite...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ Base de datos reseteada correctamente.")
    print("   Todas las tablas fueron recreadas vacías.")
    print("   Puedes registrar un nuevo usuario en http://localhost:5173/index.html")

if __name__ == "__main__":
    confirm = input("¿Confirmas que quieres borrar TODOS los datos? (escribe 'si' para continuar): ")
    if confirm.strip().lower() == "si":
        reset()
    else:
        print("Operación cancelada.")
