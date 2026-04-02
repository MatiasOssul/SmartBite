# SmartBite API — Backend

FastAPI backend para SmartBite. Proporciona una API RESTful completamente funcional encargada de gestionar los usuarios, almacenar datos en SQLite, autenticar sesiones mediante JWT y orquestar las llamadas a Inteligencia Artificial para generar contenido dinámico.

---

## 💻 Requisitos Técnicos

- Python 3.10+
- SQLite (pre-instalado por defecto con Python)
- Variables de Entorno y Claves de API (`.env`)

---

## 🛠 Instalación y Configuración

1. Posiciónate en la carpeta `backend/` y crea el entorno virtual:

```bash
cd backend
python -m venv .venv
```

2. Activa el entorno virtual:

```bash
# En Windows (Powershell)
.\.venv\Scripts\activate

# En Mac / Linux
source .venv/bin/activate
```

3. Instala las dependencias principales:

```bash
pip install -r requirements.txt
```

4. Crea un archivo `.env` en el directorio `backend/` para configurar tus accesos. Puedes basarte en esta estructura requerida:

```env
# SmartBite Backend — config
MOCK_LLM=true                           # Si es true, las peticiones emularán la API ahorrando cuotas 
GOOGLE_API_KEY=tu_api_key_de_gemini     # Requerido si MOCK_LLM es false
PEXELS_API_KEY=tu_api_key_de_pexels     # Para recuperar fotografías en alta calidad (opcional/en desarrollo)
```

---

## 🚀 Arranque del Servidor

Enciende el servidor local habilitando hot-reload (actualización instantánea al cambiar los archivos de código):

```bash
uvicorn main:app --reload --port 8000
```

---

## 🗂 Estructura del Código

La separación de responsabilidades sigue el patrón MVC / Router Pattern muy recomendado en FastAPI:

```text
backend/
├── main.py              # Instancia maestra de FastAPI (Inyecta configuraciones y Middlewares CORS)
├── smartbite.db         # Tu base de datos relacional (Generada automáticamente)
├── .env                 # Secretos ignodados por git
├── core/                # Logica Core del Sistema
│   ├── database.py        # Orquestador del db.session y Base (SQLAlchemy)
│   ├── security.py        # Helpers para creación, firmado y encriptación de JWTs + Passwords
│   └── llm.py             # Puente con Gemini 1.5, Prompts Maestros y Mocks
├── models/              # Modelos SQLAlchemy para Tablas SQLite
│   └── orm_models.py      # UsersDB, RecipeDB
├── routers/             # Endpoints clasificados modularmente
│   ├── auth.py            # /api/auth (Login, Registro)
│   ├── recipes.py         # /api/recipes (Generate, History, Borrado, Favoritos)
│   └── profile.py         # /api/profile (Preferencias, Actualización de Avatar)
├── schemas/             # Pydantic Schemas (Validadores In/Out)
│   ├── auth_schemas.py    
│   ├── recipe_schemas.py  
│   └── profile_schemas.py 
├── scripts/             # Herramientas de utilidad para el Terminal
│   └── test_llm.py        # Demo en terminal para probar Gemini
└── static/              # Hospeda la sub-carpeta 'avatars' manejando las foto de perfil físicas de los usuarios
```

---

## ⚙️ Conexiones y Desarrollo

- Toda la data devuelta por nuestra plataforma está modelada y serializada estrictamente por Pydantic hacia Formatos JSON universales.
- **Seguridad**: Los endpoints protegidos en los Routers dependen de `Depends(get_current_user)`, solicitando el paso mandatorio de un Token emitido por el Login. El frontend inyectará dinámicamente este Header (`Authorization: Bearer <token>`).
- En desarrollo (modo servidor `npm run dev` desde la otra carpeta), ni siquiera necesitarás lidiar con permisos CORS directos con los puertos alternos dado que la delegación está administrada directamente por el router abstracto de Vite en formato Proxy reverso (*Vite intercepta `5173/api/*` y rebota directo a `8000/api/*`*).

---

## ✅ Verificación del Funcionamiento

Una vez corriendo localmente, puedes visitar los siguientes directorios clave desde tu navegador favorito:

| Utilidad | Dirección Web Local |
|-----|-------------------|
| **Health Check API** | `http://localhost:8000/api/health` |
| **Documentación REST Interactiva (Swagger)** | `http://localhost:8000/docs` |
| **Diccionario JSON OpenAPI Exportable** | `http://localhost:8000/openapi.json` |

> En **Swagger** puedes simular peticiones con botones "Authorize" arriba a la derecha. Pones tu email y contra (creada en la App Web) y Swagger adjuntará tu Token por debajo a cada Endpoint como si fueses Frontend.
