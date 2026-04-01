# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at localhost:5173/index.html
npm run build     # Production build → dist/
npm run preview   # Preview production build at localhost:4173
```

No test runner is configured. Verify changes manually via `npm run dev`.

## Architecture

SmartBite is a **Vite MPA (Multi-Page App)** — 7 HTML pages with shared vanilla JS modules and Tailwind CSS. No framework (no React/Vue).

### Page → Entry Point mapping

Each HTML file in the root imports exactly one module entry point:

| HTML | JS Entry | Auth Required |
|------|----------|---------------|
| `index.html` | `src/js/pages/index.js` | No |
| `main.html` | `src/js/pages/main.js` | Yes |
| `history.html` | `src/js/pages/history.js` | Yes |
| `profile.html` | `src/js/pages/profile.js` | Yes |
| `biteplus.html` | `src/js/pages/biteplus.js` | Yes |
| `support.html` | `src/js/pages/support.js` | Yes |
| `ui-kit.html` | `src/js/pages/ui-kit.js` | No |

### Shared Modules (`src/js/modules/`)

- **`session.js`** — `requireAuth()` (guards pages), `isNewUser()`, `getToken/setToken`, `clearSession()`, `setSessionState()`. All state stored in `localStorage`.
- **`navbar.js`** — `initNavbar(activePage)` injects `public/templates/navbar.html` via `?raw` import into `#navbar-mount`, highlights the active nav link.
- **`theme.js`** — `applyThemeFromStorage()` (called in `<head>` to prevent FOUC), `initDarkModeToggle(toggleId)`.
- **`toast.js`** — `showToast(message, type)` ('success'|'error'), `createSaveHandler(btnId, successMsg)`.
- **`modals.js`** — `initModal({ modalId, contentId, openBtnIds, closeBtnIds, backdropId })` wires all modal triggers.

### API Layer (`src/js/api/`)

All functions return `{ data, error }`. Currently return **mock data** — replace with real calls when FastAPI backend is ready. Only `client.js` needs updating; page code stays the same.

- **`client.js`** — `apiGet/apiPost/apiPut/apiDelete`. Base URL from `VITE_API_BASE_URL` env var or defaults to `/api`. Dev proxy routes `/api/*` to `http://127.0.0.1:8000`.
- **`auth.js`** — `login()`, `register()`, `logout()`, `requestPasswordReset()`
- **`recipes.js`** — `generateRecipe()`, `getHistory()`, `getRecipe()`, `saveRecipe()`
- **`profile.js`** — `getProfile()`, `updateProfile()`, `updatePreferences()`, `addPaymentCard()`, `deletePaymentCard()`

### Empty vs Populated State

Pages detect new users via `isNewUser()` (checks `localStorage.smartbite_session_state === 'empty'`). Each page has hidden empty-state divs that JS shows/hides — no separate `*-empty.html` files exist anymore. To trigger empty state in dev, log in with `vacio@smartbite.com`.

### Key localStorage Keys

| Key | Values |
|-----|--------|
| `smartbite_token` | JWT string or absent |
| `smartbite_session_state` | `'empty'` \| `'populated'` |
| `smartbite_theme` | `'dark'` or absent (light) |

### FOUC Prevention

Every protected HTML page has this inline script in `<head>` before the module entry:
```html
<script>
  if (localStorage.getItem('smartbite_theme') === 'dark')
    document.documentElement.classList.add('dark');
</script>
```

### Path Aliases

```
@       → src/
@js     → src/js/
@styles → src/styles/
```

### Tailwind

- Dark mode: `class` strategy — toggled by adding `dark` to `<html>`
- Brand color: `brand-{50..900}` (green palette)
- Custom shadows: `shadow-soft`, `shadow-float`
- Shared styles + animations in `src/styles/main.css`
