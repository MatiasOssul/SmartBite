# SmartBite — Asistente Culinario con IA

**SmartBite** es una aplicación inteligente que te ayuda a planificar comidas, generar recetas y gestionar tu presupuesto. Basada en una arquitectura de Monorepo, combina un frontend de alto rendimiento con Vite + TailwindCSS y un backend robusto en Python con FastAPI e Inteligencia Artificial (Gemini).

---

## 🚀 Arquitectura y Tecnologías

### 1. Frontend (`/frontend`)
Aplicación Multi-Página (MPA) moderna.
- **Framework:** Vite
- **Estilos:** Tailwind CSS con soporte total y nativo para **Dark Mode** 🌙
- **Lógica:** Vanilla JavaScript (ES Modules), modularizado en endpoints e interfaz (Optimistic UI).

### 2. Backend (`/backend`)
API RESTful completa que gestiona los procesos, usuarios y bases de datos.
- **Framework:** Python / FastAPI / Pydantic
- **Base de Datos:** SQLite (Manejado mediante SQLAlchemy)
- **IA e Integraciones:** 
  - `google-generativeai` (Gemini 1.5/2.0) para la creación de recetas a medida respetando tu presupuesto, dieta y gustos.
  - Diseño extensible para integración de imágenes dinámicas a través de APIs de fotos libres de derechos (como Pexels).

---

## 🌟 Características Principales Incorporadas

1. **Recetas con IA Estríctamente Tipadas**: El backend procesa las sugerencias del LLM obligándolo a respetar formatos validables en JSON, asegurando que la app no sufra fallos al generar ingredientes, tiempos de preparación o niveles de dificultad.
2. **Sistema MOCK para Desarrollo**: Un bypass de facturación (`MOCK_LLM=true`) que emula latencias de red y proporciona resultados instantáneos ideales para probar interfaces sin consumir cuotas reales de APIs de terceros.
3. **Historial y Paginación**: Sistema optimizado de carga que almacena infinitas recetas en tu perfil, proveyendo métodos nativos de carga pausada (paginación de 8 elementos por consulta).
4. **Filtros Avanzados y Favoritos**: Filtrado en tiempo de ejecución tanto en base de datos como de interfaz, con actualización "Optimista" de UI para lograr 0 latencia percibida al guardar recetas o quitarlas.
5. **Autenticación (Mock) y Preferencias de Usuario**: Control total sobre tu perfil, alergias y la estética de la app.

---

## ⚙️ Guía de Ejecución Local

Para levantar el entorno completo, necesitarás **dos terminales activas** simultáneamente, ya que tanto el cliente Vite como el servidor Uvicorn actúan como dos procesos complementarios conectados a través de Proxy.

### 1. Levantar el Backend (FastAPI)

\`\`\`bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate   # En Windows
# source .venv/bin/activate # En Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
\`\`\`
*La API interactiva (Swagger UI) vivirá en: `http://127.0.0.1:8000/docs`*

**Variables de Entorno Necesarias (`backend/.env`):**
Crea tu archivo `.env` en base al código:
\`\`\`env
# Habilita un bypass de IA para no gastar cuota (MOCK_LLM=true | false)
MOCK_LLM=true
# Tu llave de Google AI Studio (requerido si MOCK_LLM=false)
GOOGLE_API_KEY=tu_api_key_aqui
# Tu llave de Pexels API para buscar fotos de alta calidad
PEXELS_API_KEY=tu_api_key_aqui
\`\`\`

### 2. Levantar el Frontend (Vite)

Abre otra terminal y ejecuta:

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
*La interfaz estará servida en `http://localhost:5173`. Las peticiones se enrutarán silenciosamente a través del puerto proxy al servidor FastAPI.*

---

## 🔒 Convenciones y Reglas de Desarrollo
- Las llamadas a la API desde el Frontend se realizan utilizando rutas absolutas o relativas enmascaradas (Ej: `/api/recipes/history`), permitiendo a Vite enrutarlas evitando configuraciones de CORS.
- Cambios de CSS deben implementarse mediante `class` con Tailwind CSS. Solo utilizar CSS puro para animaciones (`keyframes`) extremadamente complejas en `main.css`.
