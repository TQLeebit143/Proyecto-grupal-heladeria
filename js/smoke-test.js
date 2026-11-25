// Semana 3 - Desarrollo Agil y Smoke Testing
document.addEventListener('DOMContentLoaded', () => {
  const botonSmokeTest = document.getElementById('btnSmokeTest');
  const salidaAuditoria = document.getElementById('salidaAudit');
  if (!botonSmokeTest || !salidaAuditoria) return;
  botonSmokeTest.addEventListener('click', () => {
    const imgsSinAlt = document.querySelectorAll('img:not([alt]), img[alt=""]').length;
    const enlacesVacios = document.querySelectorAll('a[href=""], a:not([href])').length;
    const totalBotones = document.querySelectorAll('button').length;
    salidaAuditoria.textContent = `Smoke Test OK | Botones: ${totalBotones} | Imágenes sin alt: ${imgsSinAlt} | Enlaces vacíos: ${enlacesVacios}`;
  });
});
