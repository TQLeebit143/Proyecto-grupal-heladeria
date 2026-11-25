// Semana 3 - Arquitectura de Vistas y Separacion por Rol
const MENU_CLIENTE = [
  ['inicio', 'home', 'Inicio'],
  ['productos', 'productos', 'Catálogo', 1],
  ['calculador', 'reloj', 'Paquetes y Reservas', 0, 'Reservas'],
  ['consultas', 'campana', 'Consultas']
];

const MENU_ENCARGADO = [
  ['panel-operativo', 'home', 'Panel Operativo'],
  ['gestion-pedidos', 'carrito', 'Pedidos Web'],
  ['gestion-reservas', 'eventos', 'Reservas'],
  ['gestion-consultas', 'campana', 'Consultas'],
  ['gestion-productos', 'productos', 'Productos'],
  ['ventas', 'ventas', 'POS Interno'],
  ['inventario', 'inventario', 'Inventario'],
  ['caja', 'caja', 'Caja']
];

const MENU_ADMIN = [
  ['panel-operativo', 'home', 'Panel General'],
  ['gestion-pedidos', 'carrito', 'Pedidos Web'],
  ['gestion-reservas', 'eventos', 'Reservas'],
  ['gestion-consultas', 'campana', 'Consultas'],
  ['gestion-productos', 'productos', 'Productos'],
  ['ventas', 'ventas', 'POS Interno'],
  ['inventario', 'inventario', 'Inventario'],
  ['compras', 'compras', 'Compras'],
  ['proveedores', 'proveedores', 'Proveedores'],
  ['sucursales', 'sucursales', 'Sucursales'],
  ['caja', 'caja', 'Caja'],
  ['reportes', 'reportes', 'Reportes'],
  ['auditoria-admin', 'bitacora', 'Control y Auditoría']
];

function getMenuPorRol(rol) {
  if (rol === 'admin') return MENU_ADMIN;
  if (rol === 'encargado') return MENU_ENCARGADO;
  return MENU_CLIENTE;
}

const tbl = (h, r) => `<div class="tw"><table><thead><tr>${h.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${r.map((a) => `<tr>${a.map((x) => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const ok = '<span class="tag">Activo</span>';
const bad = '<span class="tag r">Bajo</span>';
const head = (t, b, sub) => `<div class="page-head"><div><h2>${esc(t)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>${b ? `<button type="button" class="btn p" data-action="${esc(b[1] || '')}">${ico('mas', 16)} ${esc(b[0])}</button>` : ''}</div>`;
const money = (n) => `${Number(n || 0).toLocaleString('es-BO')} Bs`;
const esc = (s) => {
  const limpio = typeof sanitizarTextoUsuario === 'function' ? sanitizarTextoUsuario(s) : String(s ?? '');
  return limpio.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
};
const readStore = (key, fallback = []) => { try { const st = window.localStorage; return JSON.parse(st.getItem(key)) ?? fallback; } catch (_) { return fallback; } };
const writeStore = (key, value) => { try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } };

let toastTimer;
function showToast(message, tone = 'success') {
  let root = document.getElementById('toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    root.className = 'toast-root';
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-atomic', 'true');
    document.body.appendChild(root);
  }
  root.innerHTML = `<div class="toast ${tone === 'error' ? 'error' : 'success'}" role="status"><span class="toast-mark">${ico(tone === 'error' ? 'alerta' : 'check', 18)}</span><span class="toast-message">${esc(message)}</span><button type="button" class="toast-close" aria-label="Cerrar notificación">${ico('cerrar', 16)}</button></div>`;
  const btn = root.querySelector('.toast-close');
  if (btn) btn.addEventListener('click', () => { root.textContent = ''; });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { root.textContent = ''; }, 4000);
}

const initialInventory = () => [
  ...PR.map((p) => ({ id: `p-${p[0]}`, nombre: p[0], tipo: 'Producto terminado', stock: 20, minimo: 3, unidad: 'unid.' })),
  { id: 'raw-leche', nombre: 'Leche', tipo: 'Materia prima', stock: 40, minimo: 20, unidad: 'L' },
  { id: 'raw-frutilla', nombre: 'Frutillas', tipo: 'Materia prima', stock: 6, minimo: 10, unidad: 'kg' },
  { id: 'raw-cono', nombre: 'Conos', tipo: 'Insumo', stock: 120, minimo: 50, unidad: 'unid.' },
  { id: 'raw-cafe', nombre: 'Café en grano', tipo: 'Materia prima', stock: 18, minimo: 10, unidad: 'kg' },
  { id: 'raw-mango', nombre: 'Mango', tipo: 'Materia prima', stock: 9, minimo: 8, unidad: 'kg' }
];
const getInventory = () => readStore('sg-inventory', initialInventory());
const getCashbox = () => readStore('sg-cashbox', { abierta: false, fondo: 0, apertura: null, cierres: [] });
const getSuppliers = () => readStore('sg-suppliers', [
  { id: 's-1', nombre: 'Lácteos Andes', insumos: 'Leche, crema', celular: '70001111', fijo: '22441122', email: 'ventas@lacteos.bo' },
  { id: 's-2', nombre: 'Frutas del Valle', insumos: 'Frutillas, mango', celular: '70002222', fijo: '22442233', email: 'pedidos@frutas.bo' },
  { id: 's-3', nombre: 'Café Yungas', insumos: 'Café en grano', celular: '70003333', fijo: '22443344', email: 'hola@cafeyungas.bo' }
]);

const photoUrl = (p) => (p && p[5]) ? p[5] : 'images/productos/helado-frutilla.jpg';

// Semana 3 - Componentes Encapsulados
const productCard = (p, i) => {
  const rol = typeof obtenerSesionSegura === 'function' ? obtenerSesionSegura().rol : 'cliente';
  const btnCompra = rol === 'cliente'
    ? `<button type="button" class="btn p add-product" data-i="${i}" aria-label="Añadir ${esc(p[0])} al carrito">${ico('carrito', 15)} Añadir</button>`
    : '';
  return `<article class="card-item" data-categoria="${esc(p[3])}" data-product-index="${i}">
    <div class="card-item__media">
      <img class="card-item__img" src="${esc(photoUrl(p))}" alt="${esc(p[0])} artesanal de Solo Gelatos" loading="lazy">
      <span class="card-item__badge">${esc(p[3])}</span>
    </div>
    <div class="card-item__body">
      <h3 class="card-item__title">${esc(p[0])}</h3>
      <p class="card-item__desc">${esc(p[6] || 'Preparado artesanalmente con ingredientes seleccionados.')}</p>
      <div class="card-item__footer">
        <span class="card-item__price">${money(p[2])}</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button type="button" class="btn outline card-item__btn-simular" data-i="${i}" data-nombre="${esc(p[0])}" data-precio="${p[2]}" aria-label="Ver detalle de ${esc(p[0])}">Ver detalle</button>
          ${btnCompra}
        </div>
      </div>
    </div>
  </article>`;
};

function eventosGuardados() { return readStore('sg-events', []); }
function guardarEventos(e) { return writeStore('sg-events', e); }
function addBitacora(accion, modulo) {
  const now = new Date();
  const b = readStore('sg-bitacora', []);
  const sesion = window.SupabaseAPI ? window.SupabaseAPI.getSesion() : { nombre: 'Sistema' };
  b.unshift({
    id: Date.now(),
    fecha: now.toLocaleDateString('es-BO'),
    hora: now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
    usuario: sesion.nombre,
    evento: accion,
    modulo,
    estado: 'Registrado'
  });
  writeStore('sg-bitacora', b.slice(0, 500));

  // Semana 4 - Bitacora DOM y eventos
  // Cada operacion del sistema se envia tambien a Supabase, una sola vez.
  if (window.BitacoraEventos && typeof window.BitacoraEventos.registrarOperacion === 'function') {
    window.BitacoraEventos.registrarOperacion(accion, modulo);
  }
}

const V = {
  inicio: () => `
    <article class="hero-gelato">
      <div class="hero-gelato__copy">
        <span class="eyebrow">Heladería artesanal · La Paz</span>
        <h2>Un momento dulce<br>hecho para <em>disfrutar</em></h2>
        <p>Sabores preparados con ingredientes reales, fruta fresca de temporada y recetas artesanales.</p>
        <button type="button" class="btn p" data-go="productos">Explorar catálogo ${ico('flecha', 16)}</button>
      </div>
      <div class="hero-gelato__art">
        <img src="images/hero-helado.jpg" alt="Copa de helado artesanal con frutas de Solo Gelatos" loading="lazy">
      </div>
    </article>

    <section class="promo-express" aria-label="Promoción Express vigente">
      <div class="promo-express__copy">
        <span class="eyebrow">Promoción Express en Vivo</span>
        <h3 id="promoTituloVivo">2x1 en Copas Artesanales de Fruta</h3>
        <p id="promoDescVivo">Válido hoy en pedidos web y retiro en sucursal Central.</p>
      </div>
      <button type="button" class="btn p" id="btnReclamarPromo">Reclamar Promoción</button>
    </section>

    <!-- Semana 2 - jQuery Acordeon y Temas -->
    <section class="card" aria-label="Preguntas frecuentes de Solo Gelatos">
      <div class="card-head"><h3>Preguntas Frecuentes</h3><span class="hint">Toca una pregunta para desplegar</span></div>
      <button type="button" class="accordion-btn">Horarios de atención y sucursales <span>+</span></button>
      <div class="accordion-panel">Atendemos de lunes a domingo de 10:00 a 21:30 en Central (Av. Arce 123), Sopocachi y Zona Sur.</div>
      <button type="button" class="accordion-btn">Opciones sin azúcar y veganas <span>+</span></button>
      <div class="accordion-panel">Contamos con gelatos a base de fruta natural sin lácteos y líneas endulzadas sin azúcar añadida.</div>
      <button type="button" class="accordion-btn">Catering de helados para eventos <span>+</span></button>
      <div class="accordion-panel">Puedes cotizar tu evento al instante en la sección Paquetes y Reservas con tarifa promocional.</div>
    </section>
  `,

  productos: () => `
    <div class="catalog-top">
      <div>
        <h2>Nuestro Catálogo Artesanal</h2>
        <p>${PR.length} delicias disponibles · Toca cualquier tarjeta para ver su ficha completa</p>
      </div>
    </div>

    <!-- Semana 2 - Filtro de 3 Capas -->
    <section class="selector-sabores" aria-label="Selector de Sabores">
      <div class="selector-sabores__barra">
        <div class="campo-grupo">
          <label for="catalog-q">Buscar sabor</label>
          <input id="catalog-q" type="search" placeholder="Ej. frutilla, oreo, waffle..." aria-label="Buscar sabor en catálogo">
        </div>
        <div class="campo-grupo">
          <label for="capa1">Categoría</label>
          <select id="capa1">
            <option value="">Todas las categorías</option>
            ${Object.keys(CATS).map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
          </select>
        </div>
        <div class="campo-grupo">
          <label for="capa2">Especialidad</label>
          <select id="capa2" disabled>
            <option value="">Elige una especialidad</option>
          </select>
        </div>
      </div>
      <div id="resultadoFiltro" class="selector-sabores__resultado" aria-live="polite">
        <span>Filtra por categoría y especialidad para descubrir tu sabor recomendado.</span>
      </div>
    </section>

    <div class="catalog-category-menu">
      <button type="button" class="catalog-menu-toggle" id="catalog-menu-toggle" aria-expanded="false" aria-controls="catalog-category-list">
        <span class="catalog-menu-icon" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>Categorías</span>
      </button>
      <div class="catalog-filters" id="catalog-category-list" role="group" aria-label="Categorías del catálogo" hidden>
      <button type="button" class="catalog-filter active" data-product-filter="Todos">${ico('estrella', 16)} Todos</button>
      ${Object.entries(CATS).map(([c, v]) => `<button type="button" class="catalog-filter" data-product-filter="${esc(c)}">${ico(v[1], 16)} ${esc(c)}</button>`).join('')}
      </div>
    </div>
    <div class="product-grid" id="catalog-grid">${PR.map(productCard).join('')}</div>
    <nav class="catalog-pagination" aria-label="Paginación del catálogo">
      <button type="button" class="btn outline" id="catalog-prev" disabled aria-label="Página anterior">Anterior</button>
      <span id="catalog-page-status" aria-live="polite"></span>
      <button type="button" class="btn outline" id="catalog-next" aria-label="Página siguiente">Siguiente</button>
    </nav>
  `,

  carrito: () => `
    ${head('Mi Pedido', null, 'Revisa tus productos seleccionados y envía tu pedido a la heladería')}
    <p class="ayuda-modulo">Ajusta las cantidades y confirma tu pedido; se enviará a Supabase o a la cola offline automática si no hay señal.</p>
    <div class="grid2">
      <section class="card">
        <div class="card-head"><h3>Resumen de tu carrito</h3><button type="button" class="link" data-go="productos">Seguir comprando</button></div>
        <div id="client-cart-lines"></div>
        <div class="row total"><b>Total</b><b id="client-cart-total">0 Bs</b></div>
        <div class="campo-grupo" style="margin-top:12px">
          <label for="clienteDireccion">Dirección o sucursal de retiro</label>
          <input id="clienteDireccion" type="text" placeholder="Ej. Retiro en Sucursal Central / Av. Arce">
        </div>
        <button type="button" class="btn p" id="btnConfirmarPedidoCliente" style="width:100%">Confirmar y Enviar Pedido</button>
      </section>
      <section class="card">
        <div class="card-head"><h3>Historial de mis pedidos</h3><span class="hint">Sincronizado</span></div>
        <div id="listaPedidosCliente"><p class="muted empty">Cargando pedidos...</p></div>
      </section>
    </div>
  `,

  calculador: () => `
    ${head('Paquetes y Reservas', null, 'Calcula tu evento en vivo y agenda tu mesa o carrito de gelatos')}
    <div class="grid2">
      <!-- Semana 2 - Calculador Modal 30s y Toast -->
      <section class="card">
        <div class="card-head"><h3>Calculador de Paquetes en Vivo</h3><span class="hint">40 Bs por persona/hora</span></div>
        <p class="ayuda-modulo">Ingresa la cantidad de horas o paquetes para calcular el presupuesto al instante y bloquear la tarifa durante 30 segundos.</p>
        <div class="campo-grupo">
          <label for="hrs">Cantidad de horas o porciones del evento</label>
          <input id="hrs" type="number" min="1" max="50" value="3">
        </div>
        <div class="row total">
          <b>Presupuesto estimado</b>
          <b id="totalMonto"><span id="total">120</span> Bs</b>
        </div>
        <button type="button" class="btn p" id="btnModal" style="width:100%;margin-top:12px">Bloquear Tarifa Flash (30s)</button>
      </section>

      <!-- Semana 2 - Tree Shaking y Reservas Anti-XSS -->
      <section class="card">
        <div class="card-head"><h3>Reservar Mesa o Evento</h3><span class="hint">Protegido Anti-XSS</span></div>
        <p class="ayuda-modulo">Completa tus datos para registrar una reserva real; el sistema sanitiza estrictamente los textos y confirma tu espacio.</p>
        <form id="formReservaCliente" novalidate>
          <div class="campo-grupo">
            <label for="resNombre">Tu nombre completo</label>
            <input id="resNombre" type="text" required placeholder="Ej. Camila Rojas">
          </div>
          <div class="form-row">
            <div class="campo-grupo">
              <label for="resFecha">Fecha deseada</label>
              <input id="resFecha" type="date" required>
            </div>
            <div class="campo-grupo">
              <label for="resTipo">Tipo de reserva</label>
              <select id="resTipo">
                ${CAT_EVENTOS.map((e) => `<option value="${esc(e[0])}">${esc(e[0])}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="campo-grupo">
            <label for="resNotas">Notas o sabores preferidos</label>
            <input id="resNotas" type="text" placeholder="Ej. Mesa para 6 personas, sin azúcar">
          </div>
          <button type="submit" class="btn p" style="width:100%">Guardar Reserva</button>
        </form>
        <h3 style="margin-top:16px">Mis Reservas Registradas</h3>
        <div id="listaReservasCliente" class="event-list"></div>
      </section>
    </div>
  `,

  consultas: () => `
    ${head('Consultas a la Tienda', null, 'Envía preguntas sobre ingredientes, pedidos especiales o sucursales')}
    <p class="ayuda-modulo">Valida tu correo electrónico antes de enviar; cuando el encargado responda, verás su respuesta aquí mismo.</p>
    <div class="grid2">
      <!-- Semana 1 - Validacion Formulario -->
      <section class="card">
        <h3>Enviar nueva consulta</h3>
        <form id="formConsultaCliente" novalidate>
          <div class="campo-grupo">
            <label for="consultaNombre">Nombre</label>
            <input id="consultaNombre" type="text" required placeholder="Tu nombre">
          </div>
          <div class="campo-grupo">
            <label for="consultaCorreo">Correo electrónico</label>
            <input id="consultaCorreo" type="email" required placeholder="nombre@correo.com">
          </div>
          <div class="campo-grupo">
            <label for="consultaMensaje">Tu pregunta</label>
            <textarea id="consultaMensaje" required placeholder="Escribe aquí tu consulta..."></textarea>
          </div>
          <button type="submit" class="btn p">Enviar Consulta</button>
          <div id="cajaAlertaConsulta" aria-live="polite"></div>
        </form>
      </section>
      <section class="card">
        <div class="card-head"><h3>Consultas y Respuestas</h3><span class="hint">Atención al cliente</span></div>
        <div id="listaConsultasCliente" class="event-list"></div>
      </section>
    </div>
  `,

  'panel-operativo': () => {
    const sesion = window.SupabaseAPI.getSesion();
    const sales = readStore('sg-sales', []);
    const lowStock = getInventory().filter((x) => x.stock <= x.minimo).length;
    const totalSales = sales.reduce((n, s) => n + Number(s.total || 0), 0);
    return `
      ${head(sesion.rol === 'admin' ? 'Panel General de Administración' : 'Panel Operativo del Encargado', null, 'Gestión de pedidos, reservas, consultas y promoción activa')}
      <div class="kpis">
        <div class="kpi"><span>${ico('ventas', 24)}</span><div><small>Ventas POS acumuladas</small><b>${money(totalSales)}</b></div></div>
        <div class="kpi f"><span>${ico('carrito', 24)}</span><div><small>Pedidos web</small><b id="kpiPedidosWeb">0</b></div></div>
        <div class="kpi"><span>${ico('eventos', 24)}</span><div><small>Reservas activas</small><b id="kpiReservasWeb">0</b></div></div>
        <div class="kpi f"><span>${ico('alerta', 24)}</span><div><small>Stock bajo</small><b>${lowStock}</b></div></div>
      </div>
      <div class="grid2">
        <section class="card">
          <div class="card-head"><h3>Editor de Promoción Express</h3><span class="hint">Visible para clientes</span></div>
          <p class="ayuda-modulo">Cambia el título y la descripción de la promoción vigente; al guardar se actualizará para todos los clientes.</p>
          <form id="formEditarPromo" novalidate>
            <div class="campo-grupo">
              <label for="editPromoTitulo">Título de la promoción</label>
              <input id="editPromoTitulo" type="text" required value="2x1 en Copas Artesanales de Fruta">
            </div>
            <div class="campo-grupo">
              <label for="editPromoDesc">Descripción breve</label>
              <input id="editPromoDesc" type="text" required value="Válido hoy en pedidos web y retiro en sucursal Central.">
            </div>
            <div class="campo-grupo">
              <label for="editPromoPrecio">Precio promocional (Bs)</label>
              <input id="editPromoPrecio" type="number" min="0" step="0.5" required value="35">
            </div>
            <button type="submit" class="btn p">Publicar Promoción</button>
          </form>
        </section>
        <section class="card">
          <div class="card-head"><h3>Accesos Operativos Rápidos</h3></div>
          <p class="ayuda-modulo">Gestiona directamente las solicitudes de los clientes o abre el punto de venta interno.</p>
          <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px">
            <button type="button" class="btn p" data-go="gestion-pedidos">Gestionar Pedidos</button>
            <button type="button" class="btn" data-go="gestion-reservas">Confirmar Reservas</button>
            <button type="button" class="btn" data-go="gestion-consultas">Responder Consultas</button>
            <button type="button" class="btn outline" data-go="gestion-productos">Añadir Producto</button>
            <button type="button" class="btn outline" data-go="ventas">Abrir POS Interno</button>
          </div>
        </section>
      </div>
    `;
  },

  'gestion-pedidos': () => `
    ${head('Gestión de Pedidos Web', null, 'Confirma y despacha los pedidos enviados por los clientes')}
    <p class="ayuda-modulo">Cada pedido recibido desde la vista cliente aparece aquí para cambiar su estado a Preparando o Entregado.</p>
    <section class="card"><div id="contenedorGestionPedidos"><p class="muted empty">Cargando pedidos...</p></div></section>
  `,

  'gestion-reservas': () => {
    const ev = eventosGuardados();
    return `
      ${head('Gestión de Reservas y Eventos', ['Nuevo Evento Local', 'nuevo-evento'], 'Confirma reservas web de clientes y organiza eventos especiales')}
      <p class="ayuda-modulo">Revisa las reservas web registradas por clientes y marca su estado como Confirmada.</p>
      <section class="card">
        <div class="card-head"><h3>Reservas de Clientes (Supabase)</h3></div>
        <div id="contenedorGestionReservas"><p class="muted empty">Cargando reservas...</p></div>
      </section>
      <section class="card">
        <div class="card-head"><h3>Catálogo de Eventos Locales</h3><span class="hint">${ev.length} guardados</span></div>
        <div class="event-catalog">${CAT_EVENTOS.map((e) => `<button type="button" class="event-card" data-tipo="${esc(e[0])}"><span class="event-ico">${ico(e[2], 26)}</span><strong>${esc(e[0])}</strong><small>${esc(e[1])}</small><em>Desde ${money(e[3])}</em></button>`).join('')}</div>
        <div style="margin-top:14px">${ev.length ? `<div class="event-list">${ev.map((e) => `<div class="event-item"><span class="tag">${esc(e.fecha)}</span><div style="flex:1"><strong>${esc(e.nombre)}</strong><small>${esc(e.tipo)} · ${esc(e.cliente)} · ${esc(e.invitados)} invitados</small></div><span class="tag">${esc(e.estado)}</span><button type="button" class="ib sm" data-del-event="${esc(e.id)}" aria-label="Eliminar evento ${esc(e.nombre)}">${ico('papelera', 16)}</button></div>`).join('')}</div>` : '<p class="muted empty">Sin eventos locales registrados.</p>'}</div>
      </section>
    `;
  },

  'gestion-consultas': () => `
    ${head('Consultas de Clientes', null, 'Responde dudas enviadas desde la tienda web')}
    <p class="ayuda-modulo">Escribe tu respuesta en cada consulta pendiente; el cliente podrá leerla inmediatamente en su sección de Consultas.</p>
    <section class="card"><div id="contenedorGestionConsultas"><p class="muted empty">Cargando consultas...</p></div></section>
  `,

  'gestion-productos': () => `
    ${head('Gestión de Productos del Catálogo', null, 'Añade nuevos sabores y productos que se publicarán en el catálogo')}
    <p class="ayuda-modulo">Los productos creados aquí se guardan en la tabla productos_extra y se integran automáticamente al catálogo.</p>
    <div class="grid2">
      <section class="card">
        <h3>Añadir Nuevo Producto</h3>
        <form id="formNuevoProductoExtra" novalidate>
          <div class="campo-grupo">
            <label for="npNombre">Nombre del producto</label>
            <input id="npNombre" type="text" required placeholder="Ej. Gelato de Pistacho">
          </div>
          <div class="form-row">
            <div class="campo-grupo">
              <label for="npCategoria">Categoría</label>
              <select id="npCategoria">${Object.keys(CATS).map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
            </div>
            <div class="campo-grupo">
              <label for="npPrecio">Precio (Bs)</label>
              <input id="npPrecio" type="number" min="1" required value="28">
            </div>
          </div>
          <div class="campo-grupo">
            <label for="npImagen">URL de imagen (opcional)</label>
            <input id="npImagen" type="url" placeholder="https://ejemplo.com/mi-imagen.jpg">
          </div>
          <button type="submit" class="btn p">Guardar Producto</button>
        </form>
      </section>
      <section class="card">
        <div class="card-head"><h3>Catálogo Activo (${PR.length})</h3></div>
        <div class="tw">${tbl(['Producto', 'Categoría', 'Precio'], PR.slice(0, 15).map((p) => [esc(p[0]), esc(p[3]), money(p[2])]))}</div>
      </section>
    </div>
  `,

  ventas: () => `<div class="page-head"><div><h2>Nueva Venta (POS Interno)</h2><p>Registra productos y cobra con el medio elegido</p></div><button type="button" class="btn" data-go="historial-ventas">Ver ventas registradas</button></div><div class="pos"><section class="card"><div class="card-head"><h3>Productos</h3><span class="hint">${ico('carrito', 15)} ${PR.length} productos</span></div><label for="q" class="sr-only">Buscar producto en POS</label><input class="search" style="width:100%;max-width:none;padding:10px 12px" placeholder="Buscar producto..." id="q" aria-label="Buscar producto en POS"><div class="chips" id="fl">${['Todos', ...Object.keys(CATS)].map((c) => `<button type="button" class="chip fl" data-f="${esc(c)}">${esc(c)}</button>`).join('')}</div><div class="prods" id="prods"></div></section><section class="card cart"><div class="card-head"><h3>Detalle de venta</h3></div><div id="cart-lines"></div><div class="row total"><b>Total</b><b id="cart-total">0 Bs</b></div><div class="campo-grupo" style="margin-top:10px"><label for="payment-method">Método de pago</label><select id="payment-method"><option>Efectivo</option><option>QR</option><option>Tarjeta</option><option>Billetera móvil</option></select></div><button type="button" class="btn p" id="checkout" style="width:100%;margin-top:10px">${ico('tarjeta', 16)} Registrar y cobrar</button></section></div>`,

  'historial-ventas': () => {
    const saved = readStore('sg-sales', []);
    const s = Array.isArray(saved) ? saved.filter((x) => x && typeof x === 'object') : [];
    const rows = s.map((x) => {
      const items = Array.isArray(x.items) ? x.items.map((i) => Array.isArray(i) ? `${i[0]} x ${Number(i[5]) || 1}` : String(i)).join(', ') : '-';
      return [esc(x.id || '-'), esc(x.date || '-'), esc(items), money(Number(x.total) || 0), esc(x.payment || 'Efectivo')];
    });
    return head('Ventas Registradas', ['Volver a Ventas', 'volver-venta'], `${s.length} ventas guardadas en este dispositivo`) + `<section class="card">${s.length ? tbl(['N°', 'Fecha', 'Productos', 'Total', 'Método de pago'], rows) : '<p class="empty">Aún no hay ventas registradas.</p>'}</section>`;
  },

  inventario: () => {
    const inv = getInventory();
    const mov = readStore('sg-stock-movements', []);
    return head('Inventario', ['Nuevo Artículo', 'nuevo-inventario'], 'Controla existencias, mínimos y movimientos') + `<section class="card"><div class="card-head"><h3>Existencias</h3><label class="catalog-search" for="inventory-q">${ico('buscar', 17)}<input id="inventory-q" placeholder="Buscar artículo" aria-label="Buscar artículo en inventario"></label></div>${tbl(['Artículo', 'Tipo', 'Stock', 'Mínimo', 'Estado', 'Acciones'], inv.map((x) => [esc(x.nombre), esc(x.tipo), `${x.stock} ${esc(x.unidad)}`, `${x.minimo} ${esc(x.unidad)}`, x.stock <= x.minimo ? bad : ok, `<button type="button" class="stock-adjust" data-stock="${esc(x.id)}" data-delta="-1" aria-label="Reducir stock de ${esc(x.nombre)}">-</button> <button type="button" class="stock-adjust" data-stock="${esc(x.id)}" data-delta="1" aria-label="Aumentar stock de ${esc(x.nombre)}">+</button> <button type="button" class="ib sm" data-edit-stock="${esc(x.id)}" aria-label="Editar ${esc(x.nombre)}">${ico('editar', 15)}</button>`]))}</section><section class="card"><div class="card-head"><h3>Últimos movimientos</h3><span class="hint">${mov.length} registros</span></div>${mov.length ? tbl(['Fecha', 'Artículo', 'Tipo', 'Cantidad', 'Detalle'], mov.slice(0, 12).map((m) => [esc(m.fecha), esc(m.nombre), esc(m.tipo), esc(m.cantidad), esc(m.detalle)])) : '<p class="muted empty">Sin movimientos registrados.</p>'}</section>`;
  },

  compras: () => {
    const purchases = readStore('sg-purchases', []);
    return head('Compras', ['Nueva Compra', 'nueva-compra'], 'Registra recepción de insumos y actualiza el inventario') + `<section class="card">${purchases.length ? tbl(['N°', 'Proveedor', 'Fecha', 'Artículo', 'Cantidad', 'Importe', 'Estado'], purchases.map((p) => [esc(p.id), esc(p.proveedor), esc(p.fecha), esc(p.item), `${p.cantidad} ${esc(p.unidad)}`, money(p.total), ok])) : '<p class="empty">Aún no hay compras registradas.</p>'}</section>`;
  },

  proveedores: () => {
    const ps = getSuppliers();
    return head('Proveedores', ['Nuevo Proveedor', 'nuevo-proveedor'], 'Contactos y abastecimiento de la heladería') + `<section class="card"><div class="card-head"><h3>Directorio de proveedores</h3><span class="hint">${ps.length} registrados</span></div>${ps.length ? tbl(['Proveedor', 'Insumos', 'Celular', 'Teléfono fijo', 'Correo', 'Acciones'], ps.map((p) => [esc(p.nombre), esc(p.insumos), esc(p.celular), esc(p.fijo || '-'), esc(p.email || '-'), `<button type="button" class="ib sm" data-edit-supplier="${esc(p.id)}" aria-label="Editar proveedor ${esc(p.nombre)}">${ico('editar', 15)}</button> <button type="button" class="ib sm" data-delete-supplier="${esc(p.id)}" aria-label="Eliminar proveedor ${esc(p.nombre)}">${ico('papelera', 15)}</button>`])) : '<p class="empty">No hay proveedores todavía.</p>'}</section>`;
  },

  sucursales: () => head('Sucursales', null, 'Nuestros puntos de venta en La Paz') + `<div class="kpis three">${[['Central', 'Av. Arce 123', '2.300 Bs', 'home'], ['Sopocachi', 'Calle 6 #45', '1.450 Bs', 'sucursales'], ['Zona Sur', 'Calle 21 #8', '1.900 Bs', 'sucursales']].map((s) => `<article class="card sucursal"><div class="suc-ico">${ico(s[3], 24)}</div><h3>${s[0]}</h3><p>${s[1]}</p><p>${ok} · ${s[2]}</p></article>`).join('')}</div>`,

  caja: () => {
    const box = getCashbox();
    const cashSales = readStore('sg-sales', []).filter((s) => s.payment === 'Efectivo' && box.abierta && s.timestamp >= box.apertura);
    const income = cashSales.reduce((n, s) => n + s.total, 0);
    const expected = box.fondo + income;
    return head('Caja', null, 'Apertura, ingresos en efectivo y cierre de turno') + `<div class="kpis"><div class="kpi"><div><small>Estado</small><b>${box.abierta ? 'Abierta' : 'Cerrada'}</b></div></div><div class="kpi f"><div><small>Fondo de apertura</small><b>${money(box.fondo)}</b></div></div><div class="kpi"><div><small>Ventas en efectivo</small><b>${money(income)}</b></div></div><div class="kpi f"><div><small>Saldo esperado</small><b>${money(box.abierta ? expected : box.ultimoCierre?.contado || 0)}</b></div></div></div><section class="card"><div class="card-head"><h3>Control de caja</h3><span class="hint">${box.abierta && box.apertura ? `Abierta ${new Date(box.apertura).toLocaleString('es-BO')}` : 'Inicia un turno para controlar efectivo'}</span></div><button type="button" class="btn ${box.abierta ? 'p' : ''}" id="cashbox-toggle" data-open="${box.abierta ? 'false' : 'true'}">${box.abierta ? 'Cerrar caja' : 'Abrir caja'}</button></section>`;
  },

  reportes: () => {
    const sales = readStore('sg-sales', []);
    const top = {};
    for (const s of sales) for (const p of s.items || []) top[p[0]] = (top[p[0]] || 0) + (p[5] || 1);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      const key = d.toLocaleDateString('es-BO');
      return { label: d.toLocaleDateString('es-BO', { weekday: 'short' }), total: sales.filter((s) => s.timestamp && new Date(s.timestamp).toLocaleDateString('es-BO') === key).reduce((n, s) => n + s.total, 0) };
    });
    const max = Math.max(1, ...days.map((d) => d.total));
    return head('Reportes', null, 'Indicadores calculados a partir de las ventas registradas') + `<div class="kpis"><div class="kpi"><div><small>Ventas registradas</small><b>${sales.length}</b></div></div><div class="kpi f"><div><small>Ingresos acumulados</small><b>${money(sales.reduce((n, s) => n + s.total, 0))}</b></div></div></div><section class="card"><div class="card-head"><h3>Ventas últimos 7 días</h3></div><div class="chart">${days.map((d) => `<div title="${money(d.total)}" style="height:${Math.max(d.total ? 5 : 2, Math.round(d.total / max * 100))}%"><em>${d.label}</em></div>`).join('')}</div><div style="height:22px"></div></section>`;
  },

  'auditoria-admin': () => {
    const extra = readStore('sg-bitacora', []);
    return `
      ${head('Control, Bitácora y Auditoría', null, 'Panel exclusivo de Administrador: actividad de clientes, eventos DOM y exportación CSV')}
      <p class="ayuda-modulo">Supervisa la actividad en tiempo real de clientes, prueba la bitácora DOM interactiva y usa el bloque inferior de Smoke Test y A11Y.</p>

      <!-- Semana 4 - Bitacora DOM y eventos -->
      <section class="card bitacora-eventos" aria-labelledby="tituloBitacoraEventos">
        <div class="card-head">
          <h3 id="tituloBitacoraEventos">Bitácora DOM y eventos</h3>
          <span class="hint">Meta: 200 eventos registrados</span>
        </div>
        <div class="bitacora-eventos__resumen">
          <p class="bitacora-eventos__contador" id="contadorEventos" tabindex="-1" role="status" aria-live="polite">Eventos registrados: 0 / 200</p>
          <div class="bitacora-eventos__acciones">
            <button type="button" class="btn outline" id="btnEventosVerMas">Ver más</button>
            <button type="button" class="btn outline" id="btnEventosLimpiar">Limpiar bitácora</button>
            <button type="button" class="btn" id="btnEventosCsv">Exportar CSV</button>
            <button type="button" class="btn outline" id="btnEventosPdf">Reporte PDF</button>
            <button type="button" class="btn outline" id="btnEventosRespaldo">Descargar respaldo</button>
            <button type="button" class="btn outline" id="btnEventosReintentar" hidden>Usar tabla bitacora_eventos</button>
          </div>
        </div>

        <div class="bitacora-eventos__progreso" id="progresoEventos" role="progressbar" aria-label="Avance hacia la meta de 200 eventos" aria-valuemin="0" aria-valuemax="200" aria-valuenow="0">
          <span class="bitacora-eventos__progreso-barra"></span>
        </div>
        <p class="bitacora-eventos__meta" id="metaEventos">Operativos: 0 · Interacción: 0</p>

        <p class="bitacora-eventos__origen muted" id="origenEventos">Comprobando origen de datos…</p>
        <p class="bitacora-eventos__sello" id="selloServidor">Sello de tiempo: pendiente de confirmación del servidor.</p>
        <p class="bitacora-eventos__sello" id="respaldoEventos">Respaldo local: sin copia todavía.</p>
        <div class="bitacora-eventos__desglose" id="desgloseEventos" aria-label="Desglose de eventos por tipo"></div>

        <form class="bitacora-eventos__form" id="formEventoManual">
          <div class="bitacora-eventos__form-fila">
            <div class="campo-grupo">
              <label for="eventoManualModulo">Módulo del evento</label>
              <select id="eventoManualModulo">
                <option value="Ventas">Ventas</option>
                <option value="Pedidos">Pedidos</option>
                <option value="Reservas">Reservas</option>
                <option value="Consultas">Consultas</option>
                <option value="Productos">Productos</option>
                <option value="Promociones">Promociones</option>
                <option value="Proveedores">Proveedores</option>
                <option value="Inventario">Inventario</option>
                <option value="Compras">Compras</option>
                <option value="Caja">Caja</option>
                <option value="Eventos">Eventos</option>
              </select>
            </div>
            <div class="campo-grupo">
              <label for="eventoManualDetalle">Detalle del evento de empresa</label>
              <input id="eventoManualDetalle" type="text" maxlength="120" placeholder="Ej.: Apertura de caja turno mañana" required>
            </div>
            <button type="submit" class="btn">Registrar evento</button>
          </div>
          <p class="bitacora-eventos__form-estado muted" id="eventoManualEstado" role="status" aria-live="polite">Registra aquí una operación de negocio; se guarda en Supabase con sello del servidor.</p>
        </form>
        <div class="bitacora-log bitacora-eventos__lista" id="listaEventos" role="log" aria-live="polite" aria-label="Últimos 50 eventos registrados">
          <p class="muted">Cargando eventos...</p>
        </div>
      </section>

      <div class="grid2">
        <section class="card">
          <div class="card-head"><h3>Actividad de Clientes en Vivo (Supabase)</h3></div>
          <div id="feedActividadClientes" class="bitacora-log"><p class="muted">Cargando actividad...</p></div>
        </section>

        <!-- Semana 1 - Bitacora Dia 1 y Dia 2 -->
        <section class="card">
          <div class="card-head"><h3>Laboratorio de Bitácora DOM</h3><span class="hint">Click, DblClick, Keyup, Change, Submit</span></div>
          <div id="contenedorLive" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            <button type="button" class="btn outline" data-prod="Helado Frutilla">Oferta Frutilla</button>
            <button type="button" class="btn p" data-action="like">Like / Doble Click Super Like</button>
          </div>
          <div class="campo-grupo">
            <label for="campoChat">Monitor de teclado (keyup)</label>
            <input id="campoChat" type="text" placeholder="Escribe para registrar evento keyup...">
          </div>
          <form id="formularioOrdenDom">
            <div class="form-row">
              <div class="campo-grupo">
                <label for="campoUsuarioDom">Operador</label>
                <input id="campoUsuarioDom" type="text" required placeholder="Nombre">
              </div>
              <div class="campo-grupo">
                <label for="selectorVarianteDom">Variante de prueba</label>
                <select id="selectorVarianteDom">
                  <option value="Copa Frutilla">Copa Frutilla</option>
                  <option value="Waffle Belga">Waffle Belga</option>
                  <option value="Frappé Oreo">Frappé Oreo</option>
                </select>
              </div>
            </div>
            <button type="submit" class="btn">Registrar Orden DOM</button>
          </form>
          <div id="salidaBitacora" class="bitacora-log" style="margin-top:10px" aria-live="polite"></div>
        </section>
      </div>

      <section class="card">
        <div class="card-head">
          <h3>Bitácora Operativa del Sistema (${extra.length})</h3>
          <button type="button" class="btn" id="export-log">Exportar CSV</button>
        </div>
        ${extra.length ? tbl(['Fecha', 'Hora', 'Usuario', 'Evento', 'Módulo', 'Estado'], extra.map((b) => [esc(b.fecha), esc(b.hora), esc(b.usuario), esc(b.evento), esc(b.modulo), `<span class="tag">${esc(b.estado)}</span>`])) : '<p class="empty">Todavía no hay movimientos operativos.</p>'}
      </section>
    `;
  }
};
