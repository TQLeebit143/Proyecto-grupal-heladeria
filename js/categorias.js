// Semana 1 - Filtro Catalogo
const CATS = {
  Helados: ['crema', 'helados', ['Artesanales', 'Copas de helado', 'Conos', 'Canastas de galleta', 'Helados de fruta', 'Sin azúcar', 'Veganos', 'Pints para llevar']],
  Frappés: ['menta', 'bebida', ['Chocolate', 'Oreo', 'Caramelo', 'Vainilla', 'Frutilla', 'Café', 'Mocha', 'Té matcha']],
  Cafés: ['cafe', 'cafe', ['Espresso', 'Americano', 'Cappuccino', 'Latte', 'Mocaccino', 'Cafés fríos', 'Flat white', 'Macchiato']],
  Repostería: ['torta', 'pastel', ['Tortas', 'Cheesecakes', 'Brownies', 'Cupcakes', 'Galletas', 'Croissants', 'Tiramisú', 'Flan casero']],
  Milkshakes: ['leche', 'bebida', ['Chocolate', 'Frutilla', 'Vainilla', 'Oreo', 'Caramelo', 'Banana', 'Mango']],
  Waffles: ['waffle', 'waffle', ['Waffle clásico', 'Waffle con frutas', 'Waffle chocolate', 'Crepes dulces', 'Crepes salados', 'Paninis']],
  Jugos: ['jugo', 'jugo', ['Jugos naturales', 'Smoothies', 'Limonada', 'Bebidas frías', 'Té helado', 'Aguas saborizadas']],
  Promociones: ['etiqueta', 'etiqueta', ['Combos familiares', '2x1 helados', 'Postre + café', 'Cumpleaños', 'Pedidos especiales', 'Menú infantil']]
};

const PR_BASE = [
  ['Helado frutilla', 'crema', 25, 'Helados', 'helado', 'images/productos/helado-frutilla.jpg', 'Gelato cremoso de frutillas frescas de estación.', 'Helados de fruta'],
  ['Frappé chocolate', 'menta', 28, 'Frappés', 'bebida', 'images/productos/frappe-chocolate.jpg', 'Bebida helada batida con cacao artesanal y crema.', 'Chocolate'],
  ['Cappuccino', 'cafe', 18, 'Cafés', 'cafe', 'images/productos/cappuccino.jpg', 'Espresso de los Yungas con leche vaporizada sedosa.', 'Cappuccino'],
  ['Torta chocolate', 'torta', 22, 'Repostería', 'pastel', 'images/productos/torta-chocolate.jpg', 'Porción húmeda de bizcocho de cacao y ganache.', 'Tortas'],
  ['Helado vegano', 'menta', 24, 'Helados', 'helado', 'images/productos/helado-vegano.jpg', 'Elaborado con base vegetal y fruta natural sin lácteos.', 'Veganos'],
  ['Frappé Oreo', 'menta', 30, 'Frappés', 'bebida', 'images/productos/frappe-chocolate.jpg', 'Frappé cremoso con galletas de chocolate trituradas.', 'Oreo'],
  ['Latte', 'cafe', 17, 'Cafés', 'cafe', 'images/productos/cappuccino.jpg', 'Café suave con doble porción de leche cremosa.', 'Latte'],
  ['Brownie', 'torta', 15, 'Repostería', 'pastel', 'images/productos/brownie.jpg', 'Brownie tibio de chocolate intenso con nueces.', 'Brownies'],
  ['Helado mango', 'jugo', 26, 'Helados', 'helado', 'images/productos/helado-vegano.jpg', 'Sorbete artesanal de mango maduro seleccionado.', 'Helados de fruta'],
  ['Milkshake Oreo', 'leche', 27, 'Milkshakes', 'bebida', 'images/productos/frappe-chocolate.jpg', 'Malteada espesa de gelato de vainilla y galleta.', 'Oreo'],
  ['Cheesecake frutilla', 'torta', 28, 'Repostería', 'pastel', 'images/productos/cheesecake-frutilla.jpg', 'Base crocante con crema de queso y coulis de frutilla.', 'Cheesecakes'],
  ['Espresso doble', 'cafe', 14, 'Cafés', 'cafe', 'images/productos/cappuccino.jpg', 'Extracción intensa de grano boliviano recién molido.', 'Espresso'],
  ['Waffle con frutas', 'waffle', 32, 'Waffles', 'waffle', 'images/productos/waffle.jpg', 'Waffle belga dorado con fruta fresca y bola de gelato.', 'Waffle con frutas'],
  ['Jugo de naranja', 'jugo', 16, 'Jugos', 'jugo', 'images/productos/jugo-naranja.jpg', 'Exprimido al instante sin azúcares añadidos.', 'Jugos naturales'],
  ['Helado Oreo', 'crema', 26, 'Helados', 'helado', 'images/productos/helado-frutilla.jpg', 'Gelato de crema americana con trozos de galleta.', 'Artesanales'],
  ['Frappé caramelo', 'menta', 29, 'Frappés', 'bebida', 'images/productos/frappe-chocolate.jpg', 'Batido frío con salsa de caramelo tostado.', 'Caramelo'],
  ['Capuccino frío', 'cafe', 20, 'Cafés', 'cafe', 'images/productos/cappuccino.jpg', 'Espresso servido sobre hielo con espuma fría.', 'Cafés fríos'],
  ['Cupcake vainilla', 'torta', 18, 'Repostería', 'pastel', 'images/productos/cupcake-vainilla.jpg', 'Bizcocho esponjoso de vainilla con buttercream suave.', 'Cupcakes'],
  ['Milkshake frutilla', 'leche', 26, 'Milkshakes', 'bebida', 'images/productos/frappe-chocolate.jpg', 'Malteada de gelato de frutilla natural y leche fría.', 'Frutilla'],
  ['Crepe chocolate', 'waffle', 25, 'Waffles', 'waffle', 'images/productos/waffle.jpg', 'Crepe delgada rellena de crema de avellanas y cacao.', 'Crepes dulces'],
  ['Smoothie mango', 'jugo', 22, 'Jugos', 'jugo', 'images/productos/jugo-naranja.jpg', 'Pulpa natural de mango licuada con hielo frappé.', 'Smoothies'],
  ['Combo familiar 4 pints', 'etiqueta', 89, 'Promociones', 'etiqueta', 'images/productos/helado-frutilla.jpg', 'Cuatro envases de medio litro con tus sabores favoritos.', 'Combos familiares'],
  ['Postre + café', 'etiqueta', 34, 'Promociones', 'etiqueta', 'images/productos/cheesecake-frutilla.jpg', 'Dúo de repostería artesanal acompañado de café a elección.', 'Postre + café'],
  ['Helado sin azúcar', 'crema', 27, 'Helados', 'helado', 'images/productos/helado-vegano.jpg', 'Gelato endulzado naturalmente apto para control calórico.', 'Sin azúcar'],
  ['Té matcha frío', 'jugo', 24, 'Frappés', 'bebida', 'images/productos/frappe-chocolate.jpg', 'Té verde ceremonial batido con leche fría y hielo.', 'Té matcha'],
  ['Flan casero', 'torta', 19, 'Repostería', 'pastel', 'images/productos/flan-casero.jpg', 'Flan horneado lentamente con caramelo artesanal.', 'Flan casero'],
  ['Waffle clásico', 'waffle', 28, 'Waffles', 'waffle', 'images/productos/waffle.jpg', 'Waffle crujiente con miel de maple y crema batida.', 'Waffle clásico']
];

let PR = PR_BASE.map((item) => [...item]);

const CAT_EVENTOS = [
  ['Cumpleaños', 'Celebraciones familiares e infantiles', 'estrella', 350],
  ['Bodas', 'Dulzura artesanal para tu día especial', 'check', 800],
  ['Eventos corporativos', 'Coffee break y postres para empresas', 'sucursales', 500],
  ['Baby shower', 'Momentos inolvidables en familia', 'corazon', 420],
  ['Graduaciones', 'Brindis dulce por un nuevo comienzo', 'estrella', 380],
  ['Pedidos especiales', 'Tortas y helados a medida', 'etiqueta', 300]
];

const CART_POS_KEY = 'sg-cart';
const CART_CLIENTE_KEY = 'sg-client-cart';

function sanitizarHtml(html) {
  if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
    return window.DOMPurify.sanitize(String(html ?? ''), {
      ALLOWED_TAGS: ['b', 'strong', 'em', 'i', 'span', 'p', 'br'],
      ALLOWED_ATTR: ['class']
    });
  }
  return String(html ?? '');
}

function sanitizarTextoUsuario(texto) {
  const valor = String(texto ?? '');
  if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
    return window.DOMPurify.sanitize(valor, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }
  return valor;
}

// Semana 2 - Fetch Lazy Loading y Bubbling
async function cargarCatalogoLocalYRemoto() {
  let base = PR_BASE.map((item) => [...item]);
  const esArchivoLocal = typeof location !== 'undefined' && location.protocol === 'file:';
  if (!esArchivoLocal) {
    try {
      const res = await fetch('./data/catalogo.json');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length) {
          base = json.map((p) => [
            sanitizarTextoUsuario(p.nombre),
            p.icono || 'crema',
            Number(p.precio) || 20,
            sanitizarTextoUsuario(p.categoria || 'Helados'),
            p.tipo || 'helado',
            p.imagen || PR_BASE[0][5],
            sanitizarTextoUsuario(p.descripcion || 'Preparado artesanalmente con ingredientes seleccionados.'),
            sanitizarTextoUsuario(p.subcategoria || '')
          ]);
        }
      }
    } catch (_) {}
  }

  try {
    if (window.SupabaseAPI) {
      const extras = await window.SupabaseAPI.consultarTabla('productos_extra');
      if (Array.isArray(extras)) {
        extras.forEach((ex) => {
          if (!ex || !ex.nombre) return;
          const nombreLimpio = sanitizarTextoUsuario(ex.nombre);
          const existe = base.some((p) => p[0].toLowerCase() === nombreLimpio.toLowerCase());
          if (!existe) {
            base.unshift([
              nombreLimpio,
              'crema',
              Number(ex.precio) || 25,
              sanitizarTextoUsuario(ex.categoria || 'Helados'),
              'helado',
              ex.imagen || PR_BASE[0][5],
              sanitizarTextoUsuario(ex.descripcion || 'Producto especial añadido desde el panel operativo.'),
              'Especiales'
            ]);
          }
        });
      }
    }
  } catch (_) {}
  PR = base;
  return PR;
}

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_POS_KEY) || '[]'); } catch (_) { return []; }
}
function saveCart(c) {
  try { localStorage.setItem(CART_POS_KEY, JSON.stringify(c)); } catch (_) {}
  renderCart();
}
function getClientCart() {
  try { return JSON.parse(localStorage.getItem(CART_CLIENTE_KEY) || '[]'); } catch (_) { return []; }
}
function saveClientCart(c) {
  try { localStorage.setItem(CART_CLIENTE_KEY, JSON.stringify(c)); } catch (_) {}
  renderClientCart();
}

function addProduct(p) {
  const c = getCart();
  const found = c.find((x) => x[0] === p[0]);
  if (found) found[5] = (Number(found[5]) || 1) + 1;
  else c.push([p[0], p[1], p[2], p[3], p[4], 1]);
  saveCart(c);
}

function addClientProduct(p, cantidad = 1) {
  const cant = Math.max(1, Number(cantidad) || 1);
  const nombre = Array.isArray(p) ? p[0] : (p.nombre || 'Producto');
  const precio = Array.isArray(p) ? Number(p[2]) : Number(p.precio || 0);
  const categoria = Array.isArray(p) ? p[3] : (p.categoria || 'Promociones');
  const imagen = Array.isArray(p) ? photoUrl(p) : (p.imagen || PR_BASE[0][5]);
  const c = getClientCart();
  const found = c.find((x) => x.nombre === nombre);
  if (found) found.cantidad += cant;
  else c.push({ nombre, precio, categoria, imagen, cantidad: cant });
  saveClientCart(c);
  if (window.SupabaseAPI) {
    window.SupabaseAPI.registrarActividad('CARRITO_AGREGAR', `Agregó ${nombre} x${cant} (${money(precio * cant)})`);
  }
}

function renderCart() {
  const $lines = $('#cart-lines');
  if (!$lines.length) return;
  const c = getCart();
  const total = c.reduce((s, x) => s + Number(x[2]) * Number(x[5]), 0);
  const html = c.length
    ? c.map((p, i) => `<div class="row"><span>${esc(p[0])} <button type="button" class="qty" data-i="${i}" data-d="-1" aria-label="Quitar uno de ${esc(p[0])}">-</button> ${p[5]} <button type="button" class="qty" data-i="${i}" data-d="1" aria-label="Agregar uno de ${esc(p[0])}">+</button></span><b>${money(p[2] * p[5])} <button type="button" class="remove" data-i="${i}" aria-label="Eliminar ${esc(p[0])}">${ico('cerrar', 14)}</button></b></div>`).join('')
    : '<p class="muted empty">Tu venta está vacía. Agrega productos para comenzar.</p>';
  $lines.html(html);
  $('#cart-total').text(money(total));
  $('#checkout').prop('disabled', !c.length);
}

function renderClientCart() {
  const c = getClientCart();
  const total = c.reduce((s, x) => s + Number(x.precio) * Number(x.cantidad), 0);
  const count = c.reduce((s, x) => s + Number(x.cantidad), 0);

  const badgeCount = document.getElementById('headerCartCount');
  const badgeTotal = document.getElementById('headerCartTotal');
  const btnHeader = document.getElementById('btnCarritoHeader');
  if (badgeCount) badgeCount.textContent = String(count);
  if (badgeTotal) badgeTotal.textContent = `Bs ${Number(total).toLocaleString('es-BO')}`;
  if (btnHeader) {
    btnHeader.classList.remove('pulso');
    void btnHeader.offsetWidth;
    if (count > 0) btnHeader.classList.add('pulso');
  }

  const drawerLines = document.getElementById('drawerCartLines');
  if (drawerLines) {
    drawerLines.innerHTML = c.length
      ? c.map((p, i) => `
        <div class="drawer-item">
          <img class="drawer-item__img" src="${esc(p.imagen || PR_BASE[0][5])}" alt="${esc(p.nombre)} en carrito">
          <div class="drawer-item__info">
            <strong>${esc(p.nombre)}</strong>
            <small>${money(p.precio)} c/u · Subtotal ${money(p.precio * p.cantidad)}</small>
          </div>
          <div class="drawer-item__ctrl">
            <button type="button" class="qty client-qty" data-ci="${i}" data-d="-1" aria-label="Reducir ${esc(p.nombre)}">-</button>
            <span>${p.cantidad}</span>
            <button type="button" class="qty client-qty" data-ci="${i}" data-d="1" aria-label="Aumentar ${esc(p.nombre)}">+</button>
            <button type="button" class="remove client-remove" data-ci="${i}" aria-label="Eliminar ${esc(p.nombre)}">${ico('cerrar', 14)}</button>
          </div>
        </div>
      `).join('')
      : '<p class="muted empty">Tu carrito está vacío. Explora el catálogo o reclama la promoción vigente.</p>';
  }

  const drawerTotal = document.getElementById('drawerCartTotal');
  if (drawerTotal) {
    drawerTotal.textContent = money(total);
    if (typeof window.$ === 'function') {
      $('#drawerCartTotal').stop(true, true).animate({ opacity: 0.3 }, 120).animate({ opacity: 1 }, 180);
    }
  }
  const btnPagar = document.getElementById('btnDrawerPagar');
  if (btnPagar) btnPagar.disabled = !c.length;

  const $lines = $('#client-cart-lines');
  if ($lines.length) {
    const html = c.length
      ? c.map((p, i) => `<div class="row"><span>${esc(p.nombre)} <button type="button" class="qty client-qty" data-ci="${i}" data-d="-1" aria-label="Reducir cantidad de ${esc(p.nombre)}">-</button> ${p.cantidad} <button type="button" class="qty client-qty" data-ci="${i}" data-d="1" aria-label="Aumentar cantidad de ${esc(p.nombre)}">+</button></span><b>${money(p.precio * p.cantidad)} <button type="button" class="remove client-remove" data-ci="${i}" aria-label="Quitar ${esc(p.nombre)}">${ico('cerrar', 14)}</button></b></div>`).join('')
      : '<p class="muted empty">Tu pedido está vacío. Explora el catálogo para agregar sabores.</p>';
    $lines.html(html);
    $('#client-cart-total').text(money(total));
    $('#btnConfirmarPedidoCliente').prop('disabled', !c.length);
  }
}

function drawProds() {
  const $grid = $('#prods');
  if (!$grid.length) return;
  const f = $('.fl.on').data('f') || 'Todos';
  const q = ($('#q').val() || '').toLowerCase();
  const html = PR.filter((p) => (f === 'Todos' || p[3] === f) && p[0].toLowerCase().includes(q))
    .map((p) => `<article class="pr"><img class="pos-photo" src="${esc(photoUrl(p))}" alt="${esc(p[0])} en punto de venta" loading="lazy"><strong>${esc(p[0])}</strong><b>${money(p[2])}</b><button type="button" class="btn p add-product" data-i="${PR.indexOf(p)}" aria-label="Agregar ${esc(p[0])} a la venta">Agregar</button></article>`).join('');
  $grid.html(html || '<p class="empty">No encontramos productos con esa búsqueda.</p>');
}

// Semana 1 - Filtro Catalogo
function filtrarCatalogo(categoriaSeleccionada) {
  const listaTarjetas = document.querySelectorAll('.card-item');
  listaTarjetas.forEach((tarjetaActual) => {
    const categoriaTarjeta = tarjetaActual.dataset.categoria;
    const coincide = (categoriaSeleccionada === 'todos' || categoriaSeleccionada === 'Todos' || categoriaTarjeta === categoriaSeleccionada);
    tarjetaActual.style.display = coincide ? 'flex' : 'none';
  });
}

let paginaCatalogo = 0;
let tamanoPaginaCatalogo = window.matchMedia('(max-width: 600px)').matches ? 4 : 6;
window.reiniciarPaginaCatalogo = () => { paginaCatalogo = 0; };

function drawCatalog(subcategoriaFiltro = '') {
  const $grid = $('#catalog-grid');
  if (!$grid.length) return;
  const f = $('.catalog-filter.active').attr('data-product-filter') || 'Todos';
  const q = ($('#catalog-q').val() || '').toLowerCase();
  const sub = String(subcategoriaFiltro || $('#capa2').val() || '').toLowerCase();

  let list = PR.map((p, i) => ({ p, i }))
    .filter(({ p }) => (f === 'Todos' || p[3] === f) && (p[0].toLowerCase().includes(q) || p[3].toLowerCase().includes(q) || (p[7] || '').toLowerCase().includes(q)));

  if (sub) {
    const exactSub = list.filter(({ p }) => (p[7] || '').toLowerCase().includes(sub) || p[0].toLowerCase().includes(sub));
    if (exactSub.length) list = exactSub;
  }

  const totalPaginas = Math.max(1, Math.ceil(list.length / tamanoPaginaCatalogo));
  paginaCatalogo = Math.min(paginaCatalogo, totalPaginas - 1);
  const inicio = paginaCatalogo * tamanoPaginaCatalogo;
  const visibles = list.slice(inicio, inicio + tamanoPaginaCatalogo);
  const contenido = visibles.map(({ p, i }) => productCard(p, i)).join('') || '<p class="empty">No encontramos productos con esa búsqueda.</p>';
  const anterior = document.getElementById('catalog-prev');
  const siguiente = document.getElementById('catalog-next');
  const estado = document.getElementById('catalog-page-status');
  if (anterior) anterior.disabled = paginaCatalogo === 0 || !list.length;
  if (siguiente) siguiente.disabled = paginaCatalogo >= totalPaginas - 1 || !list.length;
  if (estado) estado.textContent = list.length ? `Página ${paginaCatalogo + 1} de ${totalPaginas} · ${list.length} productos` : 'Sin productos';
  $grid.stop(true, true).fadeOut('fast', function () {
    $grid.html(contenido).fadeIn('fast');
  });
}

const catCards = () => `<div class="cats">${Object.entries(CATS).map(([k, v]) => `<button type="button" class="cat" data-c="${esc(k)}"><span>${ico(v[1], 28)}</span>${esc(k)}</button>`).join('')}</div>`;

function iniciarEventosCategorias() {
  if (typeof window.$ !== 'function') return;
  $(document)
    .off('click.cat', '.cat').on('click.cat', '.cat', function (e) {
      e.preventDefault();
      const k = $(this).attr('data-c');
      if (!k || !CATS[k]) return;
      if (typeof window.abrirCatalogoFiltrado === 'function') {
        window.abrirCatalogoFiltrado(k);
      }
    })
    .off('click.catalog-menu', '#catalog-menu-toggle').on('click.catalog-menu', '#catalog-menu-toggle', function () {
      const lista = document.getElementById('catalog-category-list');
      if (!lista) return;
      const abierto = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', String(!abierto));
      lista.hidden = abierto;
    })
    .off('click.catalog-page', '#catalog-prev, #catalog-next').on('click.catalog-page', '#catalog-prev, #catalog-next', function () {
      paginaCatalogo += this.id === 'catalog-next' ? 1 : -1;
      drawCatalog();
    })
    .off('click.subchip', '.chip-subcat').on('click.subchip', '.chip-subcat', function (e) {
      e.preventDefault();
      const cat = $(this).attr('data-cat') || 'Todos';
      const sub = $(this).attr('data-subcat') || '';
      if (typeof window.abrirCatalogoFiltrado === 'function') {
        window.abrirCatalogoFiltrado(cat, sub);
      } else if (typeof window.go === 'function') {
        window.go('productos');
      }
    })
    .off('click.addprod', '.add-product').on('click.addprod', '.add-product', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const idx = Number($(this).attr('data-i'));
      const prod = PR[idx];
      if (!prod) return;
      const sesion = window.SupabaseAPI ? window.SupabaseAPI.getSesion() : { rol: 'cliente' };
      if (sesion.rol === 'cliente') {
        addClientProduct(prod, 1);
        showToast(`${prod[0]} añadido al carrito.`);
        if (typeof window.abrirDrawerCarrito === 'function') window.abrirDrawerCarrito();
      } else {
        addProduct(prod);
      }
    })
    .off('click.simular', '.card-item__btn-simular').on('click.simular', '.card-item__btn-simular', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const idx = Number($(this).attr('data-i'));
      if (!Number.isNaN(idx) && typeof window.openProductModal === 'function') {
        window.openProductModal(idx);
      }
    })
    .off('click.cardopen', '.card-item').on('click.cardopen', '.card-item', function (e) {
      if ($(e.target).closest('button').length) return;
      e.preventDefault();
      e.stopPropagation();
      const idx = Number($(this).attr('data-product-index'));
      if (!Number.isNaN(idx) && typeof window.openProductModal === 'function') {
        window.openProductModal(idx);
      }
    })
    .off('click.qty').on('click.qty', '.qty:not(.client-qty)', function () {
      const c = getCart();
      const i = Number($(this).attr('data-i'));
      c[i][5] += Number($(this).attr('data-d'));
      if (c[i][5] <= 0) c.splice(i, 1);
      saveCart(c);
    })
    .off('click.rem').on('click.rem', '.remove:not(.client-remove)', function () {
      const c = getCart();
      c.splice(Number($(this).attr('data-i')), 1);
      saveCart(c);
    })
    .off('click.cqty').on('click.cqty', '.client-qty', function () {
      const c = getClientCart();
      const i = Number($(this).attr('data-ci'));
      c[i].cantidad += Number($(this).attr('data-d'));
      if (c[i].cantidad <= 0) c.splice(i, 1);
      saveClientCart(c);
    })
    .off('click.crem').on('click.crem', '.client-remove', function () {
      const c = getClientCart();
      c.splice(Number($(this).attr('data-ci')), 1);
      saveClientCart(c);
    })
    .off('click.checkout').on('click.checkout', '#checkout', function () {
      const c = getCart();
      if (!c.length) return;
      const total = c.reduce((s, x) => s + x[2] * x[5], 0);
      const sales = readStore('sg-sales', []);
      const inventory = getInventory();
      const originalInventory = JSON.parse(JSON.stringify(inventory));
      const pendingMovements = [];
      for (const item of c) {
        const stock = inventory.find((x) => x.nombre === item[0]);
        if (stock && stock.stock < item[5]) {
          showToast(`Stock insuficiente de ${item[0]}. Disponible: ${stock.stock} ${stock.unidad}.`, 'error');
          return;
        }
      }
      const payment = $('#payment-method').val() || 'Efectivo';
      if (payment === 'Efectivo' && !getCashbox().abierta) {
        showToast('Abre la caja antes de registrar una venta en efectivo.', 'error');
        go('caja');
        return;
      }
      for (const item of c) {
        const stock = inventory.find((x) => x.nombre === item[0]);
        if (stock) {
          stock.stock -= item[5];
          pendingMovements.push({ id: Date.now() + Math.random(), fecha: new Date().toLocaleString('es-BO'), nombre: stock.nombre, tipo: 'Venta', cantidad: item[5], detalle: 'Descuento por venta' });
        }
      }
      if (!writeStore('sg-inventory', inventory)) return;
      const sale = { id: `V-${Date.now()}`, date: new Date().toLocaleString('es-BO'), timestamp: Date.now(), items: c, total, payment };
      sales.unshift(sale);
      if (!writeStore('sg-sales', sales)) { writeStore('sg-inventory', originalInventory); return; }
      writeStore('sg-stock-movements', [...pendingMovements, ...readStore('sg-stock-movements', [])].slice(0, 500));
      try { localStorage.setItem(CART_POS_KEY, '[]'); } catch (_) {}
      renderCart();
      addBitacora(`Venta ${sale.id} registrada por ${money(total)} · ${payment}`, 'Ventas');
      showToast(`Venta registrada por ${money(total)} con ${payment}.`);
      go('historial-ventas');
    })
    .off('click.fl', '.fl').on('click.fl', '.fl', function () {
      $('.fl').removeClass('on');
      $(this).addClass('on');
      drawProds();
    })
    .off('keyup.q', '#q').on('keyup.q', '#q', drawProds)
    .off('click.cfilt', '.catalog-filter').on('click.cfilt', '.catalog-filter', function (e) {
      e.preventDefault();
      $('.catalog-filter').removeClass('active');
      $(this).addClass('active');
      paginaCatalogo = 0;
      const cat = $(this).attr('data-product-filter') || 'Todos';
      if ($('#capa1').length) {
        $('#capa1').val(cat === 'Todos' ? '' : cat);
        if (typeof window.poblarEspecialidadesCapa2 === 'function') {
          window.poblarEspecialidadesCapa2(cat === 'Todos' ? '' : cat);
        }
      }
      paginaCatalogo = 0;
      $('#catalog-category-list').prop('hidden', true);
      $('#catalog-menu-toggle').attr('aria-expanded', 'false');
      drawCatalog('');
    })
    .off('keyup.cq', '#catalog-q').on('keyup.cq', '#catalog-q', function () { paginaCatalogo = 0; drawCatalog(); });
  $(document).off('change.catalog-size').on('change.catalog-size', '#capa1, #capa2', function () { paginaCatalogo = 0; });
  if (!window.__catalogPageSizeBound) {
    window.__catalogPageSizeBound = true;
    window.addEventListener('resize', () => {
      const nuevoTamano = window.matchMedia('(max-width: 600px)').matches ? 4 : 6;
      if (nuevoTamano !== tamanoPaginaCatalogo) { tamanoPaginaCatalogo = nuevoTamano; paginaCatalogo = 0; drawCatalog(); }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarEventosCategorias);
} else {
  iniciarEventosCategorias();
}
