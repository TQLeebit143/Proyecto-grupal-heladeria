// Semana 1 - Modo Oscuro
document.addEventListener('DOMContentLoaded', () => {
  const botonTema = document.getElementById('themeBtn');
  const cuerpoDocumento = document.body;

  function aplicarTema(modoOscuro) {
    cuerpoDocumento.classList.toggle('dark-mode', modoOscuro);
    document.documentElement.dataset.theme = modoOscuro ? 'dark' : 'light';
    if (botonTema && typeof ico === 'function') {
      botonTema.innerHTML = ico(modoOscuro ? 'sol' : 'luna', 20);
    }
    try { localStorage.setItem('sg-theme', modoOscuro ? 'dark' : 'light'); } catch (_) {}
  }

  if (botonTema) {
    botonTema.addEventListener('click', () => {
      const estaOscuro = !cuerpoDocumento.classList.contains('dark-mode');
      aplicarTema(estaOscuro);
    });
  }

  let guardado = 'light';
  try { guardado = localStorage.getItem('sg-theme') || 'light'; } catch (_) {}
  aplicarTema(guardado === 'dark');
});
