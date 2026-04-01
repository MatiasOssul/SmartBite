import { getToken } from './session.js';

/** Protege páginas privadas. Si no hay token, expulsa al login sin dejar historial. */
export function guardPrivate() {
  if (!getToken()) {
    window.location.replace('/index.html');
  }
}

/** Protege la página pública (login). Si ya hay sesión, salta directo al dashboard. */
export function guardPublic() {
  if (getToken()) {
    window.location.replace('/main.html');
  }
}
