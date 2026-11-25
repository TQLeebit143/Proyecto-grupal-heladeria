// Semana 2 - Arquitectura PWA Offline-First
const NOMBRE_CACHE = 'solo-gelatos-v17-r1';
const REMOTE_CACHE = `${NOMBRE_CACHE}-remote`;
const ARCHIVOS_APP = [
  './',
  './index.html',
  './manifest.json',
  './data/catalogo.json',
  './css/fuentes.css',
  './css/temas.css',
  './css/estilos.css',
  './css/animaciones.css',
  './css/responsive.css',
  './css/accesibilidad.css',
  './js/vendor/jquery-3.7.1.min.js',
  './js/vendor/purify-3.1.6.min.js',
  './js/iconos.js',
  './js/supabase-api.js',
  './js/categorias.js',
  './js/main.js',
  './js/temas.js',
  './js/navegacion.js',
  './js/bitacora-eventos.js',
  './js/menu.js',
  './js/chrome.js',
  './js/validacion.js',
  './js/pwa.js',
  './js/accesibilidad.js',
  './js/smoke-test.js',
  './js/auditoria-a11y.js',
  './fonts/inter-normal.woff2',
  './fonts/cormorant-garamond-normal.woff2',
  './fonts/cormorant-garamond-italic-600.woff2',
  './images/logo.png',
  './images/app-icon-192.png',
  './images/app-icon-512.png',
  './images/hero-helado.jpg',
  './images/productos/helado-frutilla.jpg',
  './images/productos/frappe-chocolate.jpg',
  './images/productos/cappuccino.jpg',
  './images/productos/torta-chocolate.jpg',
  './images/productos/helado-vegano.jpg',
  './images/productos/brownie.jpg',
  './images/productos/cheesecake-frutilla.jpg',
  './images/productos/waffle.jpg',
  './images/productos/jugo-naranja.jpg',
  './images/productos/cupcake-vainilla.jpg',
  './images/productos/flan-casero.jpg'
];
// Sin CDN ni recursos externos: todo se sirve desde el mismo proyecto.
// Supabase se excluye del Service Worker más abajo (es el backend).
const REMOTE_HOSTS = new Set();

self.addEventListener('install', (eventoInstalacion) => {
  eventoInstalacion.waitUntil((async () => {
    const cache = await caches.open(NOMBRE_CACHE);
    await cache.addAll(ARCHIVOS_APP);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (eventoActivacion) => {
  eventoActivacion.waitUntil((async () => {
    const claves = await caches.keys();
    await Promise.all(
      claves
        .filter((clave) => clave !== NOMBRE_CACHE && clave !== REMOTE_CACHE)
        .map((clave) => caches.delete(clave))
    );
    await self.clients.claim();
  })());
});

// Semana 3 - Core Web Vitals BEM DOMPurify y Service Worker
self.addEventListener('fetch', (eventoPeticion) => {
  if (eventoPeticion.request.url.includes('supabase.co')) return;
  if (eventoPeticion.request.method !== 'GET') return;

  const url = new URL(eventoPeticion.request.url);
  if (url.origin !== self.location.origin) {
    if (!REMOTE_HOSTS.has(url.hostname)) return;
    eventoPeticion.respondWith((async () => {
      const cache = await caches.open(REMOTE_CACHE);
      const enCache = await cache.match(eventoPeticion.request);
      try {
        const respuesta = await fetch(eventoPeticion.request);
        if (respuesta.ok || respuesta.type === 'opaque') {
          try { await cache.put(eventoPeticion.request, respuesta.clone()); } catch (_) {}
        }
        return respuesta;
      } catch (_) {
        return enCache || Response.error();
      }
    })());
    return;
  }

  eventoPeticion.respondWith((async () => {
    const cache = await caches.open(NOMBRE_CACHE);
    if (eventoPeticion.request.mode === 'navigate') {
      try {
        const respuesta = await fetch(eventoPeticion.request);
        if (respuesta.ok) {
          try { await cache.put(eventoPeticion.request, respuesta.clone()); } catch (_) {}
        }
        return respuesta;
      } catch (_) {
        return (await cache.match('./index.html')) || Response.error();
      }
    }
    try {
      const respuesta = await fetch(eventoPeticion.request);
      if (respuesta.ok) {
        try { await cache.put(eventoPeticion.request, respuesta.clone()); } catch (_) {}
      }
      return respuesta;
    } catch (_) {
      const enCache = await cache.match(eventoPeticion.request);
      return enCache || Response.error();
    }
  })());
});
