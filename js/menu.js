// Semana 1 - Menu Hamburguesa
function iniciarMenuHamburguesa() {
  const botonHamburguesa = document.getElementById('burguerBtn');
  const menuNavegacion = document.getElementById('navMenu');
  const dockLateral = document.getElementById('dockAcciones');
  const contenedorApp = document.querySelector('.contenedor-app');
  const fondoSombra = document.getElementById('shade');

  const esEscritorio = () => (
    typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 768px)').matches
  );

  function cerrarMenuMovil() {
    if (menuNavegacion) menuNavegacion.classList.remove('show');
    if (fondoSombra) fondoSombra.classList.remove('on');
    if (botonHamburguesa) {
      botonHamburguesa.classList.remove('open');
      if (!esEscritorio()) botonHamburguesa.setAttribute('aria-expanded', 'false');
    }
  }

  if (botonHamburguesa) {
    botonHamburguesa.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (esEscritorio()) {
        cerrarMenuMovil();
        if (dockLateral) {
          const colapsado = dockLateral.classList.toggle('collapsed');
          if (contenedorApp) contenedorApp.classList.toggle('sidebar-colapsado', colapsado);
          botonHamburguesa.setAttribute('aria-expanded', String(!colapsado));
        }
        return;
      }

      if (menuNavegacion) {
        const abierto = menuNavegacion.classList.toggle('show');
        if (fondoSombra) fondoSombra.classList.toggle('on', abierto);
        botonHamburguesa.classList.toggle('open', abierto);
        botonHamburguesa.setAttribute('aria-expanded', String(abierto));
      }
    });
  }

  if (fondoSombra) {
    fondoSombra.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      cerrarMenuMovil();
    });
  }

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') cerrarMenuMovil();
  });

  window.addEventListener('resize', () => {
    if (esEscritorio()) cerrarMenuMovil();
  });

  window.closeM = cerrarMenuMovil;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarMenuHamburguesa);
} else {
  iniciarMenuHamburguesa();
}
