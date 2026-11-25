// Semana 2 - Interfaz Header y Notificaciones
document.addEventListener('DOMContentLoaded', () => {
  if (typeof ico !== 'function') return;
  const searchIco = document.querySelector('.search-ico');
  const bellIco = document.querySelector('.bell-ico');
  const contrasteIco = document.querySelector('.contraste-ico');
  const carritoIco = document.querySelector('.carrito-ico');
  if (searchIco) searchIco.innerHTML = ico('buscar', 18);
  if (bellIco) bellIco.innerHTML = ico('campana', 20);
  if (contrasteIco) contrasteIco.innerHTML = ico('estrella', 18);
  if (carritoIco) carritoIco.innerHTML = ico('carrito', 18);
});
