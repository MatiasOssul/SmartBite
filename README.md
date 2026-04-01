# SmartBite — Proyecto Monorepo

Este repositorio contiene la arquitectura completa (Frontend y Backend) de **SmartBite**, el asistente inteligente que planifica comidas y sugiere recetas potenciado por IA.

El proyecto está diseñado bajo un formato de **Monorepo** para facilitar el desarrollo, sincronizar los contratos de las APIs (JSON schemas) y agilizar la iteración de un solo desarrollador/equipo pequeño.

---

## 📂 Architetura del Proyecto

El repositorio se divide en dos grandes servicios independientes:

- **`/frontend/`**: Aplicación Multi-Página (MPA) servida con **Vite**. 
  - *Tecnologías:* Vanilla JavaScript (ES Modules), Tailwind CSS, HTML5 estricto.
  - *Estado:* Totalmente modularizado, con gestión de estados globales (`store.js`) y listo para producción.
  
- **`/backend/`**: API RESTful robusta y rápida (En construcción).
  - *Tecnologías:* **Python**, **FastAPI**, **Pydantic**.
  - *Función:* Servir los modelos de la base de datos, autenticar usuarios y comunicarse con servicios de IA para generar recetas.

---

## 🚀 Guía Rápida de Inicio (Desarrollo Local)

Debido al formato Monorepo, necesitarás abrir **dos terminales separadas** para correr la aplicación completa en desarrollo.

### 1. Levantar el Backend (FastAPI)
Abre tu primera terminal y ubícate en la raíz del repositorio:
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*La API estará disponible en `http://127.0.0.1:8000` y la documentación interactiva (Swagger) en `http://127.0.0.1:8000/docs`.*

### 2. Levantar el Frontend (Vite)
Abre una segunda terminal y ubícate en la raíz del repositorio:
```bash
cd frontend

# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Iniciar el servidor en el puerto 5173
npm run dev
```
*Tu aplicación se abrirá en `http://localhost:5173`.*

---

## 🔌 Cómo se conectan

Para evitar problemas de CORS intermedios durante el desarrollo local, el **Frontend (Vite)** actúa como un Proxy Inverso. 

Cualquier petición que el frontend haga hacia la ruta `/api/*` (ej: `fetch('/api/health')`), Vite la interceptará y la redirigirá invisiblemente a tu servidor FastAPI localizado en `http://127.0.0.1:8000/api/*`. **Por esta razón, en tu código JS siempre debes hacer llamadas con rutas relativas (`/api/...`).**
