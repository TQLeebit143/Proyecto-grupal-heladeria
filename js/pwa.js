// Semana 2 - Arquitectura PWA Offline-First
function iniciarPwaEstado() {
  const badge = document.getElementById('badgeConexion');

  function actualizarBadgeRed() {
    if (window.SupabaseAPI && typeof window.SupabaseAPI.actualizarEstadoConexion === 'function') {
      window.SupabaseAPI.actualizarEstadoConexion();
      return;
    }
    if (!badge) return;
    if (navigator.onLine) {
      badge.classList.remove('offline');
      badge.textContent = 'ONLINE';
    } else {
      badge.classList.add('offline');
      badge.textContent = 'OFFLINE';
    }
  }

  window.addEventListener('online', actualizarBadgeRed);
  window.addEventListener('offline', actualizarBadgeRed);
  actualizarBadgeRed();

  if (location.protocol === 'file:') return;
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
  if (!('serviceWorker' in navigator) || (!window.isSecureContext && !isLocalHost)) return;

  navigator.serviceWorker.register('./sw.js')
    .then((reg) => {
      if (reg && typeof reg.update === 'function') reg.update().catch(() => {});
    })
    .catch(() => {});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarPwaEstado);
} else {
  iniciarPwaEstado();
}
