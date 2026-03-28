# SmartBite - Prototipo Interactivo (Mockup) 🥗🤖

Bienvenido al repositorio del prototipo inicial de **SmartBite**, el asistente inteligente diseñado para planificar cenas y aprovechar los ingredientes del refrigerador con el poder de la Inteligencia Artificial.

Este proyecto ha sido construido como un **Mockup Interactivo de Alta Fidelidad (High-Fidelity Mockup)**. Su objetivo es actuar como una guía viva y funcional para el equipo de desarrollo, demostrando las interacciones de UI/UX, animaciones, paletas de colores y flujos de usuarios sin necesidad de un backend real.

---

## 🛠️ Tecnologías Utilizadas

Para mantener el proyecto extremadamente ligero y fácil de compartir sin necesidad de configurar entornos de compilación (como Node o npm), se utilizaron tecnologías nativas y CDNs:

*   **HTML5 & CSS3:** Estructuración semántica pura.
*   **Tailwind CSS (CDN):** Framework de utilidad CSS para diseño rápido, responsivo y mantenible. Toda la configuración de temas y colores está embebida en los `<head>` de los archivos.
*   **Vanilla JavaScript (ES6):** Lógica de interacción (modales, menús, esqueletos de carga) y simulaciones de "fetch" de IA.
*   **Google Fonts:** Utilizando la familia tipográfica **Outfit** para una apariencia moderna y de alta legibilidad.
*   **FontAwesome (CDN):** Sistema de íconos vectoriales escalables.

---

## 📂 Estructura del Proyecto

El prototipo está compuesto por las siguientes vistas, muchas divididas en **"Estado Vacío" (Nuevo Usuario)** y **"Estado Lleno" (Usuario Recurrente)**:

| Archivo | Descripción |
| :--- | :--- |
| `index.html` | Pantalla de inicio de sesión (*Login*). Punto de entrada principal que inicializa el estado del mockup y el control del *Dark Mode*. |
| `main.html` | *Dashboard* principal (Usuario recurrente) donde se gatilla el prompt generador de recetas de la IA. |
| `main-empty.html` | *Dashboard* (Nuevo usuario) con onboarding vacío. Simula la primera generación de receta. |
| `history.html` | Historial de recetas planeadas (Estado lleno con tarjetas de comida). |
| `history-empty.html`| Historial de recetas vacío (Placeholder visual interactivo). |
| `profile.html` | Panel de control, seguridad de contraseña y exclusiones alimenticias. |
| `profile-empty.html`| Panel de perfil idéntico, pero con el historial de la tab base vacío. |
| `support.html` | Centro de Ayuda ficticio (FAQ y soporte técnico). |
| `biteplus.html` | *Landing page* simulada para la suscripción Premium (SmartBite+). |
| **`ui-kit.html`** | 🎨 **¡Importante para Devs!** Diccionario de Diseño centralizado. Expone todos los componentes, botones, inputs y colores (*Design System*). |

---

## ✨ Características Especiales Simuladas (Para Desarrolladores)

Este Mockup no es solo visual, incluye lógicas estructurales que los programadores deberán replicar conectando a la API real:

1.  **Modo Oscuro Integral (Dark Mode 🌙):** 
    Implementado a través de todo el sitio usando la configuración `darkMode: 'class'` de Tailwind. El botón alternador se esconde en el **Perfil > Preferencias de Apariencia**.
    *   *Nota Anti-FOUC:* Se ha incluido un pequeño bloque dentro del `<head>` de cada archivo que lee el `localStorage` antes de pintar la pantalla para evitar "flashes blancos".
2.  **Estados de Carga (Skeleton Loaders ⏳):** 
    En lugar de "spinners" aburridos, se programaron simulaciones de generación por IA. 
    *   Ejemplo: En `main.html`, al pedir una receta, aparece un esqueleto de carga de tarjeta por **3.5 segundos** antes de mostrar la respuesta imaginaria. El historial y perfil también simulan demoras de red al cargar (`DOMContentLoaded`).
3.  **Persistencia Simulada de "Sesión Vacía" (`localStorage`):** 
    Al hacer clic en "Ingresar" en `index.html` sin usar credenciales se entra en "Modo Recurrente". Si se ingresa como `vacio@smartbite.com`, el sistema almacena `localStorage.setItem('smartbite_session_state', 'empty')` y todo el *routing* redirigirá forzosamente a las vistas `-empty.html`.

---

## 🚀 Cómo ejecutar

No requiere instalación de librerías ni base de datos local. 
Simplemente **abre `index.html`** en cualquier navegador moderno (Chrome, Edge, Firefox, Safari) y comienza la experiencia haciendo clic en los botones.

> 💡 **Consejo:** Empieza siempre la experiencia recargando en `index.html` para asegurarte de que las variables de simulación de cuenta se reinicien adecuadamente.

---
*Hecho con cuidado para los equipos de Desarrollo UI/UX.*
