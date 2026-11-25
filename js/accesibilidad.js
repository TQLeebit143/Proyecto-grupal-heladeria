// Semana 3 - Accesibilidad a11y y Contraste WCAG
document.addEventListener('DOMContentLoaded', () => {
  const botonContraste = document.getElementById('btnSimularContraste');
  if (!botonContraste) return;
  botonContraste.addEventListener('click', () => {
    const contrasteActivo = document.body.classList.toggle('alto-contraste');
    botonContraste.setAttribute('aria-pressed', String(contrasteActivo));
  });
});
