// Semana 2 - Fetch Lazy Loading y Bubbling
function abrirLightboxImagen(srcImagen, tituloImagen) {
  if (!srcImagen) return;
  const visorLightbox = document.getElementById('lightboxImagenVisor');
  const fotoAmpliada = document.getElementById('lightboxImagenFoto');
  const etiquetaTitulo = document.getElementById('lightboxImagenTitulo');
  if (!visorLightbox || !fotoAmpliada) return;
  fotoAmpliada.setAttribute('src', srcImagen);
  fotoAmpliada.setAttribute('alt', tituloImagen || 'Vista ampliada de Solo Gelatos');
  if (etiquetaTitulo) etiquetaTitulo.textContent = tituloImagen || 'Solo Gelatos';
  visorLightbox.classList.add('activo');
}

function cerrarLightboxImagen(evento) {
  if (evento) {
    if (typeof evento.preventDefault === 'function') evento.preventDefault();
    if (typeof evento.stopPropagation === 'function') evento.stopPropagation();
  }
  const visorLightbox = document.getElementById('lightboxImagenVisor');
  if (visorLightbox) visorLightbox.classList.remove('activo');
}

document.addEventListener('click', (eventoClick) => {
  const target = eventoClick.target;
  if (!target || typeof target.closest !== 'function') return;

  if (target.closest('#btnCerrarLightbox') || target.id === 'lightboxImagenVisor') {
    cerrarLightboxImagen(eventoClick);
    return;
  }

  const imagenTocada = target.closest('img');
  if (
    imagenTocada &&
    !imagenTocada.closest('#lightboxImagenVisor') &&
    !imagenTocada.classList.contains('brand-logo') &&
    !imagenTocada.classList.contains('auth-logo') &&
    !imagenTocada.classList.contains('card-item__img') &&
    !imagenTocada.classList.contains('drawer-item__img') &&
    imagenTocada.getAttribute('src')
  ) {
    eventoClick.preventDefault();
    eventoClick.stopPropagation();
    const origenFoto = imagenTocada.getAttribute('src');
    const textoFoto = imagenTocada.getAttribute('alt') || imagenTocada.closest('article, .ficha-producto')?.querySelector('h3, h4')?.textContent || 'Solo Gelatos';
    abrirLightboxImagen(origenFoto, textoFoto);
  }
});

document.addEventListener('keydown', (eventoTecla) => {
  if (eventoTecla.key !== 'Escape') return;
  const visor = document.getElementById('lightboxImagenVisor');
  if (visor && visor.classList.contains('activo')) {
    cerrarLightboxImagen(eventoTecla);
    return;
  }
  const drawer = document.getElementById('drawerCarrito');
  if (drawer && drawer.classList.contains('activo')) {
    cerrarDrawerCarrito();
    return;
  }
  cerrarModalTimer();
  closeModal();
});

// Semana 2 - Calculador Modal 30s y Toast
let temporizadorModal = null;
let segundosRestantes = 30;
let modoModalTimer = 'evento';

function cerrarModalTimer() {
  clearInterval(temporizadorModal);
  const modal = document.getElementById('modalConfirmacion');
  if (modal) modal.style.display = 'none';
}

function iniciarModalTemporizador(modo, titulo, detalle) {
  modoModalTimer = modo || 'evento';
  clearInterval(temporizadorModal);
  segundosRestantes = 30;
  const titEl = document.getElementById('tituloModalTimer');
  const contEl = document.getElementById('contadorModal');
  const detEl = document.getElementById('detalleModalTimer');
  const modalEl = document.getElementById('modalConfirmacion');
  if (titEl) titEl.textContent = titulo;
  if (contEl) contEl.textContent = '00:30';
  if (detEl) detEl.textContent = detalle;
  if (modalEl) modalEl.style.display = 'grid';

  temporizadorModal = setInterval(() => {
    segundosRestantes -= 1;
    if (contEl) contEl.textContent = `00:${String(segundosRestantes).padStart(2, '0')}`;
    if (segundosRestantes <= 0) {
      clearInterval(temporizadorModal);
      if (modalEl) modalEl.style.display = 'none';
      const toast = document.getElementById('toastAlerta');
      if (toast) {
        toast.textContent = modoModalTimer === 'carrito' ? 'Tiempo de confirmación expirado. Puedes reintentar desde tu carrito.' : 'Tarifa Flash Expirada';
        if (typeof window.$ === 'function') {
          $('#toastAlerta').slideDown('fast').delay(3000).fadeOut('slow');
        }
      }
    }
  }, 1000);
}

function abrirDrawerCarrito() {
  const sesion = obtenerSesionSegura();
  if (sesion.rol !== 'cliente') return;
  if (typeof renderClientCart === 'function') renderClientCart();
  const drawer = document.getElementById('drawerCarrito');
  const backdrop = document.getElementById('drawerCarritoBackdrop');
  if (backdrop) backdrop.classList.add('activo');
  if (drawer) drawer.classList.add('activo');
  hidratarPedidosDrawer();
}

function cerrarDrawerCarrito() {
  const drawer = document.getElementById('drawerCarrito');
  const backdrop = document.getElementById('drawerCarritoBackdrop');
  if (backdrop) backdrop.classList.remove('activo');
  if (drawer) drawer.classList.remove('activo');
}

async function hidratarPedidosDrawer() {
  const cont = document.getElementById('listaPedidosDrawer');
  if (!cont || !window.SupabaseAPI) return;
  const pedidos = await window.SupabaseAPI.consultarTabla('pedidos');
  cont.textContent = '';
  if (!pedidos.length) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Aún no registraste pedidos web.';
    cont.appendChild(p);
    return;
  }
  pedidos.slice(0, 4).forEach((ped) => {
    const row = document.createElement('div');
    row.className = 'event-item';
    const info = document.createElement('div');
    info.style.flex = '1';
    const title = document.createElement('strong');
    title.textContent = `${money(ped.total)} · ${ped.estado || 'Recibido'}`;
    const desc = document.createElement('small');
    desc.textContent = ped.detalle || 'Pedido web';
    info.append(title, desc);
    row.appendChild(info);
    cont.appendChild(row);
  });
}

function abrirCheckoutDesdeCarrito() {
  const cart = getClientCart();
  if (!cart.length) {
    showToast('Tu carrito está vacío.', 'error');
    return;
  }
  const total = cart.reduce((s, x) => s + Number(x.precio) * Number(x.cantidad), 0);
  const resumen = cart.map((x) => `${x.nombre} x${x.cantidad}`).join(', ');
  cerrarDrawerCarrito();
  iniciarModalTemporizador('carrito', 'Confirmar y Pagar Pedido', `${resumen} · Total a pagar: ${money(total)}.`);
}

function openProductModal(index) {
  const prod = PR[index];
  const modalRoot = document.getElementById('modal-root');
  if (!prod || !modalRoot) return;
  const sesion = obtenerSesionSegura();
  let cantidad = 1;

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal modal-ficha" role="dialog" aria-modal="true" aria-labelledby="tituloFichaProducto">
        <div class="ficha-producto">
          <div class="ficha-producto__media">
            <img src="${esc(photoUrl(prod))}" alt="${esc(prod[0])} artesanal de Solo Gelatos">
            <span class="ficha-producto__zoom-hint">Toca la foto para ampliar</span>
          </div>
          <div class="ficha-producto__body">
            <div class="ficha-producto__head">
              <div>
                <span class="eyebrow">${esc(prod[3])}${prod[7] ? ` · ${esc(prod[7])}` : ''}</span>
                <h3 id="tituloFichaProducto">${esc(prod[0])}</h3>
              </div>
              <button type="button" class="ib" id="modal-close" aria-label="Cerrar ficha de producto">${ico('cerrar', 20)}</button>
            </div>
            <p class="muted">${esc(prod[6] || 'Preparado artesanalmente con ingredientes seleccionados de estación.')}</p>
            <div class="ficha-producto__precio">${money(prod[2])}</div>
            ${sesion.rol === 'cliente' ? `
              <div class="ficha-producto__qty" role="group" aria-label="Selector de cantidad">
                <button type="button" class="qty" id="btnFichaMenos" aria-label="Disminuir cantidad">-</button>
                <span id="fichaQty" aria-live="polite">1</span>
                <button type="button" class="qty" id="btnFichaMas" aria-label="Aumentar cantidad">+</button>
              </div>
              <div class="ficha-producto__acciones">
                <button type="button" class="btn outline" id="btnFichaAgregar" data-sg-evento="ADD_TO_CART" data-sg-detalle="Añadió al carrito desde la ficha" data-nombre-producto="${esc(prod[0])}">${ico('carrito', 16)} Añadir al carrito</button>
                <button type="button" class="btn p" id="btnFichaPagar" data-sg-evento="ADD_TO_CART" data-sg-detalle="Pagar ahora desde la ficha" data-nombre-producto="${esc(prod[0])}">${ico('tarjeta', 16)} Pagar ahora</button>
              </div>
            ` : '<p class="ayuda-modulo">Vista informativa del catálogo operativo.</p>'}
          </div>
        </div>
      </div>
    </div>
  `;

  bindModalClose();
  const qtyEl = document.getElementById('fichaQty');
  const btnMenos = document.getElementById('btnFichaMenos');
  const btnMas = document.getElementById('btnFichaMas');
  const btnAgregar = document.getElementById('btnFichaAgregar');
  const btnPagar = document.getElementById('btnFichaPagar');

  if (btnMenos) btnMenos.addEventListener('click', () => {
    cantidad = Math.max(1, cantidad - 1);
    if (qtyEl) qtyEl.textContent = String(cantidad);
  });
  if (btnMas) btnMas.addEventListener('click', () => {
    cantidad = Math.min(20, cantidad + 1);
    if (qtyEl) qtyEl.textContent = String(cantidad);
  });
  if (btnAgregar) btnAgregar.addEventListener('click', () => {
    addClientProduct(prod, cantidad);
    closeModal();
    showToast(`${prod[0]} x${cantidad} añadido al carrito.`);
    abrirDrawerCarrito();
  });
  if (btnPagar) btnPagar.addEventListener('click', () => {
    addClientProduct(prod, cantidad);
    closeModal();
    abrirCheckoutDesdeCarrito();
  });
}

window.abrirDrawerCarrito = abrirDrawerCarrito;
window.cerrarDrawerCarrito = cerrarDrawerCarrito;
window.openProductModal = openProductModal;
window.cerrarLightboxImagen = cerrarLightboxImagen;

// Semana 3 - Navegacion por Roles y Control de Acceso
function vistaPermitidaParaRol(vista, rol) {
  const vistasCliente = ['inicio', 'productos', 'carrito', 'calculador', 'consultas'];
  const vistasEncargado = ['panel-operativo', 'gestion-pedidos', 'gestion-reservas', 'gestion-consultas', 'gestion-productos', 'ventas', 'historial-ventas', 'inventario', 'caja'];
  const vistasAdmin = [...vistasEncargado, 'compras', 'proveedores', 'sucursales', 'reportes', 'auditoria-admin'];
  if (rol === 'admin') return vistasAdmin.includes(vista);
  if (rol === 'encargado') return vistasEncargado.includes(vista);
  return vistasCliente.includes(vista);
}

function vistaInicialPorRol(rol) {
  return rol === 'cliente' ? 'inicio' : 'panel-operativo';
}

function obtenerSesionSegura() {
  try {
    if (window.SupabaseAPI && typeof window.SupabaseAPI.getSesion === 'function') {
      return window.SupabaseAPI.getSesion();
    }
  } catch (_) {}
  return { nombre: 'Invitado', correo: 'invitado@sologelatos.bo', rol: 'cliente', invitado: true };
}

// Nombre con el que se identifican los pedidos, reservas y consultas.
// Los clientes con sesión usan su nombre; los invitados usan el nombre
// que escribieron (se recuerda en sessionStorage para no mezclar filas).
function nombreClienteActual() {
  const sesion = obtenerSesionSegura();
  if (!sesion.invitado) return sesion.nombre;
  try {
    return window.sessionStorage.getItem('sg_nombre_invitado') || sesion.nombre;
  } catch (_) {
    return sesion.nombre;
  }
}

function recordarNombreInvitado(nombre) {
  const sesion = obtenerSesionSegura();
  if (!sesion.invitado) return;
  const limpio = String(nombre || '').trim();
  if (!limpio) return;
  try { window.sessionStorage.setItem('sg_nombre_invitado', limpio); } catch (_) {}
}

function esDelClienteActual(fila) {
  const nombre = nombreClienteActual();
  return String(fila && fila.cliente || '').trim().toLowerCase() === nombre.trim().toLowerCase();
}

const ALIAS_VISTAS = {
  catalogo: 'productos',
  pedido: 'carrito',
  reservas: 'calculador',
  paquetes: 'calculador'
};

function normalizarVista(nombre) {
  const clave = String(nombre || '').trim().replace(/^#/, '');
  return ALIAS_VISTAS[clave] || clave;
}

function actualizarCabeceraYSesion() {
  const sesion = obtenerSesionSegura();
  if (document.body) document.body.dataset.rol = sesion.rol;
  const rolTexto = sesion.rol === 'admin' ? 'Administrador' : (sesion.rol === 'encargado' ? 'Encargado' : 'Cliente');
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt('badgeRol', rolTexto);
  setTxt('userName', sesion.nombre);
  setTxt('userRoleLabel', rolTexto);
  setTxt('userAvatar', (sesion.nombre || 'U').charAt(0).toUpperCase());
  const btnCuenta = document.getElementById('btnUsuarioCuenta');
  if (btnCuenta) {
    btnCuenta.title = sesion.invitado ? 'Iniciar sesión o crear cuenta' : `${sesion.nombre} · ${sesion.correo}`;
    btnCuenta.setAttribute('aria-label', sesion.invitado ? 'Iniciar sesión o crear cuenta' : `Cuenta de ${sesion.nombre}. ${rolTexto}`);
  }
  const menu = getMenuPorRol(sesion.rol);

  const navHtml = menu.map((m) => `
    <a href="#${esc(m[0])}" data-v="${esc(m[0])}">${ico(m[1], 19)}<span>${esc(m[2])}</span></a>
    ${m[3] ? `<div class="sub" id="sub">${Object.keys(CATS).map((c) => `<a href="#productos" data-subcat="${esc(c)}">${ico(CATS[c][1], 14)} ${esc(c)}</a>`).join('')}</div>` : ''}
  `).join('');
  const navEl = document.getElementById('navMenu');
  if (navEl) navEl.innerHTML = navHtml;

  const dockHtml = menu.map((m) => `<a href="#${esc(m[0])}" data-v="${esc(m[0])}" title="${esc(m[2])}">${ico(m[1], 20)}<span>${esc(m[4] || m[2])}</span></a>`).join('');
  const dockEl = document.getElementById('dockAcciones');
  if (dockEl) dockEl.innerHTML = dockHtml;

  const btnCarrito = document.getElementById('btnCarritoHeader');
  if (btnCarrito) btnCarrito.hidden = sesion.rol !== 'cliente';
  if (sesion.rol !== 'cliente') cerrarDrawerCarrito();
  else if (typeof renderClientCart === 'function') renderClientCart();
}

let vistaActual = 'inicio';

function go(vistaSolicitada) {
  const sesion = obtenerSesionSegura();
  const solicitada = normalizarVista(vistaSolicitada);
  const v = vistaPermitidaParaRol(solicitada, sesion.rol) ? solicitada : vistaInicialPorRol(sesion.rol);
  vistaActual = v;

  let content = '';
  try {
    content = typeof V[v] === 'function' ? V[v]() : '<section class="card"><h2>Pantalla no encontrada</h2></section>';
  } catch (err) {
    console.error(`[Solo Gelatos] Error al renderizar vista "${v}":`, err);
    content = '<section class="card"><h2>No se pudo mostrar esta vista</h2></section>';
  }

  const viewEl = document.getElementById('view');
  if (viewEl) {
    viewEl.innerHTML = content;
    viewEl.style.display = 'block';
  }

  document.querySelectorAll('#navMenu a, #dockAcciones a').forEach((enlace) => {
    const dv = enlace.getAttribute('data-v');
    const hr = (enlace.getAttribute('href') || '').replace(/^#/, '');
    enlace.classList.toggle('act', dv === v || hr === v);
  });

  const panelAudit = document.getElementById('panelAuditoriaAdmin');
  if (panelAudit) panelAudit.hidden = !(sesion.rol === 'admin' && v === 'auditoria-admin');

  if (typeof window.closeM === 'function') {
    try { window.closeM(); } catch (err) { console.error(err); }
  }
  try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (_) {}

  try {
    if (v === 'inicio') hidratarInicioCliente();
    if (v === 'productos') enlazarFiltroTresCapas();
    if (v === 'carrito') { renderClientCart(); hidratarPedidosCliente(); }
    if (v === 'calculador') { enlazarCalculadorYReservas(); hidratarReservasCliente(); }
    if (v === 'consultas') { enlazarFormularioConsulta(); hidratarConsultasCliente(); }
    if (v === 'panel-operativo') hidratarPanelOperativo();
    if (v === 'gestion-pedidos') hidratarGestionPedidos();
    if (v === 'gestion-reservas') hidratarGestionReservas();
    if (v === 'gestion-consultas') hidratarGestionConsultas();
    if (v === 'gestion-productos') enlazarNuevoProductoExtra();
    if (v === 'ventas') { $('.fl').first().addClass('on'); drawProds(); renderCart(); }
    if (v === 'auditoria-admin') {
      enlazarBitacoraDom();
      hidratarActividadAdmin();
      // Semana 4 - Bitacora DOM y eventos
      if (window.BitacoraEventos) window.BitacoraEventos.hidratarPanel();
    }
  } catch (err) {
    console.error(`[Solo Gelatos] Error al hidratar vista "${v}":`, err);
  }

  try {
    if (typeof location !== 'undefined' && location.hash !== `#${v}`) {
      location.hash = `#${v}`;
    }
  } catch (err) {
    console.error('[Solo Gelatos] No se pudo actualizar hash:', err);
  }
}

function abrirCatalogoFiltrado(categoria, subcategoria = '') {
  go('productos');
  if (typeof window.reiniciarPaginaCatalogo === 'function') window.reiniciarPaginaCatalogo();
  const catValida = categoria && CATS[categoria] ? categoria : 'Todos';
  $('.catalog-filter').removeClass('active');
  const $btnCat = $(`.catalog-filter[data-product-filter="${catValida}"]`);
  if ($btnCat.length) $btnCat.addClass('active');
  else $('.catalog-filter[data-product-filter="Todos"]').addClass('active');

  if ($('#capa1').length) {
    $('#capa1').val(catValida === 'Todos' ? '' : catValida);
    poblarEspecialidadesCapa2(catValida === 'Todos' ? '' : catValida);
    if (subcategoria && $('#capa2').length) {
      $('#capa2').val(subcategoria).trigger('change');
      return;
    }
  }
  drawCatalog('');
}

window.go = go;
window.abrirCatalogoFiltrado = abrirCatalogoFiltrado;

// Semana 2 - jQuery Acordeon y Temas
async function hidratarInicioCliente() {
  $('.accordion-btn').off('click').on('click', function () {
    $(this).next('.accordion-panel').slideToggle('fast');
  });
  const promos = await window.SupabaseAPI.consultarTabla('promociones');
  const activa = Array.isArray(promos) && promos[0] ? promos[0] : null;
  if (activa) {
    $('#promoTituloVivo').text(`${activa.titulo || 'Promoción Express'} (${activa.descuento || 'Especial'})`);
    $('#promoDescVivo').text(activa.descripcion || 'Disponible hoy en Solo Gelatos.');
  }
  $('#btnReclamarPromo').off('click').on('click', async () => {
    const tituloPromo = ($('#promoTituloVivo').text() || 'Promoción Express Solo Gelatos').trim();
    addClientProduct({
      nombre: tituloPromo,
      precio: 35,
      categoria: 'Promociones',
      imagen: PR_BASE[0][5]
    }, 1);
    await window.SupabaseAPI.registrarActividad('PROMO_RECLAMADA', tituloPromo);
    showToast('Promoción añadida a tu carrito.');
    abrirDrawerCarrito();
  });
}

// Semana 2 - Filtro de 3 Capas
function poblarEspecialidadesCapa2(categoriaSeleccionada) {
  const $selectorCapa2 = $('#capa2');
  const resEl = document.getElementById('resultadoFiltro');
  if (!$selectorCapa2.length) return;
  $selectorCapa2.empty().append($('<option>').val('').text('Elige una especialidad'));
  if (categoriaSeleccionada && CATS[categoriaSeleccionada]) {
    CATS[categoriaSeleccionada][2].forEach((sub) => {
      $selectorCapa2.append($('<option>').val(sub).text(sub));
    });
    $selectorCapa2.prop('disabled', false);
    if (resEl) {
      resEl.classList.add('activo');
      resEl.innerHTML = `<span>Mostrando <strong>${esc(categoriaSeleccionada)}</strong> · Elige una especialidad para afinar tu recomendación.</span>`;
    }
  } else {
    $selectorCapa2.prop('disabled', true);
    if (resEl) {
      resEl.classList.remove('activo');
      resEl.innerHTML = '<span>Filtra por categoría y especialidad para descubrir tu sabor recomendado.</span>';
    }
  }
}

window.poblarEspecialidadesCapa2 = poblarEspecialidadesCapa2;

function enlazarFiltroTresCapas() {
  if (typeof drawCatalog === 'function') drawCatalog('');
  $('#capa1').off('change').on('change', function () {
    const cat = $(this).val();
    if (typeof window.reiniciarPaginaCatalogo === 'function') window.reiniciarPaginaCatalogo();
    poblarEspecialidadesCapa2(cat);
    $('.catalog-filter').removeClass('active');
    const filtro = cat || 'Todos';
    $(`.catalog-filter[data-product-filter="${filtro}"]`).addClass('active');
    drawCatalog('');
  });

  $('#capa2').off('change').on('change', function () {
    const cat = $('#capa1').val();
    const especialidad = $(this).val();
    if (typeof window.reiniciarPaginaCatalogo === 'function') window.reiniciarPaginaCatalogo();
    const resEl = document.getElementById('resultadoFiltro');
    drawCatalog(especialidad);

    if (!resEl) return;
    if (!especialidad) {
      poblarEspecialidadesCapa2(cat);
      return;
    }

    const recomendadoIdx = PR.findIndex((p) => (
      (p[3] === cat && ((p[7] || '').toLowerCase().includes(especialidad.toLowerCase()) || p[0].toLowerCase().includes(especialidad.toLowerCase())))
    ));
    const fallbackIdx = recomendadoIdx >= 0 ? recomendadoIdx : PR.findIndex((p) => p[3] === cat);
    const prod = fallbackIdx >= 0 ? PR[fallbackIdx] : null;
    resEl.classList.add('activo');
    if (prod) {
      resEl.innerHTML = `
        <span>Recomendado en <strong>${esc(cat)} · ${esc(especialidad)}</strong>: ${esc(prod[0])} (${money(prod[2])})</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn outline card-item__btn-simular" data-i="${fallbackIdx}" style="min-height:44px">Ver ficha</button>
          <button type="button" class="btn p add-product" data-i="${fallbackIdx}" style="min-height:44px">Añadir</button>
        </div>
      `;
    } else {
      resEl.innerHTML = `<span>Selección: <strong>${esc(cat)} · ${esc(especialidad)}</strong></span>`;
    }
  });
}

function enlazarCalculadorYReservas() {
  const sesion = obtenerSesionSegura();
  const campoNombre = document.getElementById('resNombre');
  if (campoNombre && !sesion.invitado && !campoNombre.value) campoNombre.value = sesion.nombre;

  const campoFecha = document.getElementById('resFecha');
  const hoy = new Date().toISOString().slice(0, 10);
  if (campoFecha) {
    campoFecha.min = hoy;
    campoFecha.value = hoy;
  }

  const formReserva = document.getElementById('formReservaCliente');
  if (formReserva && window.Validacion) window.Validacion.enlazarLimpieza(formReserva);

  $('#hrs').off('input').on('input', function () {
    const calculo = (Number($(this).val()) || 1) * 40;
    $('#total').text(calculo);
    $('#totalMonto').stop(true, true).animate({ opacity: 0.3 }, 120).animate({ opacity: 1 }, 180);
  });

  $('#btnModal').off('click').on('click', function () {
    iniciarModalTemporizador('evento', 'Confirmar Paquete de Evento', `Presupuesto bloqueado: ${$('#total').text()} Bs.`);
  });

  $('#formReservaCliente').off('submit').on('submit', async function (e) {
    e.preventDefault();
    const nombre = $('#resNombre').val().trim();
    const fecha = $('#resFecha').val();
    const tipo = $('#resTipo').val();
    const notas = $('#resNotas').val().trim();

    const revision = window.Validacion
      ? window.Validacion.validarFormulario(this, {
        resNombre: 'nombre',
        resFecha: (valor) => {
          if (!valor) return 'Elige la fecha de tu reserva.';
          if (valor < hoy) return 'La fecha no puede ser anterior a hoy.';
          return '';
        }
      })
      : { ok: Boolean(nombre && fecha) };
    if (!revision.ok) return;

    const boton = this.querySelector('button[type="submit"]');
    if (boton) { boton.disabled = true; boton.textContent = 'Guardando reserva...'; }
    recordarNombreInvitado(nombre);

    await window.SupabaseAPI.insertarRegistro('reservas', {
      cliente: sesion.invitado ? nombre : sesion.nombre,
      fecha,
      detalle: `${tipo}${notas ? ' · ' + notas : ''}`,
      estado: 'Pendiente'
    });
    await window.SupabaseAPI.registrarActividad('RESERVA_CREADA', `${nombre} · ${tipo} (${fecha})${notas ? ' · ' + notas : ''}`);

    if (boton) { boton.disabled = false; boton.textContent = 'Guardar Reserva'; }
    this.reset();
    $('#resFecha').val(hoy);
    if (campoNombre && !sesion.invitado) campoNombre.value = sesion.nombre;
    showToast('Reserva registrada correctamente.');
    hidratarReservasCliente();
  });
}

// Semana 2 - Tree Shaking y Reservas Anti-XSS
async function hidratarReservasCliente() {
  const cont = document.getElementById('listaReservasCliente');
  if (!cont) return;
  const reservas = (await window.SupabaseAPI.consultarTabla('reservas')).filter(esDelClienteActual);
  cont.textContent = '';
  if (!reservas.length) {
    const p = document.createElement('p');
    p.className = 'muted empty';
    p.textContent = 'Aún no tienes reservas registradas.';
    cont.appendChild(p);
    return;
  }
  reservas.slice(0, 8).forEach((r) => {
    const fila = document.createElement('div');
    fila.className = 'event-item';
    const fechaSpan = document.createElement('span');
    fechaSpan.className = 'tag';
    fechaSpan.textContent = r.fecha_reserva || r.fecha || 'Sin fecha';
    const info = document.createElement('div');
    info.style.flex = '1';
    const strong = document.createElement('strong');
    strong.textContent = r.cliente || 'Cliente';
    const small = document.createElement('small');
    small.textContent = r.detalle || 'Reserva web registrada';
    info.appendChild(strong);
    info.appendChild(small);
    const est = document.createElement('span');
    est.className = 'tag';
    est.textContent = r.estado || 'Pendiente';
    fila.append(fechaSpan, info, est);
    cont.appendChild(fila);
  });
}

async function hidratarPedidosCliente() {
  const cont = document.getElementById('listaPedidosCliente');
  if (!cont) return;
  const pedidos = (await window.SupabaseAPI.consultarTabla('pedidos')).filter(esDelClienteActual);
  cont.textContent = '';
  if (!pedidos.length) {
    const p = document.createElement('p');
    p.className = 'muted empty';
    p.textContent = 'Todavía no realizaste pedidos web.';
    cont.appendChild(p);
    return;
  }
  pedidos.slice(0, 8).forEach((ped) => {
    const row = document.createElement('div');
    row.className = 'event-item';
    const info = document.createElement('div');
    info.style.flex = '1';
    const title = document.createElement('strong');
    title.textContent = `${ped.cliente || 'Cliente'} · ${money(ped.total)}`;
    const desc = document.createElement('small');
    desc.textContent = ped.detalle || 'Pedido web';
    info.append(title, desc);
    const est = document.createElement('span');
    est.className = 'tag';
    est.textContent = ped.estado || 'Recibido';
    row.append(info, est);
    cont.appendChild(row);
  });
}

// Semana 1 - Validacion Formulario
function enlazarFormularioConsulta() {
  const formularioContacto = document.getElementById('formConsultaCliente');
  const campoNombre = document.getElementById('consultaNombre');
  const campoCorreo = document.getElementById('consultaCorreo');
  const campoMensaje = document.getElementById('consultaMensaje');
  const cajaAlerta = document.getElementById('cajaAlertaConsulta');
  if (!formularioContacto) return;
  if (window.Validacion) window.Validacion.enlazarLimpieza(formularioContacto);

  const sesion = obtenerSesionSegura();
  if (campoNombre && !sesion.invitado && !campoNombre.value) campoNombre.value = sesion.nombre;

  formularioContacto.addEventListener('submit', async (eventoSubmit) => {
    eventoSubmit.preventDefault();
    const valorNombre = campoNombre.value.trim();
    const valorCorreo = campoCorreo.value.trim();
    const valorMensaje = campoMensaje.value.trim();
    cajaAlerta.textContent = '';

    const revision = window.Validacion
      ? window.Validacion.validarFormulario(formularioContacto, {
        consultaNombre: 'nombre',
        consultaCorreo: 'correo',
        consultaMensaje: 'mensaje'
      })
      : { ok: Boolean(valorNombre && valorCorreo && valorMensaje) };
    if (!revision.ok) return;

    const parrafoAviso = document.createElement('p');
    const boton = formularioContacto.querySelector('button[type="submit"]');
    if (boton) boton.disabled = true;

    recordarNombreInvitado(valorNombre);
    await window.SupabaseAPI.insertarRegistro('consultas', {
      cliente: valorNombre,
      correo: valorCorreo,
      mensaje: valorMensaje,
      respuesta: '',
      estado: 'Pendiente'
    });
    await window.SupabaseAPI.registrarActividad('CONSULTA_ENVIADA', `${valorNombre} (${valorCorreo}): ${valorMensaje}`);

    if (boton) boton.disabled = false;
    parrafoAviso.className = 'msg-exito';
    parrafoAviso.textContent = 'Consulta enviada con éxito. Pronto verás la respuesta del encargado.';
    cajaAlerta.appendChild(parrafoAviso);
    formularioContacto.reset();
    if (campoNombre && !sesion.invitado) campoNombre.value = sesion.nombre;
    hidratarConsultasCliente();
  });
}

async function hidratarConsultasCliente() {
  const cont = document.getElementById('listaConsultasCliente');
  if (!cont) return;
  const lista = (await window.SupabaseAPI.consultarTabla('consultas')).filter(esDelClienteActual);
  cont.textContent = '';
  if (!lista.length) {
    const p = document.createElement('p');
    p.className = 'muted empty';
    p.textContent = 'No hay consultas publicadas todavía.';
    cont.appendChild(p);
    return;
  }
  lista.slice(0, 10).forEach((c) => {
    const item = document.createElement('div');
    item.className = 'event-item';
    const box = document.createElement('div');
    box.style.flex = '1';
    const h = document.createElement('strong');
    h.textContent = `${c.cliente || 'Cliente'}: ${c.mensaje || ''}`;
    const r = document.createElement('small');
    r.textContent = c.respuesta ? `Respuesta del encargado: ${c.respuesta}` : 'Pendiente de respuesta del encargado.';
    box.append(h, r);
    const est = document.createElement('span');
    est.className = 'tag';
    est.textContent = c.respuesta ? 'Respondida' : (c.estado || 'Pendiente');
    item.append(box, est);
    cont.appendChild(item);
  });
}

async function hidratarPanelOperativo() {
  // Enlazamos el editor de inmediato para evitar una carrera si el usuario
  // pulsa "Publicar" antes de que terminen de cargar los datos remotos.
  $('#formEditarPromo').off('submit').on('submit', async function (e) {
    e.preventDefault();
    const titulo = $('#editPromoTitulo').val().trim();
    const descripcion = $('#editPromoDesc').val().trim();
    const precio = Number($('#editPromoPrecio').val()) || 0;
    if (titulo.length < 4 || descripcion.length < 8) {
      showToast('Escribe un título y una descripción más completos.', 'error');
      return;
    }
    const expira = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const promoActual = $('#formEditarPromo').data('promoId');
    if (promoActual) {
      await window.SupabaseAPI.actualizarRegistro('promociones', promoActual, {
        titulo, descripcion, precio, duracion_minutos: 1440, expira_en: expira, activa: true
      });
    } else {
      await window.SupabaseAPI.insertarRegistro('promociones', {
        titulo, descripcion, precio, duracion_minutos: 1440, expira_en: expira, activa: true
      });
    }
    addBitacora('Promoción Express actualizada', 'Promociones');
    showToast('Promoción Express publicada correctamente.');
  });

  const [pedidos, reservas, promos] = await Promise.all([
    window.SupabaseAPI.consultarTabla('pedidos'),
    window.SupabaseAPI.consultarTabla('reservas'),
    window.SupabaseAPI.consultarTabla('promociones')
  ]);
  $('#kpiPedidosWeb').text(pedidos.length);
  $('#kpiReservasWeb').text(reservas.length);
  if (promos[0]) {
    $('#editPromoTitulo').val(promos[0].titulo || '');
    $('#editPromoDesc').val(promos[0].descripcion || '');
    $('#editPromoPrecio').val(promos[0].precio || 35);
    $('#formEditarPromo').data('promoId', promos[0].id);
  }
}

async function hidratarGestionPedidos() {
  const cont = document.getElementById('contenedorGestionPedidos');
  if (!cont) return;
  const pedidos = await window.SupabaseAPI.consultarTabla('pedidos');
  cont.textContent = '';
  if (!pedidos.length) {
    const p = document.createElement('p');
    p.className = 'muted empty';
    p.textContent = 'No hay pedidos web entrantes.';
    cont.appendChild(p);
    return;
  }
  pedidos.forEach((ped) => {
    const row = document.createElement('div');
    row.className = 'event-item';
    const info = document.createElement('div');
    info.style.flex = '1';
    const title = document.createElement('strong');
    title.textContent = `${ped.cliente || 'Cliente'} · ${money(ped.total)}`;
    const desc = document.createElement('small');
    desc.textContent = `${ped.detalle || 'Sin detalle'} · Estado: ${ped.estado || 'Recibido'}`;
    info.append(title, desc);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn p';
    btn.textContent = ped.estado === 'Entregado' ? 'Entregado' : 'Marcar Entregado';
    btn.disabled = ped.estado === 'Entregado';
    btn.addEventListener('click', async () => {
      await window.SupabaseAPI.actualizarRegistro('pedidos', ped.id, { estado: 'Entregado' });
      addBitacora(`Pedido de ${ped.cliente} marcado como Entregado`, 'Pedidos');
      showToast('Estado del pedido actualizado.');
      hidratarGestionPedidos();
    });
    row.append(info, btn);
    cont.appendChild(row);
  });
}

async function hidratarGestionReservas() {
  const cont = document.getElementById('contenedorGestionReservas');
  if (!cont) return;
  const reservas = await window.SupabaseAPI.consultarTabla('reservas');
  cont.textContent = '';
  if (!reservas.length) {
    const p = document.createElement('p');
    p.className = 'muted empty';
    p.textContent = 'No hay reservas web registradas.';
    cont.appendChild(p);
    return;
  }
  reservas.forEach((r) => {
    const row = document.createElement('div');
    row.className = 'event-item';
    const info = document.createElement('div');
    info.style.flex = '1';
    const title = document.createElement('strong');
    title.textContent = `${r.cliente || 'Cliente'} · ${r.fecha_reserva || r.fecha || 'Sin fecha'}`;
    const desc = document.createElement('small');
    desc.textContent = `Reserva web · Estado: ${r.estado || 'Pendiente'}`;
    info.append(title, desc);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = r.estado === 'Confirmada' ? 'Confirmada' : 'Confirmar Reserva';
    btn.disabled = r.estado === 'Confirmada';
    btn.addEventListener('click', async () => {
      await window.SupabaseAPI.actualizarRegistro('reservas', r.id, { estado: 'Confirmada' });
      addBitacora(`Reserva de ${r.cliente} confirmada`, 'Reservas');
      showToast('Reserva confirmada.');
      hidratarGestionReservas();
    });
    row.append(info, btn);
    cont.appendChild(row);
  });
}

async function hidratarGestionConsultas() {
  const cont = document.getElementById('contenedorGestionConsultas');
  if (!cont) return;
  const lista = await window.SupabaseAPI.consultarTabla('consultas');
  cont.textContent = '';
  if (!lista.length) {
    const p = document.createElement('p');
    p.className = 'muted empty';
    p.textContent = 'No hay consultas de clientes.';
    cont.appendChild(p);
    return;
  }
  lista.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'event-item';
    card.style.alignItems = 'stretch';
    card.style.flexDirection = 'column';
    const headTxt = document.createElement('strong');
    headTxt.textContent = `${c.cliente || 'Cliente'} (${c.correo || ''}): ${c.mensaje || ''}`;
    const form = document.createElement('form');
    form.style.display = 'flex';
    form.style.gap = '8px';
    form.style.flexWrap = 'wrap';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = c.respuesta || '';
    input.placeholder = 'Escribe la respuesta oficial...';
    input.setAttribute('aria-label', `Respuesta para ${c.cliente || 'cliente'}`);
    input.style.flex = '1';
    input.style.minHeight = '44px';
    input.style.padding = '8px 10px';
    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'btn p';
    btn.textContent = 'Guardar Respuesta';
    form.append(input, btn);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const resp = input.value.trim();
      if (!resp) return;
      await window.SupabaseAPI.actualizarRegistro('consultas', c.id, { respuesta: resp, estado: 'Respondida' });
      addBitacora(`Consulta respondida a ${c.cliente}`, 'Consultas');
      showToast('Respuesta publicada para el cliente.');
      hidratarGestionConsultas();
    });
    card.append(headTxt, form);
    cont.appendChild(card);
  });
}

function enlazarNuevoProductoExtra() {
  const form = document.getElementById('formNuevoProductoExtra');
  if (form && window.Validacion) window.Validacion.enlazarLimpieza(form);

  $('#formNuevoProductoExtra').off('submit').on('submit', async function (e) {
    e.preventDefault();

    const revision = window.Validacion
      ? window.Validacion.validarFormulario(this, {
        npNombre: 'texto',
        npPrecio: 'numero',
        npImagen: (valor) => {
          const v = String(valor || '').trim();
          if (!v) return '';
          return /^https?:\/\/.+/i.test(v) ? '' : 'La imagen debe ser una URL que empiece con http:// o https://.';
        }
      })
      : { ok: Boolean($('#npNombre').val().trim()) };
    if (!revision.ok) return;

    const nuevo = {
      nombre: $('#npNombre').val().trim(),
      categoria: $('#npCategoria').val(),
      precio: Number($('#npPrecio').val()) || 25,
      imagen: $('#npImagen').val().trim() || PR_BASE[0][5]
    };
    await window.SupabaseAPI.insertarRegistro('productos_extra', nuevo);
    await cargarCatalogoLocalYRemoto();
    addBitacora(`Producto añadido: ${nuevo.nombre} (${money(nuevo.precio)})`, 'Productos');
    showToast('Producto agregado al catálogo.');
    go('gestion-productos');
  });
}

// Semana 1 - Bitacora Dia 1 y Dia 2
function enlazarBitacoraDom() {
  const salidaBitacora = document.getElementById('salidaBitacora');
  const contenedorLive = document.getElementById('contenedorLive');
  const campoChat = document.getElementById('campoChat');
  const selectorVariante = document.getElementById('selectorVarianteDom');
  const formularioOrden = document.getElementById('formularioOrdenDom');
  const campoUsuario = document.getElementById('campoUsuarioDom');
  if (!salidaBitacora || !contenedorLive) return;

  function registrarEvento(tipoEvento, mensajeEvento) {
    const horaActual = new Date().toLocaleTimeString();
    const filaLog = document.createElement('div');
    filaLog.textContent = `[${horaActual}] ${tipoEvento}: ${mensajeEvento}`;
    salidaBitacora.prepend(filaLog);
  }

  contenedorLive.addEventListener('click', (eventoClick) => {
    if (eventoClick.target.dataset.prod) {
      registrarEvento('OFERTA_CLICK', `Producto seleccionado: ${eventoClick.target.dataset.prod}`);
    } else if (eventoClick.target.dataset.action === 'like') {
      registrarEvento('LIKE_STREAM', 'El usuario envió un Like.');
    }
  });
  contenedorLive.addEventListener('dblclick', (eventoDobleClick) => {
    if (eventoDobleClick.target.dataset.action === 'like') {
      registrarEvento('SUPER_LIKE', 'Reacción doble registrada.');
    }
  });
  campoChat.addEventListener('keyup', (eventoTeclado) => {
    registrarEvento('CHAT_INPUT', `Escribiendo: "${eventoTeclado.target.value}"`);
  });
  selectorVariante.addEventListener('change', (eventoCambio) => {
    registrarEvento('CAMBIO_VARIANTE', `Variante elegida: ${eventoCambio.target.value}`);
  });
  formularioOrden.addEventListener('submit', (eventoEnvio) => {
    eventoEnvio.preventDefault();
    registrarEvento('COMPRA_EXITOSA', `Pedido de ${campoUsuario.value.trim()} (${selectorVariante.value})`);
    formularioOrden.reset();
  });
}

async function hidratarActividadAdmin() {
  const feed = document.getElementById('feedActividadClientes');
  if (!feed) return;
  const eventos = await window.SupabaseAPI.consultarTabla('actividad_clientes');
  feed.textContent = '';
  if (!eventos.length) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Sin actividad de clientes registrada aún.';
    feed.appendChild(p);
    return;
  }
  eventos.slice(0, 20).forEach((ev) => {
    const fila = document.createElement('div');
    fila.textContent = `[${ev.accion || 'EVENTO'}] ${ev.usuario || 'Cliente'}: ${ev.detalle || ''}`;
    feed.appendChild(fila);
  });
}

// Modales Operativos y Modal de Login/Registro
function closeModal(evento) {
  if (evento) {
    if (typeof evento.preventDefault === 'function') evento.preventDefault();
    if (typeof evento.stopPropagation === 'function') evento.stopPropagation();
  }
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}
function bindModalClose() {
  $('#modal-close, #modal-cancel').off('click').on('click', function (e) {
    closeModal(e);
  });
  $('.modal-backdrop').off('click').on('click', function (e) {
    if (e.target === this) closeModal(e);
  });
}

function openAuthModal(forzarFormulario = false) {
  const sesion = obtenerSesionSegura();
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;
  const mostrarPerfil = !sesion.invitado && !forzarFormulario;
  const rolEtiqueta = sesion.rol === 'admin' ? 'Administrador' : (sesion.rol === 'encargado' ? 'Encargado' : 'Cliente');
  const inicial = (sesion.nombre || 'U').charAt(0).toUpperCase();

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal modal-auth" role="dialog" aria-modal="true" aria-labelledby="tituloAuthModal">
        <div class="auth-header">
          <div class="auth-brand">
            <img src="images/logo.png" alt="Solo Gelatos" class="auth-logo">
            <div>
              <h3 id="tituloAuthModal">${mostrarPerfil ? 'Tu Cuenta' : 'Bienvenido a Solo Gelatos'}</h3>
              <p>${mostrarPerfil ? 'Gestiona tu sesión activa en Solo Gelatos.' : 'Accede a tu cuenta para realizar pedidos y reservas.'}</p>
            </div>
          </div>
          <button type="button" class="ib" id="modal-close" aria-label="Cerrar ventana de cuenta">${ico('cerrar', 20)}</button>
        </div>

        ${mostrarPerfil ? `
          <div class="auth-perfil" id="panelPerfilActivo">
            <div class="auth-avatar" aria-hidden="true">${esc(inicial)}</div>
            <h4>${esc(sesion.nombre)}</h4>
            <p class="muted">${esc(sesion.correo)}</p>
            <span class="tag">${esc(rolEtiqueta)}</span>
            <div class="auth-perfil__acciones">
              <button type="button" class="btn p" id="btnCerrarSesionAuth" style="width:100%">Cerrar Sesión</button>
              <button type="button" class="btn outline" id="btnCambiarCuenta" style="width:100%">Cambiar de cuenta</button>
            </div>
          </div>
        ` : `
          <div class="auth-tabs" role="tablist" aria-label="Opciones de acceso">
            <button type="button" class="auth-tab activo" id="tabLogin" role="tab" aria-selected="true" aria-controls="panelLogin">Iniciar Sesión</button>
            <button type="button" class="auth-tab" id="tabRegistro" role="tab" aria-selected="false" aria-controls="panelRegistro">Crear Cuenta</button>
          </div>

          <div id="panelLogin" role="tabpanel" aria-labelledby="tabLogin">
            <form id="formLoginAuth" novalidate>
              <label for="authCorreo">Correo o usuario
                <input id="authCorreo" type="text" autocomplete="username" required placeholder="tu@correo.com o admin">
              </label>
              <label for="authPass">Contraseña
                <div class="pass-wrap">
                  <input id="authPass" type="password" autocomplete="current-password" required placeholder="Ingresa tu contraseña">
                  <button type="button" class="pass-toggle" id="toggleAuthPass" aria-label="Mostrar u ocultar contraseña">Ver</button>
                </div>
              </label>
              <div id="authErrorLogin" class="auth-error" role="alert" aria-live="polite"></div>
              <button type="submit" class="btn p" style="width:100%">Iniciar Sesión</button>
            </form>
            <p class="auth-switch">¿Aún no tienes cuenta? <button type="button" id="irARegistro">Regístrate aquí</button></p>
            <div class="auth-demo" aria-label="Cuentas de demostración">
              <strong>Cuentas de demostración</strong>
              <span>cliente@sologelatos.bo · 1234 (cliente)</span>
              <span>encargado@sologelatos.bo · 1234 (encargado)</span>
              <span>admin@sologelatos.bo · 1234 (administrador)</span>
            </div>
            ${sesion.invitado ? '<button type="button" class="btn outline" id="btnExplorarInvitado" style="width:100%;margin-top:10px">Explorar como invitado</button>' : ''}
          </div>

          <div id="panelRegistro" role="tabpanel" aria-labelledby="tabRegistro" hidden>
            <form id="formRegistroAuth" novalidate>
              <label for="regNombre">Nombre completo
                <input id="regNombre" type="text" autocomplete="name" required placeholder="Tu nombre completo">
              </label>
              <label for="regCorreo">Correo electrónico
                <input id="regCorreo" type="email" autocomplete="email" required placeholder="tu@correo.com">
              </label>
              <label for="regPass">Contraseña
                <div class="pass-wrap">
                  <input id="regPass" type="password" autocomplete="new-password" required minlength="4" placeholder="Crea una contraseña (mínimo 4 caracteres)">
                  <button type="button" class="pass-toggle" id="toggleRegPass" aria-label="Mostrar u ocultar contraseña">Ver</button>
                </div>
              </label>
              <div id="authErrorReg" class="auth-error" role="alert" aria-live="polite"></div>
              <button type="submit" class="btn p" style="width:100%">Crear Cuenta</button>
            </form>
            <p class="auth-switch">¿Ya tienes una cuenta? <button type="button" id="irALogin">Inicia sesión</button></p>
          </div>
        `}
      </div>
    </div>
  `;
  bindModalClose();

  const btnCerrar = document.getElementById('btnCerrarSesionAuth');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.SupabaseAPI.cerrarSesion();
      // Semana 4 - Bitacora DOM y eventos
      if (window.BitacoraEventos) window.BitacoraEventos.registrar('LOGOUT', 'Cerró sesión desde el panel de cuenta');
      closeModal();
      actualizarCabeceraYSesion();
      go('inicio');
      showToast('Has cerrado sesión correctamente.');
    });
  }

  const btnCambiar = document.getElementById('btnCambiarCuenta');
  if (btnCambiar) {
    btnCambiar.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openAuthModal(true);
    });
  }

  const tabLogin = document.getElementById('tabLogin');
  const tabReg = document.getElementById('tabRegistro');
  const panelLogin = document.getElementById('panelLogin');
  const panelReg = document.getElementById('panelRegistro');

  function activarTab(cual) {
    const esLogin = cual === 'login';
    if (tabLogin) { tabLogin.classList.toggle('activo', esLogin); tabLogin.setAttribute('aria-selected', String(esLogin)); }
    if (tabReg) { tabReg.classList.toggle('activo', !esLogin); tabReg.setAttribute('aria-selected', String(!esLogin)); }
    if (panelLogin) panelLogin.hidden = !esLogin;
    if (panelReg) panelReg.hidden = esLogin;
  }

  if (tabLogin) tabLogin.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); activarTab('login'); });
  if (tabReg) tabReg.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); activarTab('registro'); });
  const irReg = document.getElementById('irARegistro');
  if (irReg) irReg.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); activarTab('registro'); });
  const irLog = document.getElementById('irALogin');
  if (irLog) irLog.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); activarTab('login'); });

  const enlazarTogglePass = (btnId, inputId) => {
    const b = document.getElementById(btnId);
    const inp = document.getElementById(inputId);
    if (!b || !inp) return;
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const mostrar = inp.type === 'password';
      inp.type = mostrar ? 'text' : 'password';
      b.textContent = mostrar ? 'Ocultar' : 'Ver';
    });
  };
  enlazarTogglePass('toggleAuthPass', 'authPass');
  enlazarTogglePass('toggleRegPass', 'regPass');

  const btnInvitado = document.getElementById('btnExplorarInvitado');
  if (btnInvitado) {
    btnInvitado.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
      showToast('Estás explorando como invitado. Puedes iniciar sesión cuando quieras.');
    });
  }

  const formLogin = document.getElementById('formLoginAuth');
  if (formLogin && window.Validacion) window.Validacion.enlazarLimpieza(formLogin);
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const correo = (document.getElementById('authCorreo')?.value || '').trim();
      const pass = (document.getElementById('authPass')?.value || '').trim();
      const errBox = document.getElementById('authErrorLogin');
      if (errBox) errBox.textContent = '';

      const revision = window.Validacion
        ? window.Validacion.validarFormulario(formLogin, { authCorreo: 'usuario', authPass: 'claveLogin' })
        : { ok: Boolean(correo && pass) };
      if (!revision.ok) return;

      const boton = formLogin.querySelector('button[type="submit"]');
      if (boton) { boton.disabled = true; boton.textContent = 'Verificando...'; }

      let res = null;
      try {
        res = await window.SupabaseAPI.iniciarSesionCuenta(correo, pass);
      } catch (_) {
        res = null;
      } finally {
        if (boton) { boton.disabled = false; boton.textContent = 'Iniciar Sesión'; }
      }

      if (!res) {
        if (errBox) {
          const p = document.createElement('p');
          p.className = 'msg-error';
          p.textContent = 'Usuario o contraseña incorrectos. Revisa tus datos o usa una cuenta de demostración.';
          errBox.appendChild(p);
        }
        return;
      }
      closeModal();
      actualizarCabeceraYSesion();
      // Semana 4 - Bitacora DOM y eventos
      if (window.BitacoraEventos) window.BitacoraEventos.registrar('LOGIN', `Ingresó como ${res.nombre} (${res.rol})`);
      go(vistaInicialPorRol(res.rol));
      showToast(`Bienvenido, ${res.nombre}.`);
    });
  }

  const formReg = document.getElementById('formRegistroAuth');
  if (formReg && window.Validacion) window.Validacion.enlazarLimpieza(formReg);
  if (formReg) {
    formReg.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = (document.getElementById('regNombre')?.value || '').trim();
      const correo = (document.getElementById('regCorreo')?.value || '').trim();
      const pass = (document.getElementById('regPass')?.value || '').trim();
      const errBox = document.getElementById('authErrorReg');
      if (errBox) errBox.textContent = '';

      const revision = window.Validacion
        ? window.Validacion.validarFormulario(formReg, { regNombre: 'nombre', regCorreo: 'correo', regPass: 'claveNueva' })
        : { ok: Boolean(nombre.length >= 2 && correo && pass.length >= 6) };
      if (!revision.ok) return;

      const boton = formReg.querySelector('button[type="submit"]');
      if (boton) { boton.disabled = true; boton.textContent = 'Creando cuenta...'; }

      try {
        const ses = await window.SupabaseAPI.registrarCuenta({
          nombre,
          correo,
          password: pass,
          rol: 'cliente'
        });
        closeModal();
        actualizarCabeceraYSesion();
        // Semana 4 - Bitacora DOM y eventos
        if (window.BitacoraEventos) window.BitacoraEventos.registrar('LOGIN', `Cuenta nueva creada: ${ses.nombre}`);
        go(vistaInicialPorRol(ses.rol));
        showToast(`Cuenta creada con éxito. Bienvenido, ${ses.nombre}.`);
      } catch (error) {
        if (errBox) {
          const p = document.createElement('p');
          p.className = 'msg-error';
          p.textContent = error && error.codigo === 'DUPLICADA'
            ? 'Ese correo ya tiene una cuenta. Inicia sesión o usa otro correo.'
            : 'No se pudo crear la cuenta. Revisa los datos e inténtalo otra vez.';
          errBox.appendChild(p);
        }
      } finally {
        if (boton) { boton.disabled = false; boton.textContent = 'Crear Cuenta'; }
      }
    });
  }
}

function openEventModal(tipo) {
  const t = tipo || CAT_EVENTOS[0][0];
  const base = CAT_EVENTOS.find((e) => e[0] === t) || CAT_EVENTOS[0];
  $('#modal-root').html(`<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="Nuevo evento"><div class="modal-head"><div><span class="eyebrow">Catálogo de eventos</span><h3>Nuevo evento</h3></div><button type="button" class="ib" id="modal-close" aria-label="Cerrar">${ico('cerrar', 20)}</button></div><form id="event-form"><label for="e-tipo">Tipo de evento<select id="e-tipo">${CAT_EVENTOS.map((e) => `<option ${e[0] === t ? 'selected' : ''}>${esc(e[0])}</option>`).join('')}</select></label><label for="e-nombre">Nombre del evento<input id="e-nombre" required placeholder="Ej. Cumpleaños de María"></label><label for="e-cliente">Cliente<input id="e-cliente" required placeholder="Nombre del cliente"></label><div class="form-row"><label for="e-fecha">Fecha<input type="date" id="e-fecha" required></label><label for="e-invitados">Invitados<input type="number" id="e-invitados" min="1" value="20" required></label></div><label for="e-paquete">Paquete base<select id="e-paquete"><option value="${base[3]}">Estándar · ${money(base[3])}</option><option value="${base[3] * 1.5}">Premium · ${money(base[3] * 1.5)}</option></select></label><label for="e-estado">Estado<select id="e-estado"><option>Activo</option><option>Planificado</option></select></label><div class="modal-actions"><button type="button" class="btn outline" id="modal-cancel">Cancelar</button><button type="submit" class="btn p">${ico('check', 16)} Guardar evento</button></div></form></div></div>`);
  $('#e-fecha').val(new Date().toISOString().slice(0, 10));
  bindModalClose();
  $('#event-form').on('submit', function (e) {
    e.preventDefault();
    const ev = eventosGuardados();
    ev.unshift({ id: Date.now(), tipo: $('#e-tipo').val(), nombre: $('#e-nombre').val().trim(), cliente: $('#e-cliente').val().trim(), fecha: $('#e-fecha').val(), invitados: +$('#e-invitados').val(), paquete: +$('#e-paquete').val(), estado: $('#e-estado').val() });
    if (!guardarEventos(ev)) return;
    addBitacora('Evento creado: ' + $('#e-nombre').val().trim(), 'Eventos');
    closeModal();
    go('gestion-reservas');
  });
}

function openSupplierModal(id) {
  const current = getSuppliers().find((p) => p.id === id) || { nombre: '', insumos: '', celular: '', fijo: '', email: '' };
  const editing = Boolean(id);
  $('#modal-root').html(`<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div><span class="eyebrow">Directorio de abastecimiento</span><h3>${editing ? 'Editar' : 'Nuevo'} proveedor</h3></div><button type="button" class="ib" id="modal-close" aria-label="Cerrar">${ico('cerrar', 20)}</button></div><form id="supplier-form" novalidate><label for="sp-name">Nombre del proveedor<input id="sp-name" required minlength="2" maxlength="60" pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'-]{2,60}" value="${esc(current.nombre)}"></label><label for="sp-inputs">Productos o insumos<input id="sp-inputs" required maxlength="100" value="${esc(current.insumos)}"></label><div class="form-row"><label for="sp-mobile">Celular (8 dígitos)<input id="sp-mobile" required inputmode="numeric" pattern="[0-9]{8}" maxlength="8" minlength="8" value="${esc(current.celular)}"></label><label for="sp-landline">Teléfono fijo (opcional)<input id="sp-landline" inputmode="numeric" pattern="2[0-9]{7}" maxlength="8" minlength="8" value="${esc(current.fijo)}"></label></div><label for="sp-email">Correo electrónico<input id="sp-email" type="email" maxlength="100" value="${esc(current.email)}"></label><div class="form-error" id="sp-error" role="alert"></div><div class="modal-actions"><button type="button" class="btn outline" id="modal-cancel">Cancelar</button><button type="submit" class="btn p">${ico('check', 16)} Guardar proveedor</button></div></form></div></div>`);
  bindModalClose();
  const formProveedor = document.getElementById('supplier-form');
  if (formProveedor && window.Validacion) window.Validacion.enlazarLimpieza(formProveedor);
  $('#supplier-form').on('submit', function (e) {
    e.preventDefault();
    const name = $('#sp-name').val().trim();
    $('#sp-name').val(name);
    const revision = window.Validacion
      ? window.Validacion.validarFormulario(this, {
        'sp-name': 'nombre',
        'sp-inputs': { regla: 'texto', parametro: 3 },
        'sp-mobile': 'celular',
        'sp-landline': 'fijoOpcional',
        'sp-email': (valor) => {
          const v = String(valor || '').trim();
          if (!v) return '';
          return window.Validacion.reglas.correo(v);
        }
      })
      : { ok: this.reportValidity() };
    if (!revision.ok) return;
    const providers = getSuppliers();
    const item = { id: id || `s-${Date.now()}`, nombre: name, insumos: $('#sp-inputs').val().trim(), celular: $('#sp-mobile').val(), fijo: $('#sp-landline').val(), email: $('#sp-email').val().trim() };
    const next = editing ? providers.map((p) => p.id === id ? item : p) : [item, ...providers];
    if (!writeStore('sg-suppliers', next)) return;
    addBitacora(`Proveedor ${editing ? 'actualizado' : 'creado'}: ${name}`, 'Proveedores');
    closeModal();
    go('proveedores');
  });
}

function openInventoryModal(id) {
  const current = getInventory().find((x) => x.id === id) || { nombre: '', tipo: 'Materia prima', stock: 0, minimo: 0, unidad: 'unid.' };
  const editing = Boolean(id);
  $('#modal-root').html(`<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div><span class="eyebrow">Control de existencias</span><h3>${editing ? 'Editar artículo' : 'Nuevo artículo'}</h3></div><button type="button" class="ib" id="modal-close" aria-label="Cerrar">${ico('cerrar', 20)}</button></div><form id="inventory-form"><label for="st-name">Nombre del artículo<input id="st-name" required maxlength="70" value="${esc(current.nombre)}"></label><label for="st-type">Tipo<select id="st-type"><option ${current.tipo === 'Materia prima' ? 'selected' : ''}>Materia prima</option><option ${current.tipo === 'Insumo' ? 'selected' : ''}>Insumo</option><option ${current.tipo === 'Producto terminado' ? 'selected' : ''}>Producto terminado</option></select></label><div class="form-row"><label for="st-stock">Existencia actual<input id="st-stock" type="number" min="0" step="0.01" required value="${current.stock}"></label><label for="st-min">Stock mínimo<input id="st-min" type="number" min="0" step="0.01" required value="${current.minimo}"></label></div><label for="st-unit">Unidad<input id="st-unit" required maxlength="12" value="${esc(current.unidad)}"></label><div class="modal-actions"><button type="button" class="btn outline" id="modal-cancel">Cancelar</button><button type="submit" class="btn p">${ico('check', 16)} Guardar artículo</button></div></form></div></div>`);
  bindModalClose();
  const formInventario = document.getElementById('inventory-form');
  if (formInventario && window.Validacion) window.Validacion.enlazarLimpieza(formInventario);
  $('#inventory-form').on('submit', function (e) {
    e.preventDefault();
    const revision = window.Validacion
      ? window.Validacion.validarFormulario(this, {
        'st-name': 'texto',
        'st-stock': (valor) => (Number(valor) >= 0 ? '' : 'La existencia no puede ser negativa.'),
        'st-min': (valor) => (Number(valor) >= 0 ? '' : 'El stock mínimo no puede ser negativo.'),
        'st-unit': 'texto'
      })
      : { ok: this.reportValidity() };
    if (!revision.ok) return;
    const inv = getInventory();
    const item = { id: id || `i-${Date.now()}`, nombre: $('#st-name').val().trim(), tipo: $('#st-type').val(), stock: +$('#st-stock').val(), minimo: +$('#st-min').val(), unidad: $('#st-unit').val().trim() };
    const next = editing ? inv.map((x) => x.id === id ? item : x) : [item, ...inv];
    if (!writeStore('sg-inventory', next)) return;
    addBitacora(`Artículo ${editing ? 'actualizado' : 'creado'}: ${item.nombre}`, 'Inventario');
    closeModal();
    go('inventario');
  });
}

function openPurchaseModal() {
  const ps = getSuppliers();
  const inv = getInventory();
  if (!ps.length) { showToast('Registra primero al menos un proveedor.', 'error'); return; }
  $('#modal-root').html(`<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div><span class="eyebrow">Abastecimiento</span><h3>Nueva compra</h3></div><button type="button" class="ib" id="modal-close" aria-label="Cerrar">${ico('cerrar', 20)}</button></div><form id="purchase-form"><label for="pc-provider">Proveedor<select id="pc-provider" required>${ps.map((p) => `<option value="${esc(p.id)}">${esc(p.nombre)}</option>`).join('')}</select></label><label for="pc-item">Artículo recibido<select id="pc-item" required>${inv.map((x) => `<option value="${esc(x.id)}">${esc(x.nombre)} · ${esc(x.unidad)}</option>`).join('')}</select></label><div class="form-row"><label for="pc-qty">Cantidad<input id="pc-qty" type="number" min="0.01" step="0.01" required value="1"></label><label for="pc-total">Costo total (Bs)<input id="pc-total" type="number" min="0.01" step="0.01" required></label></div><div class="modal-actions"><button type="button" class="btn outline" id="modal-cancel">Cancelar</button><button type="submit" class="btn p">${ico('check', 16)} Guardar compra</button></div></form></div></div>`);
  bindModalClose();
  const formCompra = document.getElementById('purchase-form');
  if (formCompra && window.Validacion) window.Validacion.enlazarLimpieza(formCompra);
  $('#purchase-form').on('submit', function (e) {
    e.preventDefault();
    const revision = window.Validacion
      ? window.Validacion.validarFormulario(this, {
        'pc-qty': 'numero',
        'pc-total': 'numero'
      })
      : { ok: this.reportValidity() };
    if (!revision.ok) return;
    const provider = ps.find((p) => p.id === $('#pc-provider').val());
    const items = getInventory();
    const item = items.find((x) => x.id === $('#pc-item').val());
    const qty = +$('#pc-qty').val();
    const total = +$('#pc-total').val();
    if (!provider || !item) return;
    item.stock += qty;
    writeStore('sg-inventory', items);
    const purchases = readStore('sg-purchases', []);
    purchases.unshift({ id: `C-${Date.now()}`, proveedor: provider.nombre, fecha: new Date().toLocaleString('es-BO'), item: item.nombre, cantidad: qty, unidad: item.unidad, total });
    writeStore('sg-purchases', purchases);
    addBitacora(`Compra recibida: ${item.nombre}`, 'Compras');
    closeModal();
    go('compras');
  });
}

function openNumberDialog(title, description, initial, onSave) {
  $('#modal-root').html(`<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div><span class="eyebrow">Solo Gelatos · Caja</span><h3>${esc(title)}</h3></div><button type="button" class="ib" id="modal-close" aria-label="Cerrar">${ico('cerrar', 20)}</button></div><form id="number-dialog-form"><p class="muted" style="margin-bottom:12px">${esc(description)}</p><label for="dialog-amount">Monto en Bs<input id="dialog-amount" type="number" min="0" step="0.01" required value="${esc(initial)}"></label><div class="modal-actions"><button type="button" class="btn outline" id="modal-cancel">Cancelar</button><button type="submit" class="btn p">Confirmar</button></div></form></div></div>`);
  bindModalClose();
  $('#number-dialog-form').on('submit', function (e) {
    e.preventDefault();
    if (!this.reportValidity()) return;
    const amount = Number($('#dialog-amount').val());
    closeModal();
    onSave(amount);
  });
}

let eventosGlobalesEnlazados = false;

function resolverDestinoElemento(el) {
  if (!el || typeof el.getAttribute !== 'function') return '';
  return normalizarVista(
    el.getAttribute('data-v') ||
    el.getAttribute('data-go') ||
    el.getAttribute('data-view') ||
    (el.getAttribute('href') || '').replace(/^#/, '')
  );
}

function enlazarEventosGlobales() {
  if (eventosGlobalesEnlazados) return;
  eventosGlobalesEnlazados = true;

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target || typeof target.closest !== 'function') return;

    if (target.closest('#btnCerrarLightbox') || target.id === 'lightboxImagenVisor') {
      return;
    }

    if (target.closest('#modal-close, #modal-cancel') || target.classList.contains('modal-backdrop')) {
      closeModal(e);
      return;
    }

    if (target.closest('#btnCarritoHeader')) {
      e.preventDefault();
      abrirDrawerCarrito();
      return;
    }

    if (target.closest('#btnCerrarDrawerCarrito') || target.id === 'drawerCarritoBackdrop') {
      e.preventDefault();
      cerrarDrawerCarrito();
      return;
    }

    if (target.closest('#btnDrawerPagar')) {
      e.preventDefault();
      abrirCheckoutDesdeCarrito();
      return;
    }

    const btnCuenta = target.closest('#btnUsuarioCuenta, .user-btn, .user');
    if (btnCuenta) {
      e.preventDefault();
      openAuthModal();
      return;
    }

    const enlaceSubcat = target.closest('a[data-subcat]');
    if (enlaceSubcat) {
      e.preventDefault();
      abrirCatalogoFiltrado(enlaceSubcat.getAttribute('data-subcat') || 'Todos');
      return;
    }

    const elementoNav = target.closest('#navMenu a, #dockAcciones a, #nav a, #bottom a, a[data-v], button[data-go], a[data-go], button[data-view], a[data-view], a[href^="#"]');
    if (elementoNav && elementoNav.tagName !== 'BODY') {
      const destino = resolverDestinoElemento(elementoNav);
      if (destino && typeof V[destino] === 'function') {
        e.preventDefault();
        go(destino);
        return;
      }
    }
  });

  if (typeof window.$ !== 'function') return;

  $(document)
    .off('click.notif', '#btnNotificaciones')
    .on('click.notif', '#btnNotificaciones', function (e) {
      e.preventDefault();
      const cola = window.SupabaseAPI.getCola().length;
      showToast(cola > 0 ? `Tienes ${cola} operaciones pendientes de sincronización.` : 'Todo sincronizado. Promoción Express activa hoy.');
    })
    .off('keyup.hsearch', '#headerSearch')
    .on('keyup.hsearch', '#headerSearch', function () {
      const term = $(this).val().trim();
      const sesion = obtenerSesionSegura();
      if (sesion.rol === 'cliente') {
        if (vistaActual !== 'productos') go('productos');
        $('#catalog-q').val(term).trigger('keyup');
      }
    })
    .off('click.tmclose', '#btnCerrarModalTimer, #btnCancelarModalTimer')
    .on('click.tmclose', '#btnCerrarModalTimer, #btnCancelarModalTimer', cerrarModalTimer)
    .off('click.tmok', '#btnConfirmarModalTimer')
    .on('click.tmok', '#btnConfirmarModalTimer', async () => {
      cerrarModalTimer();
      if (modoModalTimer === 'carrito') {
        const cart = getClientCart();
        if (!cart.length) return;
        const sesion = obtenerSesionSegura();
        const dirInput = document.getElementById('drawerDireccion');
        const dir = (dirInput && dirInput.value.trim()) || '';
        if (dir.length < 4) {
          showToast('Indica la dirección o la sucursal de retiro (mínimo 4 caracteres).', 'error');
          if (dirInput) dirInput.focus();
          return;
        }
        const total = cart.reduce((s, x) => s + Number(x.precio) * Number(x.cantidad), 0);
        const items = cart.map((x) => ({ nombre: x.nombre, precio: Number(x.precio) || 0, cantidad: Number(x.cantidad) || 1 }));
        const detalle = cart.map((x) => `${x.nombre} x${x.cantidad}`).join(', ') + ` · ${dir}`;
        await window.SupabaseAPI.insertarRegistro('pedidos', {
          cliente: sesion.nombre,
          modalidad: dir,
          forma_pago: 'Pago al retirar',
          monto_total: total,
          items,
          detalle,
          total,
          estado: 'Recibido'
        });
        await window.SupabaseAPI.registrarActividad('PEDIDO_CONFIRMADO', `${detalle} (${money(total)})`);
        // Semana 4 - Bitacora DOM y eventos
        if (window.BitacoraEventos) window.BitacoraEventos.registrar('ORDER_CONFIRM', `Pedido por ${money(total)} · ${items.length} producto(s)`);
        saveClientCart([]);
        if (dirInput) dirInput.value = '';
        showToast(`Pedido confirmado y enviado por ${money(total)}.`);
        hidratarPedidosDrawer();
        return;
      }
      await window.SupabaseAPI.registrarActividad('TARIFA_FLASH_CONFIRMADA', $('#detalleModalTimer').text());
      showToast('Tarifa Flash confirmada y reservada.');
    })
    .off('click.newev', '[data-action="nuevo-evento"]').on('click.newev', '[data-action="nuevo-evento"]', () => openEventModal())
    .off('click.newsp', '[data-action="nuevo-proveedor"]').on('click.newsp', '[data-action="nuevo-proveedor"]', () => openSupplierModal())
    .off('click.newinv', '[data-action="nuevo-inventario"]').on('click.newinv', '[data-action="nuevo-inventario"]', () => openInventoryModal())
    .off('click.newpc', '[data-action="nueva-compra"]').on('click.newpc', '[data-action="nueva-compra"]', () => openPurchaseModal())
    .off('click.backv', '[data-action="volver-venta"]').on('click.backv', '[data-action="volver-venta"]', () => go('ventas'))
    .off('click.edsp', '[data-edit-supplier]').on('click.edsp', '[data-edit-supplier]', function () { openSupplierModal(String($(this).attr('data-edit-supplier'))); })
    .off('click.delsp', '[data-delete-supplier]').on('click.delsp', '[data-delete-supplier]', function () {
      const id = String($(this).attr('data-delete-supplier'));
      writeStore('sg-suppliers', getSuppliers().filter((x) => x.id !== id));
      addBitacora('Proveedor eliminado', 'Proveedores');
      go('proveedores');
    })
    .off('click.edst', '[data-edit-stock]').on('click.edst', '[data-edit-stock]', function () { openInventoryModal(String($(this).attr('data-edit-stock'))); })
    .off('click.adjst', '.stock-adjust').on('click.adjst', '.stock-adjust', function () {
      const id = String($(this).attr('data-stock'));
      const delta = Number($(this).attr('data-delta'));
      const inv = getInventory();
      const item = inv.find((x) => x.id === id);
      if (!item || item.stock + delta < 0) { showToast('El stock no puede ser menor a cero.', 'error'); return; }
      item.stock += delta;
      writeStore('sg-inventory', inv);
      addBitacora(`Stock ajustado: ${item.nombre}`, 'Inventario');
      go('inventario');
    })
    .off('keyup.invq', '#inventory-q').on('keyup.invq', '#inventory-q', function () {
      const q = this.value.toLowerCase();
      $('#view table tbody tr').each(function () { $(this).toggle($(this).text().toLowerCase().includes(q)); });
    })
    .off('click.exp', '#export-log').on('click.exp', '#export-log', () => {
      const rows = readStore('sg-bitacora', []);
      const csv = ['Fecha,Hora,Usuario,Evento,Módulo,Estado', ...rows.map((r) => [r.fecha, r.hora, r.usuario, r.evento, r.modulo, r.estado].map((v) => `"${String(v || '').replaceAll('"', '""')}"`).join(','))].join('\r\n');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
      link.download = 'bitacora-solo-gelatos.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    })
    .off('click.evcard', '.event-card').on('click.evcard', '.event-card', function () { openEventModal($(this).attr('data-tipo')); })
    .off('click.delev', '[data-del-event]').on('click.delev', '[data-del-event]', function () {
      const id = Number($(this).attr('data-del-event'));
      guardarEventos(eventosGuardados().filter((e) => e.id !== id));
      addBitacora('Evento eliminado', 'Eventos');
      go('gestion-reservas');
    })
    .off('click.cash', '#cashbox-toggle').on('click.cash', '#cashbox-toggle', function () {
      const opening = $(this).attr('data-open') === 'true';
      const box = getCashbox();
      if (opening) {
        openNumberDialog('Abrir caja', 'Ingresa el efectivo inicial del turno.', '0', (amount) => {
          box.abierta = true; box.fondo = amount; box.apertura = Date.now();
          writeStore('sg-cashbox', box);
          addBitacora(`Caja abierta con ${money(amount)}`, 'Caja');
          go('caja');
        });
      } else {
        const cashSales = readStore('sg-sales', []).filter((s) => s.payment === 'Efectivo' && s.timestamp >= box.apertura);
        const expected = box.fondo + cashSales.reduce((n, s) => n + s.total, 0);
        openNumberDialog('Cerrar caja', `Saldo esperado: ${money(expected)}. Ingresa el efectivo contado.`, String(expected), (counted) => {
          box.ultimoCierre = { fecha: new Date().toLocaleString('es-BO'), esperado: expected, contado: counted, diferencia: counted - expected };
          box.abierta = false;
          writeStore('sg-cashbox', box);
          addBitacora(`Caja cerrada. Diferencia: ${money(counted - expected)}`, 'Caja');
          go('caja');
        });
      }
    })
    .off('click.pedcli', '#btnConfirmarPedidoCliente').on('click.pedcli', '#btnConfirmarPedidoCliente', async () => {
      const cart = getClientCart();
      if (!cart.length) { showToast('Tu carrito está vacío.', 'error'); return; }
      const sesion = window.SupabaseAPI.getSesion();
      const dirInput = document.getElementById('clienteDireccion');
      const dir = $('#clienteDireccion').val().trim();
      if (dir.length < 4) {
        showToast('Indica la dirección o la sucursal de retiro (mínimo 4 caracteres).', 'error');
        if (dirInput) dirInput.focus();
        return;
      }
      const total = cart.reduce((s, x) => s + x.precio * x.cantidad, 0);
      const items = cart.map((x) => ({ nombre: x.nombre, precio: Number(x.precio) || 0, cantidad: Number(x.cantidad) || 1 }));
      const detalle = cart.map((x) => `${x.nombre} x${x.cantidad}`).join(', ') + ` · ${dir}`;
      await window.SupabaseAPI.insertarRegistro('pedidos', {
        cliente: sesion.nombre,
        modalidad: dir,
        forma_pago: 'Pago al retirar',
        monto_total: total,
        items,
        detalle,
        total,
        estado: 'Recibido'
      });
      await window.SupabaseAPI.registrarActividad('PEDIDO_CONFIRMADO', `${detalle} (${money(total)})`);
      // Semana 4 - Bitacora DOM y eventos
      if (window.BitacoraEventos) window.BitacoraEventos.registrar('ORDER_CONFIRM', `Pedido por ${money(total)} · ${items.length} producto(s)`);
      saveClientCart([]);
      showToast(`Pedido enviado por ${money(total)}.`);
      hidratarPedidosCliente();
    });
}

function iniciarAplicacionSoloGelatos() {
  enlazarEventosGlobales();
  actualizarCabeceraYSesion();
  const sesionInicial = obtenerSesionSegura();
  const hashInicial = normalizarVista(typeof location !== 'undefined' ? location.hash : '');
  const vistaInicial = (hashInicial && typeof V[hashInicial] === 'function') ? hashInicial : vistaInicialPorRol(sesionInicial.rol);
  go(vistaInicial);

  // Bienvenida con inicio de sesión: se muestra una vez por pestaña.
  if (sesionInicial.invitado) {
    try {
      if (!window.sessionStorage.getItem('sg_bienvenida_vista')) {
        window.sessionStorage.setItem('sg_bienvenida_vista', '1');
        setTimeout(() => { if (typeof openAuthModal === 'function') openAuthModal(false); }, 350);
      }
    } catch (_) {}
  }

  window.addEventListener('hashchange', () => {
    const h = normalizarVista(location.hash);
    if (h && typeof V[h] === 'function' && h !== vistaActual) go(h);
  });

  cargarCatalogoLocalYRemoto().then(() => {
    if (vistaActual === 'productos') drawCatalog();
    if (vistaActual === 'ventas') drawProds();
  }).catch(() => {});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarAplicacionSoloGelatos);
} else {
  iniciarAplicacionSoloGelatos();
}
