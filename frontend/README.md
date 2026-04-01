# SmartBite — Frontend

Aplicación web frontend de **SmartBite**, el asistente inteligente que planifica cenas y sugiere recetas a partir de los ingredientes disponibles, potenciado por IA.

Este repositorio contiene el **frontend funcional** construido como una MPA (Multi-Page App) con Vite + Tailwind CSS + Vanilla JS. Está diseñado para conectarse a un backend FastAPI, pero actualmente opera con datos mock mientras el backend no esté disponible.

---

## Tecnologías

- **Vite 5** — bundler y servidor de desarrollo con soporte MPA
- **Tailwind CSS 3** — framework de utilidades CSS con modo oscuro por clase
- **Vanilla JavaScript (ES Modules)** — sin framework; lógica organizada en módulos reutilizables
- **PostCSS + Autoprefixer** — pipeline de estilos

---

## Requisitos

- Node.js 18+
- npm 9+

---

## Comandos

```bash
npm install        # Instalar dependencias
npm run dev        # Servidor de desarrollo → http://localhost:5173
npm run build      # Build de producción → dist/
npm run preview    # Vista previa del build → http://localhost:4173
```

No hay test runner configurado. Verifica cambios manualmente con `npm run dev`.

---

## Estructura del proyecto

```text
src/
├── *.html            # Archivos HTML (index, main, profile...) - Raíz de Vite
├── templates/
│   └── navbar.html   # Plantilla de la barra de navegación (inyectada en JS)
├── js/
│   ├── api/          # Capa de comunicación con el backend (Mocks formales + Schemas)
│   │   ├── client.js     # Cliente HTTP base (apiGet/apiPost/apiPut/apiDelete)
│   │   ├── auth.js       # Login, registro y sesión
│   │   ├── recipes.js    # Búsqueda, historial y generación de recetas con IA
│   │   └── profile.js    # Perfil, preferencias y métodos de pago
│   ├── modules/      # Lógica transversal de la interfaz
│   │   ├── session.js    # Validaciones en localStorage (requireAuth, getToken)
│   │   ├── guard.js      # Guardias de rutas (redirige si no hay sesión válida)
│   │   ├── navbar.js     # Inyección y reactividad del menú principal
│   │   ├── theme.js      # Persistencia de modo oscuro / claro
│   │   ├── toast.js      # Sistema de notificaciones cruzadas y Loading Spinners
│   │   ├── modals.js     # Comportamiento de pop-ups y modales
│   │   └── store.js      # Estado global reactivo (Carrito de compras y Favoritos)
│   └── pages/        # Puntos de entrada JS por cada página HTML
│       ├── index.js
│       ├── main.js
│       ├── history.js
│       ├── profile.js
│       ├── biteplus.js
│       ├── support.js
│       └── ui-kit.js
└── styles/
    └── main.css      # Estilos Tailwind extra y animaciones personalizadas
```


---

## Páginas

| HTML | Entry JS | Auth requerida |
|------|----------|:--------------:|
| `index.html` | `src/js/pages/index.js` | No |
| `main.html` | `src/js/pages/main.js` | Sí |
| `history.html` | `src/js/pages/history.js` | Sí |
| `profile.html` | `src/js/pages/profile.js` | Sí |
| `biteplus.html` | `src/js/pages/biteplus.js` | Sí |
| `support.html` | `src/js/pages/support.js` | Sí |
| `ui-kit.html` | `src/js/pages/ui-kit.js` | No |

> `ui-kit.html` es el diccionario de diseño: expone todos los componentes, botones, inputs y colores del sistema de diseño.

---

## Autenticación y sesión

El estado de sesión se persiste en `localStorage`:

| Clave | Valores |
|-------|---------|
| `smartbite_token` | JWT string o ausente |
| `smartbite_session_state` | `'empty'` \| `'populated'` |
| `smartbite_theme` | `'dark'` o ausente (light) |

- Las páginas protegidas llaman a `guardPrivate()` en el entry point. Si no hay token, redirigen al login sin dejar historial en el navegador.
- `guardPublic()` en el login redirige al dashboard si ya hay sesión activa.

**Credenciales de desarrollo:**

| Credencial | Efecto |
|------------|--------|
| Cualquier email/contraseña | Sesión con datos poblados |
| `vacio@smartbite.com` | Sesión con estado vacío (onboarding) |

---

## Estado vacío vs. poblado

Cada página detecta si el usuario es nuevo mediante `isNewUser()` (verifica `smartbite_session_state === 'empty'`). Los divs de estado vacío están embebidos en cada HTML y se muestran/ocultan con JS. No existen archivos `*-empty.html` separados.

---

## Modo oscuro

Implementado con la estrategia `class` de Tailwind (agrega `dark` al `<html>`). Cada página protegida incluye este bloque en el `<head>` para prevenir FOUC:

```html
<script>
  if (localStorage.getItem('smartbite_theme') === 'dark')
    document.documentElement.classList.add('dark');
</script>
```

El toggle se encuentra en **Perfil > Preferencias de Apariencia**.

---

## Conexión al backend

La capa API (`src/js/api/`) devuelve actualmente **datos mock**. Cuando el backend FastAPI esté disponible:

1. Configura la variable de entorno `VITE_API_BASE_URL` (por defecto `/api`).
2. El proxy de Vite ya enruta `/api/*` → `http://127.0.0.1:8000`.
3. Reemplaza la lógica mock en `client.js` — el código de cada página no necesita cambios.

---

## Alias de paths

```
@       → src/
@js     → src/js/
@styles → src/styles/
```

---

## Tailwind — configuración relevante

- Modo oscuro: estrategia `class`
- Color de marca: `brand-{50..900}` (paleta verde)
- Sombras personalizadas: `shadow-soft`, `shadow-float`
