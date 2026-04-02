# SmartBite — Asistente Culinario con IA

**SmartBite** es una aplicación inteligente que te ayuda a planificar comidas, generar recetas personalizadas y gestionar tu presupuesto. Arquitectura monorepo con un frontend de alto rendimiento en Vite + TailwindCSS y un backend robusto en Python con FastAPI e Inteligencia Artificial (Gemini).

🌐 **Demo en producción:** https://smartbite-frontend-rpgn.onrender.com

---

## 🚀 Arquitectura y Tecnologías

```
┌─────────────────────────────────────┐     ┌──────────────────────────────────────┐
│  Frontend (Static Site)             │────▶│  Backend (Web Service)               │
│  smartbite-frontend-rpgn.onrender.com│     │  smartbite-backend-dt9n.onrender.com  │
│                                     │     │                                      │
│  • Vite (build)                     │     │  • Python / FastAPI / Uvicorn        │
│  • Tailwind CSS + Dark Mode 🌙      │     │  • SQLite + SQLAlchemy               │
│  • Vanilla JS (ES Modules)          │     │  • Gemini 2.5 Flash (google-genai)   │
│  • Optimistic UI                    │     │  • Pexels API (imágenes)             │
└─────────────────────────────────────┘     │  • Rate limiting (SlowAPI)           │
                                            │  • JWT Auth (python-jose)            │
                                            └──────────────────────────────────────┘
```

---

## 🌟 Características

1. **Recetas con IA estrictamente tipadas** — El backend parsea JSON estructurado del LLM validando ingredientes, tiempos y dificultad, sin fallos por respuestas malformadas.
2. **Sistema MOCK para desarrollo** — `MOCK_LLM=true` emula latencias de red sin consumir cuota de la API de Gemini.
3. **Historial con paginación** — Carga lazy de recetas (8 por página), con filtros por favoritos, mes y nombre de ingrediente.
4. **Filtros y Favoritos con Optimistic UI** — 0 latencia percibida al guardar/quitar recetas.
5. **Perfil y preferencias** — Alergias, restricciones dietéticas, nivel de cocina y presupuesto máximo (CLP).
6. **Rate limiting + Security headers** — Protección básica lista para producción.

---

## ⚙️ Ejecución Local

Necesitas **dos terminales** simultáneas — Vite y Uvicorn corren como procesos separados conectados por proxy.

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Crea el archivo `backend/.env`:

```env
GOOGLE_API_KEY=tu_api_key_aqui     # https://aistudio.google.com/app/apikey
PEXELS_API_KEY=tu_api_key_aqui     # https://www.pexels.com/api/
MOCK_LLM=true                      # true = sin consumo de API, ideal para desarrollo
```

### 2. Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

La interfaz corre en `http://localhost:5173`. Las peticiones `/api/*` se proxean automáticamente al backend en `:8000`.

---

## ☁️ Deploy en Render

El proyecto usa **Infrastructure as Code** via `render.yaml`. Un solo Blueprint crea y configura ambos servicios automáticamente.

### Pasos

1. Ve a [render.com](https://render.com) → **New + → Blueprint**
2. Conecta el repo `MatiasOssul/SmartBite`
3. Render detecta el `render.yaml` y muestra los 2 servicios a crear
4. Ingresa las 2 variables secretas cuando las solicite:
   - `GOOGLE_API_KEY`
   - `PEXELS_API_KEY`
5. Click en **Deploy Blueprint**

El resto de variables (`JWT_SECRET_KEY`, `MOCK_LLM`, `FRONTEND_URL`, `VITE_API_BASE_URL`) se configuran solas desde el `render.yaml`.

### Variables de entorno en producción

| Variable | Servicio | Cómo se establece |
|----------|----------|-------------------|
| `GOOGLE_API_KEY` | Backend | Manual en dashboard |
| `PEXELS_API_KEY` | Backend | Manual en dashboard |
| `JWT_SECRET_KEY` | Backend | Auto-generada por Render |
| `MOCK_LLM` | Backend | `"False"` desde `render.yaml` |
| `FRONTEND_URL` | Backend | `https://smartbite-frontend-rpgn.onrender.com` |
| `VITE_API_BASE_URL` | Frontend | `https://smartbite-backend-dt9n.onrender.com/api` |

---

## 🔒 Convenciones de Desarrollo

- Las llamadas API del frontend usan rutas relativas (`/api/...`) — Vite las proxea al backend en local; en producción `VITE_API_BASE_URL` apunta al backend en Render.
- CSS via clases Tailwind. Solo CSS puro para `@keyframes` complejos en `main.css`.
- Avatars de usuario (`backend/static/avatars/`) están excluidos del repo — se generan en runtime.
- El `.env` nunca se commitea — usar variables de entorno de Render en producción.
