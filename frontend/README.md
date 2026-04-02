# SmartBite — Frontend

Aplicación web cliente (Frontend) de **SmartBite**, el asistente inteligente que planifica cenas y sugiere recetas a partir de los ingredientes disponibles, potenciado por IA.

Este repositorio contiene la Interfaz de Usuario construida como una **MPA (Multi-Page App)** con Vite + Tailwind CSS + Vanilla JS. Está configurada intrínsecamente para funcionar en conjunto con el backend en FastAPI alojado en el directorio `/backend`.

---

## 🛠 Tecnologías

- **Vite 5** — Bundler ultrarrápido y servidor de desarrollo con soporte nativo MPA.
- **Tailwind CSS 3** — Framework de utilidades CSS, integrado con modo oscuro por clases (`dark:bg-*`).
- **Vanilla JavaScript (ES Modules)** — Cero frameworks reactivos (sin React/Vue) garantizando máxima ligereza visual. Organización estricta mediante VanillaJS.
- **PostCSS + Autoprefixer** — Pipeline de optimización de estilos CSS.
- **FontAwesome 6** — Sistema de iconografía de alta fidelidad.

---

## 📦 Requisitos

- Node.js 18+
- npm 9+

---

## 🚀 Comandos

```bash
npm install        # Inicializa las dependencias en la carpeta de Vite
npm run dev        # Activa el Servidor de Desarrollo en → http://localhost:5173
npm run build      # Construye los estáticos listos para producción → dist/
npm run preview    # Activa un servidor para pre-visualizar el build en modo local
```

*Importante:* Para que la aplicación obtenga datos (Inicio de Sesión, Registro, Historial, Perfil de Usuario y Recetas), el backend FastAPI debe estar corriendo simultáneamente en el puerto `8000`.

---

## 📂 Estructura del Proyecto

```text
src/
├── *.html            # Archivos HTML (index, main, profile...) - Raíz y páginas de Vite
├── templates/
│   └── navbar.html   # Plantilla de la barra de navegación (inyectada de forma dinámica)
├── js/
│   ├── api/          # Capa de consumo del Backend API
│   │   ├── client.js     # Cliente HTTP Proxy (apiGet/apiPost/apiPut/apiDelete)
│   │   ├── auth.js       # Autenticación, registro, y cambio de contraseñas
│   │   ├── recipes.js    # Consumo de LLM, Paginación e Historial
│   │   └── profile.js    # Data transaccional (Información del Usuario)
│   ├── modules/      # Utilities Reutilizables de Interfaz
│   │   ├── session.js    # Validaciones críticas de Auth local en (localStorage)
│   │   ├── guard.js      # Middleware UI para forzar login / redirección
│   │   ├── navbar.js     # Renderer de componentes Header
│   │   ├── theme.js      # Detector y controlador del Modo Oscuro
│   │   ├── toast.js      # Animaciones informativas y Spiners Modales
│   │   └── store.js      # Almacenamiento local optimista
│   └── pages/        # Controladores JS aislados uno por Vista
│       ├── index.js      # Login Form
│       ├── main.js       # Dashboard Generador Prompt IA
│       ├── history.js    # Visor Grilla Paginada + Filtros
│       ├── profile.js    # Detalles Mutables del Usuario
│       ├── biteplus.js 
│       ├── support.js
│       └── ui-kit.js
└── styles/
    └── main.css      # Custom Keyframes y Tokens Tailwind
```

---

## 🗂 Páginas & Rutas

| HTML | JS Controller | Access |
|------|---------------|:------:|
| `index.html` | `src/js/pages/index.js` | Público |
| `main.html` | `src/js/pages/main.js` | Privado |
| `history.html` | `src/js/pages/history.js` | Privado |
| `profile.html` | `src/js/pages/profile.js` | Privado |
| `biteplus.html` | `src/js/pages/biteplus.js` | Privado |
| `support.html` | `src/js/pages/support.js` | Privado |
| `ui-kit.html` | `src/js/pages/ui-kit.js` | Público |

> *Nota:* `ui-kit.html` es el diccionario de diseño: expone todos los componentes, botones, inputs y colores del sistema SmartBite en un solo lugar. Ideal como guía para expandir el sistema.

---

## 🔐 Autenticación y Privacidad de Rutas

Todo el modelo de datos real reside en SQLite (backend), pero el frontend mantiene la bandera optimista usando `localStorage`:

| Clave Local | Valores | Descripción |
|-------|---------|-------------|
| `smartbite_token` | JWT Token Opaque String | Emitido por "/api/auth/" de FastAPI. |
| `smartbite_theme` | `'dark'` o `null` | Persiste preferencia de colores. |
| `smartbite_session_state` | `'empty'` \| `'populated'` | Decide qué vista renderizar. |

Las páginas marcadas como **Privadas** cargan un `guardPrivate()` al tope de su Script JS, por lo que el simple hecho de navegar a su `/foo.html` provocará una redirección inmediata al `/index.html` si tu token es inválido o no existe.

---

## 🌑 Modo Oscuro (Dark Mode)

Integramos el esquema a nivel molecular aplicando clases utilitarias de Tailwind. Para impedir el perjudicial FOUC (parpadeos blancos antes de pintar en oscuro), cada HTML despliega un en el tag `<head>` este snippet nativo antes de procesar el body:

```html
<script>
  if (localStorage.getItem('smartbite_theme') === 'dark') {
      document.documentElement.classList.add('dark');
  }
</script>
```

---

## 🔌 Conexión con Backend (El Proxy)

Se ha configurado Vite como un **Proxy Inverso** para eliminar y solventar el problema histórico de errores de CORS. No necesitas inyectar la URL local de backend a JS:

En el archivo base, `fetch('/api/user')`, será capturado por el servidor Node de Vite y enrutado nativamente a `http://127.0.0.1:8000/api/user`. 
- Si FastAPI está apagado, las peticiones JS reportarán un status `502 Bad Gateway` manejado de forma correcta por el archivo `api/client.js`.
