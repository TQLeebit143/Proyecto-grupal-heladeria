// ============================================================
// Semana 4 - Bitacora DOM y eventos
// ------------------------------------------------------------
// Captura interacciones con delegacion de eventos (click, dblclick,
// keyup, change, submit y mouseover) y las envia a Supabase en lotes.
//
// Privacidad:
//   - En campos de contrasena no se registra nada.
//   - En el resto del teclado solo se guarda el id del campo y la
//     cantidad de caracteres, nunca el texto.
//   - PRODUCT_SEARCH si guarda el termino, recortado a 60 caracteres.
//
// Destino:
//   1) actividad_clientes: tabla oficial de la Guia, ya existente.
//      Es el destino por defecto para que la consola quede sin errores.
//   2) bitacora_eventos: tabla opcional de la Semana 4. Se activa con
//      el boton del panel cuando el companero ya ejecuto el SQL.
//
// Sello de tiempo:
//   La columna creado_en la genera SIEMPRE el servidor (DEFAULT NOW()).
//   El cliente no la envia; cuando Supabase devuelve la fila insertada,
//   el evento local se actualiza con ese sello del servidor.
// ============================================================
(function () {
  'use strict';

  const META_EVENTOS = 200;
  const CLAVE_LOCAL = 'sg_bitacora_eventos_local';
  const CLAVE_RESPALDO = 'sg_bitacora_respaldo';
  const CLAVE_DESTINO = 'sg_bitacora_destino';
  const CLAVE_ULTIMA_VISTA = 'sg_bitacora_ultima_vista';
  const LIMITE_LOCAL = 300;
  const LIMITE_RESPALDO = 500;
  const LOTE_MAXIMO = 5;
  const ESPERA_LOTE = 3000;
  const VENTANA_DOM = 1000;
  const VENTANA_HOVER = 2500;
  const VENTANA_DUPLICADO = 900;
  const TABLA_NUEVA = 'bitacora_eventos';
  const TABLA_RESPALDO = 'actividad_clientes';
  const TABLA_POR_DEFECTO = TABLA_RESPALDO;

  // Tipos fijos de la guia (solo se emiten si el elemento existe).
  const TIPOS = {
    PAGE_VIEW: 'PAGE_VIEW',
    MENU_OPEN: 'MENU_OPEN',
    THEME_CHANGE: 'THEME_CHANGE',
    CONTRAST_TOGGLE: 'CONTRAST_TOGGLE',
    CATEGORY_SELECT: 'CATEGORY_SELECT',
    SUBCATEGORY_SELECT: 'SUBCATEGORY_SELECT',
    PRODUCT_SEARCH: 'PRODUCT_SEARCH',
    PRODUCT_VIEW: 'PRODUCT_VIEW',
    ADD_TO_CART: 'ADD_TO_CART',
    REMOVE_FROM_CART: 'REMOVE_FROM_CART',
    FORM_OPEN: 'FORM_OPEN',
    FORM_SUBMIT: 'FORM_SUBMIT',
    ORDER_CONFIRM: 'ORDER_CONFIRM',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    CLICK: 'CLICK',
    DBLCLICK: 'DBLCLICK',
    KEY_INPUT: 'KEY_INPUT',
    FIELD_CHANGE: 'FIELD_CHANGE',
    HOVER: 'HOVER'
  };

  // Operaciones del sistema (ventas, proveedores, inventario, compras, caja...)
  const TIPOS_OPERACION = {
    Ventas: 'OP_VENTA',
    Pedidos: 'OP_PEDIDO',
    Reservas: 'OP_RESERVA',
    Consultas: 'OP_CONSULTA',
    Productos: 'OP_PRODUCTO',
    Promociones: 'OP_PROMOCION',
    Proveedores: 'OP_PROVEEDOR',
    Inventario: 'OP_INVENTARIO',
    Compras: 'OP_COMPRA',
    Caja: 'OP_CAJA',
    Eventos: 'OP_EVENTO'
  };

  const estado = {
    buffer: [],
    temporizador: null,
    ultimoEventoDom: 0,
    ultimoHover: 0,
    huellas: new Map(),
    destino: null,
    ultimaVista: '',
    enviando: false,
    pagina: 0,
    listaEnPantalla: [],
    modalesVistos: typeof WeakSet === 'function' ? new WeakSet() : null
  };

  // ------------------------------------------------------------
  // Utilidades
  // ------------------------------------------------------------
  function texto(valor) {
    return String(valor == null ? '' : valor).trim();
  }

  function recortar(valor, maximo) {
    const limpio = texto(valor).replace(/\s+/g, ' ');
    return limpio.length > maximo ? `${limpio.slice(0, maximo - 1)}…` : limpio;
  }

  function api() {
    return typeof window !== 'undefined' ? window.SupabaseAPI : null;
  }

  function config() {
    const capa = api();
    if (!capa) return null;
    return {
      url: capa.SUPABASE_URL,
      clave: capa.SUPABASE_KEY,
      proyecto: capa.PROYECTO_ACTUAL
    };
  }

  function sesionActual() {
    const capa = api();
    if (!capa || typeof capa.getSesion !== 'function') {
      return { nombre: 'Invitado', rol: 'cliente', invitado: true };
    }
    try {
      return capa.getSesion() || { nombre: 'Invitado', rol: 'cliente', invitado: true };
    } catch (_) {
      return { nombre: 'Invitado', rol: 'cliente', invitado: true };
    }
  }

  function usuarioVisible() {
    const sesion = sesionActual();
    if (sesion.invitado) return 'Invitado';
    return texto(sesion.nombre) || texto(sesion.usuario) || 'Invitado';
  }

  function rolVisible() {
    const rol = sesionActual().rol;
    return ['cliente', 'encargado', 'admin'].includes(rol) ? rol : 'cliente';
  }

  function guardarLocal(lista) {
    try {
      window.localStorage.setItem(CLAVE_LOCAL, JSON.stringify(lista.slice(0, LIMITE_LOCAL)));
    } catch (_) {}
  }

  function leerLocal() {
    try {
      const crudo = window.localStorage.getItem(CLAVE_LOCAL);
      const lista = crudo ? JSON.parse(crudo) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (_) {
      return [];
    }
  }

  function esPassword(elemento) {
    if (!elemento || !elemento.tagName) return false;
    const tipo = (elemento.getAttribute('type') || '').toLowerCase();
    if (tipo === 'password') return true;
    const id = (elemento.id || '').toLowerCase();
    const nombre = (elemento.getAttribute('name') || '').toLowerCase();
    if (/(pass|clave|contrasena|contraseña)/.test(id) || /(pass|clave|contrasena)/.test(nombre)) return true;
    return Boolean(elemento.closest && elemento.closest('[data-privado]'));
  }

  function descripcionElemento(elemento) {
    if (!elemento || !elemento.tagName) return 'elemento';
    const etiqueta = elemento.tagName.toLowerCase();
    const textoVisible = recortar(elemento.getAttribute('aria-label') || elemento.textContent || '', 42);
    return textoVisible ? `${etiqueta} «${textoVisible}»` : etiqueta;
  }

  // ------------------------------------------------------------
  // Semana 4 - Estructura de clase para cada evento
  // ------------------------------------------------------------
  // Cada evento es un objeto con su tipo, detalle, modulo, autor y
  // los dos sellos de tiempo: el del cliente y el del servidor.
  class EventoBitacora {
    constructor(datos) {
      const d = datos || {};
      this.tipo = texto(d.tipo) || TIPOS.CLICK;
      this.detalle = recortar(d.detalle, 240) || this.tipo;
      this.modulo = texto(d.modulo) || 'DOM';
      this.usuario = texto(d.usuario) || 'Invitado';
      this.rol = texto(d.rol) || 'cliente';
      this.clave_local = `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      this.creado_en_cliente = new Date().toISOString();
      this.creado_en_servidor = null;
      this.id_remoto = null;
    }

    // Fila que se envia a Supabase (sin creado_en: lo pone el servidor).
    aFila(tabla, proyecto) {
      if (tabla === TABLA_NUEVA) {
        return {
          proyecto,
          usuario: this.usuario,
          rol: this.rol,
          tipo_evento: this.tipo,
          modulo: this.modulo,
          detalle: this.detalle
        };
      }
      return {
        proyecto,
        cliente: this.usuario,
        accion: this.tipo,
        detalle: this.modulo === 'DOM' ? this.detalle : `[${this.modulo}] ${this.detalle}`
      };
    }

    // Guarda el sello del servidor cuando Supabase confirma la insercion.
    conSello(fila) {
      if (fila && fila.creado_en) this.creado_en_servidor = fila.creado_en;
      if (fila && fila.id != null) this.id_remoto = fila.id;
      return this;
    }

    aLocal() {
      return {
        clave_local: this.clave_local,
        tipo: this.tipo,
        detalle: this.detalle,
        modulo: this.modulo,
        usuario: this.usuario,
        rol: this.rol,
        creado_en: this.creado_en_servidor || this.creado_en_cliente,
        creado_en_cliente: this.creado_en_cliente,
        creado_en_servidor: this.creado_en_servidor,
        id_remoto: this.id_remoto
      };
    }
  }

  // ------------------------------------------------------------
  // Destino en Supabase
  // ------------------------------------------------------------
  function destinoGuardado() {
    try {
      const valor = window.localStorage.getItem(CLAVE_DESTINO);
      return valor === TABLA_NUEVA || valor === TABLA_RESPALDO ? valor : null;
    } catch (_) {
      return null;
    }
  }

  function fijarDestino(tabla) {
    estado.destino = tabla;
    try { window.localStorage.setItem(CLAVE_DESTINO, tabla); } catch (_) {}
  }

  // Tabla activa. Por defecto se usa actividad_clientes, que ya existe
  // en la base: asi una instalacion nueva nunca muestra un 404.
  function tablaActual() {
    return estado.destino || destinoGuardado() || TABLA_POR_DEFECTO;
  }

  // Permite pasar a bitacora_eventos cuando el companero ya ejecuto el SQL.
  async function activarTablaNueva() {
    fijarDestino(TABLA_NUEVA);
    return hidratarPanel();
  }

  // ------------------------------------------------------------
  // Respaldo local con marca de agua
  // ------------------------------------------------------------
  function leerRespaldo() {
    try {
      const crudo = window.localStorage.getItem(CLAVE_RESPALDO);
      const datos = crudo ? JSON.parse(crudo) : null;
      if (!datos || !Array.isArray(datos.eventos)) {
        return { marca_agua: 0, actualizado_en: '', eventos: [] };
      }
      return {
        marca_agua: Number(datos.marca_agua) || 0,
        actualizado_en: datos.actualizado_en || '',
        eventos: datos.eventos
      };
    } catch (_) {
      return { marca_agua: 0, actualizado_en: '', eventos: [] };
    }
  }

  function claveRespaldo(evento) {
    if (evento && evento.id_remoto != null) return `r-${evento.id_remoto}`;
    if (evento && evento.clave_local) return `l-${evento.clave_local}`;
    return `t-${texto(evento && evento.tipo)}|${texto(evento && evento.creado_en)}|${texto(evento && evento.detalle)}`;
  }

  function marcaDeFilas(filas) {
    let marca = 0;
    for (const fila of filas || []) {
      const id = Number(fila && fila.id);
      if (Number.isFinite(id) && id > marca) marca = id;
    }
    return marca || null;
  }

  function guardarRespaldo(nuevos, marca) {
    const actual = leerRespaldo();
    const mapa = new Map();
    for (const evento of actual.eventos) {
      mapa.set(claveRespaldo(evento), evento);
    }
    for (const evento of nuevos || []) {
      mapa.set(claveRespaldo(evento), evento);
    }
    const eventos = [...mapa.values()]
      .sort((a, b) => {
        const fa = new Date((a && (a.creado_en_servidor || a.creado_en)) || 0).getTime() || 0;
        const fb = new Date((b && (b.creado_en_servidor || b.creado_en)) || 0).getTime() || 0;
        return fb - fa;
      })
      .slice(0, LIMITE_RESPALDO);
    const marcaFinal = Math.max(Number(actual.marca_agua) || 0, Number(marca) || 0) || 0;
    const paquete = { marca_agua: marcaFinal, actualizado_en: new Date().toISOString(), eventos };
    try { window.localStorage.setItem(CLAVE_RESPALDO, JSON.stringify(paquete)); } catch (_) {}
    pintarRespaldo();
    return paquete;
  }

  function pintarRespaldo() {
    const el = document.getElementById('respaldoEventos');
    if (!el) return;
    const datos = leerRespaldo();
    if (!datos.eventos.length) {
      el.textContent = 'Respaldo local: sin copia todavía (se crea sola al registrar eventos).';
      return;
    }
    el.textContent = `Respaldo local: ${datos.eventos.length} eventos · marca de agua #${datos.marca_agua || '—'} · actualizado ${formatearHora(datos.actualizado_en)}`;
  }

  async function refrescarRespaldoDesdeRemoto(tabla) {
    const filas = await listarRemotos(200, 0, tabla);
    if (!filas.length) return;
    guardarRespaldo(filas.map((fila) => ({
      tipo: fila.tipo,
      detalle: fila.detalle,
      modulo: fila.modulo,
      usuario: fila.usuario,
      rol: fila.rol,
      creado_en: fila.creado_en,
      creado_en_servidor: fila.creado_en,
      id_remoto: fila.id
    })), marcaDeFilas(filas));
  }

  function descargarJson(nombre, datos) {
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json;charset=utf-8' }));
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(enlace.href);
  }

  async function descargarRespaldo() {
    const tabla = tablaActual();
    const filas = await listarRemotos(1000, 0, tabla);
    const local = leerRespaldo();
    const paquete = {
      proyecto: config() ? config().proyecto : 'solo_gelatos',
      tabla,
      generado_en: new Date().toISOString(),
      marca_agua: Math.max(Number(local.marca_agua) || 0, Number(marcaDeFilas(filas)) || 0),
      total_remoto: filas.length,
      eventos_remotos: filas,
      eventos_locales: local.eventos || []
    };
    descargarJson(`respaldo-bitacora-${tabla}-${new Date().toISOString().slice(0, 10)}.json`, paquete);
  }

  // ------------------------------------------------------------
  // Envio en lotes + cola offline
  // ------------------------------------------------------------
  function actualizarEventoLocal(evento) {
    const lista = leerLocal();
    const plano = evento.aLocal();
    const indice = lista.findIndex((item) => item && item.clave_local === evento.clave_local);
    if (indice >= 0) lista[indice] = plano;
    else lista.unshift(plano);
    guardarLocal(lista);
  }

  function encolarLote(filas, tabla) {
    const capa = api();
    if (!capa || typeof capa.encolarOperacion !== 'function') return;
    capa.encolarOperacion({ metodo: 'POST', tabla: tabla || tablaActual(), datos: filas });
  }

  async function enviarLote(eventos) {
    const cfg = config();
    if (!cfg || !eventos.length) return false;

    let destino = tablaActual();
    const sinConexion = typeof navigator !== 'undefined' && !navigator.onLine;

    // Sin conexion y sin confirmacion previa de la tabla nueva: se usa el
    // respaldo, asi la cola no queda apuntando a una tabla que quiza no exista.
    if (sinConexion && destino === TABLA_NUEVA && destinoGuardado() !== TABLA_NUEVA) {
      destino = TABLA_RESPALDO;
    }

    const filas = eventos.map((evento) => evento.aFila(destino, cfg.proyecto));

    if (sinConexion) {
      encolarLote(filas, destino);
      return false;
    }

    try {
      const res = await fetch(`${cfg.url}/rest/v1/${destino}`, {
        method: 'POST',
        headers: {
          apikey: cfg.clave,
          Authorization: `Bearer ${cfg.clave}`,
          'Content-Type': 'application/json',
          // return=representation permite leer el creado_en del servidor.
          Prefer: 'return=representation'
        },
        body: JSON.stringify(filas)
      });
      if (res.ok) {
        let devueltas = [];
        try { devueltas = await res.json(); } catch (_) {}
        const marca = marcaDeFilas(devueltas);
        eventos.forEach((evento, indice) => {
          evento.conSello(Array.isArray(devueltas) ? devueltas[indice] : null);
          actualizarEventoLocal(evento);
        });
        guardarRespaldo(eventos.map((evento) => evento.aLocal()), marca);
        if (destino === TABLA_NUEVA) fijarDestino(TABLA_NUEVA);
        return true;
      }

      // La tabla nueva todavia no existe: se usa el respaldo sin perder eventos.
      if (destino === TABLA_NUEVA && (res.status === 404 || res.status === 400)) {
        fijarDestino(TABLA_RESPALDO);
        return enviarLote(eventos);
      }
      encolarLote(filas, destino);
      return false;
    } catch (_) {
      encolarLote(filas, destino);
      return false;
    }
  }

  async function vaciarBuffer() {
    if (estado.temporizador) {
      clearTimeout(estado.temporizador);
      estado.temporizador = null;
    }
    if (estado.enviando || !estado.buffer.length) return;
    estado.enviando = true;
    const lote = estado.buffer.splice(0, estado.buffer.length);
    try {
      await enviarLote(lote);
    } finally {
      estado.enviando = false;
    }
    if (estado.buffer.length >= LOTE_MAXIMO) vaciarBuffer();
  }

  function programarEnvio() {
    if (estado.buffer.length >= LOTE_MAXIMO) {
      vaciarBuffer();
      return;
    }
    if (estado.temporizador) return;
    estado.temporizador = setTimeout(() => {
      estado.temporizador = null;
      vaciarBuffer();
    }, ESPERA_LOTE);
  }

  function esDuplicado(tipo, detalle) {
    const ahora = Date.now();
    const huella = `${tipo}|${detalle}`;
    const previo = estado.huellas.get(huella) || 0;
    estado.huellas.set(huella, ahora);
    if (estado.huellas.size > 60) {
      for (const [clave, marca] of estado.huellas) {
        if (ahora - marca > 5000) estado.huellas.delete(clave);
      }
    }
    return ahora - previo < VENTANA_DUPLICADO;
  }

  // ------------------------------------------------------------
  // Registro publico
  // ------------------------------------------------------------
  function registrar(tipo, detalle, opciones) {
    const configuracion = opciones || {};
    const tipoFinal = texto(tipo) || TIPOS.CLICK;
    const detalleFinal = recortar(detalle, 240) || tipoFinal;

    const ahora = Date.now();

    // Limite del laboratorio: 1 evento DOM por segundo. El hover tiene
    // su propio limite para no consumir el turno de los clicks.
    if (configuracion.dom) {
      if (tipoFinal === TIPOS.HOVER) {
        if (ahora - estado.ultimoHover < VENTANA_HOVER) return false;
        estado.ultimoHover = ahora;
      } else {
        if (ahora - estado.ultimoEventoDom < VENTANA_DOM) return false;
        estado.ultimoEventoDom = ahora;
      }
    }

    if (esDuplicado(tipoFinal, detalleFinal)) return false;

    const evento = new EventoBitacora({
      tipo: tipoFinal,
      detalle: detalleFinal,
      modulo: configuracion.modulo || 'DOM',
      usuario: usuarioVisible(),
      rol: rolVisible()
    });

    const locales = leerLocal();
    locales.unshift(evento.aLocal());
    guardarLocal(locales);

    estado.buffer.push(evento);
    programarEnvio();
    return true;
  }

  // Evento de operacion del sistema (no pasa por el limite de 1/segundo).
  function registrarOperacion(accion, modulo) {
    const tipo = TIPOS_OPERACION[modulo] || 'OP_SISTEMA';
    return registrar(tipo, accion, { modulo: modulo || 'Sistema' });
  }

  // ------------------------------------------------------------
  // Captura delegada
  // ------------------------------------------------------------
  function clasificarClick(objetivo) {
    if (!objetivo || !objetivo.closest) return null;

    // Semana 4 - Bitacora DOM y eventos
    // Cualquier elemento puede declarar su propio tipo de evento.
    const marcado = objetivo.closest('[data-sg-evento]');
    if (marcado) {
      const tipo = marcado.getAttribute('data-sg-evento');
      const producto = marcado.getAttribute('data-nombre-producto') || '';
      const etiqueta = marcado.getAttribute('data-sg-detalle') || marcado.getAttribute('aria-label') || marcado.textContent;
      return { tipo, detalle: `${recortar(etiqueta, 60)}${producto ? `: ${producto}` : ''}` };
    }

    if (objetivo.closest('#themeBtn')) {
      const oscuro = document.body.classList.contains('dark-mode');
      return { tipo: TIPOS.THEME_CHANGE, detalle: oscuro ? 'Tema oscuro activado' : 'Tema claro activado' };
    }
    if (objetivo.closest('#btnSimularContraste')) {
      const activo = document.body.classList.contains('alto-contraste');
      return { tipo: TIPOS.CONTRAST_TOGGLE, detalle: activo ? 'Alto contraste activado' : 'Alto contraste desactivado' };
    }
    if (objetivo.closest('#burguerBtn')) {
      const abierto = document.getElementById('navMenu')?.classList.contains('show');
      return { tipo: TIPOS.MENU_OPEN, detalle: abierto ? 'Menú lateral cerrado' : 'Menú lateral abierto' };
    }
    if (objetivo.closest('.add-product')) {
      const boton = objetivo.closest('.add-product');
      return { tipo: TIPOS.ADD_TO_CART, detalle: `Añadió al carrito: ${recortar(boton.getAttribute('aria-label') || 'producto', 60)}` };
    }
    if (objetivo.closest('.client-remove, .remove')) {
      const boton = objetivo.closest('.client-remove, .remove');
      return { tipo: TIPOS.REMOVE_FROM_CART, detalle: `Quitó del carrito: ${recortar(boton.getAttribute('aria-label') || 'producto', 60)}` };
    }
    if (objetivo.closest('.client-qty, .qty')) {
      const boton = objetivo.closest('.client-qty, .qty');
      const delta = Number(boton.getAttribute('data-d'));
      return {
        tipo: delta < 0 ? TIPOS.REMOVE_FROM_CART : TIPOS.ADD_TO_CART,
        detalle: `${delta < 0 ? 'Restó' : 'Sumó'} una unidad: ${recortar(boton.getAttribute('aria-label') || 'producto', 60)}`
      };
    }
    if (objetivo.closest('.catalog-filter')) {
      const boton = objetivo.closest('.catalog-filter');
      return { tipo: TIPOS.CATEGORY_SELECT, detalle: `Categoría: ${recortar(boton.getAttribute('data-product-filter') || boton.textContent, 40)}` };
    }
    if (objetivo.closest('a[data-subcat], [data-subcat]')) {
      const enlace = objetivo.closest('[data-subcat]');
      return { tipo: TIPOS.SUBCATEGORY_SELECT, detalle: `Subcategoría: ${recortar(enlace.getAttribute('data-subcat') || enlace.textContent, 40)}` };
    }
    if (objetivo.closest('.card-item__btn-simular')) {
      const boton = objetivo.closest('.card-item__btn-simular');
      return { tipo: TIPOS.PRODUCT_VIEW, detalle: `Ver detalle: ${recortar(boton.getAttribute('data-nombre') || boton.getAttribute('aria-label'), 60)}` };
    }
    if (objetivo.closest('.card-item')) {
      const tarjeta = objetivo.closest('.card-item');
      const titulo = tarjeta.querySelector('.card-item__title');
      return { tipo: TIPOS.PRODUCT_VIEW, detalle: `Ficha de producto: ${recortar(titulo ? titulo.textContent : 'producto', 60)}` };
    }
    return { tipo: TIPOS.CLICK, detalle: `Click en ${descripcionElemento(objetivo.closest('button, a, .card, .kpi, li') || objetivo)}` };
  }

  function alHacerClick(evento) {
    const objetivo = evento.target;
    if (!objetivo || esPassword(objetivo)) return;
    // Enlaces de navegacion: se registra CLICK y ademas PAGE_VIEW al cambiar el hash.
    const clasificado = clasificarClick(objetivo);
    if (!clasificado) return;
    registrar(clasificado.tipo, clasificado.detalle, { dom: true });
  }

  function alHacerDobleClick(evento) {
    const objetivo = evento.target;
    if (!objetivo || esPassword(objetivo)) return;
    registrar(TIPOS.DBLCLICK, `Doble click en ${descripcionElemento(objetivo)}`, { dom: true });
  }

  function alEscribir(evento) {
    const campo = evento.target;
    if (!campo || !campo.tagName || esPassword(campo)) return;

    const idCampo = campo.id || campo.getAttribute('name') || 'campo';

    // PRODUCT_SEARCH: unico caso donde se guarda el termino (maximo 60).
    if (campo.id === 'catalog-q' || campo.id === 'headerSearch' || campo.id === 'q') {
      const termino = recortar(campo.value, 60);
      if (termino) registrar(TIPOS.PRODUCT_SEARCH, `Búsqueda: «${termino}»`, { dom: true });
      return;
    }

    const cantidad = String(campo.value || '').length;
    registrar(TIPOS.KEY_INPUT, `Campo #${idCampo} · ${cantidad} caracteres`, { dom: true });
  }

  function alCambiar(evento) {
    const campo = evento.target;
    if (!campo || !campo.tagName || esPassword(campo)) return;
    const idCampo = campo.id || campo.getAttribute('name') || 'campo';
    const etiqueta = campo.tagName.toLowerCase();
    let valor = '';
    if (etiqueta === 'select') valor = recortar(campo.value, 40);
    else if (campo.type === 'checkbox' || campo.type === 'radio') valor = campo.checked ? 'marcado' : 'desmarcado';
    else if (etiqueta === 'input' && /date|time|number|range|color/.test(campo.type || '')) valor = recortar(campo.value, 40);
    const detalle = valor ? `Campo #${idCampo}: ${valor}` : `Campo #${idCampo} modificado`;
    registrar(TIPOS.FIELD_CHANGE, detalle, { dom: true });
  }

  function alEnviar(evento) {
    const formulario = evento.target;
    if (!formulario || formulario.tagName !== 'FORM') return;
    if (formulario.querySelector('input[type="password"]')) {
      // No se registra nada del contenido de formularios con contrasena.
      registrar(TIPOS.FORM_SUBMIT, 'Formulario de acceso enviado', { dom: true });
      return;
    }
    const idFormulario = formulario.id ? `#${formulario.id}` : 'formulario';
    registrar(TIPOS.FORM_SUBMIT, `Envió ${idFormulario}`, { dom: true });
  }

  function alPasarRaton(evento) {
    const objetivo = evento.target;
    if (!objetivo || !objetivo.closest || esPassword(objetivo)) return;
    const alcance = objetivo.closest('button, a, .card-item');
    if (!alcance) return;
    registrar(TIPOS.HOVER, `Hover en ${descripcionElemento(alcance)}`, { dom: true });
  }

  function alCambiarHash() {
    const vista = recortar((window.location.hash || '#inicio').replace(/^#/, ''), 40) || 'inicio';
    if (vista === estado.ultimaVista) return;
    estado.ultimaVista = vista;
    try { window.sessionStorage.setItem(CLAVE_ULTIMA_VISTA, vista); } catch (_) {}
    registrar(TIPOS.PAGE_VIEW, `Vista #${vista}`, { dom: false, modulo: 'Navegación' });
  }

  // FORM_OPEN: se detecta cuando aparece un dialogo nuevo en #modal-root.
  function vigilarModales() {
    const raiz = document.getElementById('modal-root');
    if (!raiz || typeof MutationObserver !== 'function') return;
    const observador = new MutationObserver(() => {
      const modal = raiz.querySelector('.modal[role="dialog"], .modal-backdrop .modal');
      if (!modal) return;
      if (estado.modalesVistos) {
        if (estado.modalesVistos.has(modal)) return;
        estado.modalesVistos.add(modal);
      }
      const titulo = modal.querySelector('h3, h2');
      const etiqueta = modal.getAttribute('aria-label') || (titulo ? titulo.textContent : 'formulario');
      registrar(TIPOS.FORM_OPEN, `Abrió: ${recortar(etiqueta, 60)}`, { dom: false, modulo: 'Formularios' });
    });
    observador.observe(raiz, { childList: true, subtree: true });
  }

  // ------------------------------------------------------------
  // Panel del administrador
  // ------------------------------------------------------------
  function formatearHora(valor) {
    if (!valor) return '--:--';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return recortar(valor, 19);
    return fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function formatearFechaHora(valor) {
    if (!valor) return '—';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return recortar(valor, 24);
    return fecha.toLocaleString('es-BO');
  }

  function filaDesdeRemota(fila) {
    return {
      id: fila.id,
      tipo: texto(fila.tipo_evento || fila.accion) || 'EVENTO',
      detalle: texto(fila.detalle) || 'Sin detalle',
      usuario: texto(fila.usuario || fila.cliente) || 'Invitado',
      rol: texto(fila.rol) || '',
      modulo: texto(fila.modulo) || '',
      creado_en: fila.creado_en || ''
    };
  }

  function pintarLista(eventos) {
    const lista = document.getElementById('listaEventos');
    if (!lista) return;
    estado.listaEnPantalla = eventos;
    lista.textContent = '';
    if (!eventos.length) {
      const vacio = document.createElement('p');
      vacio.className = 'muted';
      vacio.textContent = 'Todavía no hay eventos registrados. Interactúa con la página para comenzar.';
      lista.appendChild(vacio);
      return;
    }
    for (const evento of eventos) {
      const fila = document.createElement('div');
      fila.className = 'bitacora-eventos__fila';

      const hora = document.createElement('span');
      hora.className = 'bitacora-eventos__hora';
      hora.textContent = formatearHora(evento.creado_en);

      const tipo = document.createElement('span');
      tipo.className = 'bitacora-eventos__tipo';
      tipo.textContent = evento.tipo;

      const detalle = document.createElement('span');
      detalle.className = 'bitacora-eventos__detalle';
      detalle.textContent = evento.detalle;

      fila.appendChild(hora);
      fila.appendChild(tipo);
      fila.appendChild(detalle);
      lista.appendChild(fila);
    }
  }

  function calcularOperativos(porTipo) {
    return Object.entries(porTipo || {})
      .filter(([tipo]) => tipo.indexOf('OP_') === 0)
      .reduce((total, [, cantidad]) => total + Number(cantidad || 0), 0);
  }

  function pintarContador(total, tabla, porTipo) {
    const contador = document.getElementById('contadorEventos');
    if (!contador) return;
    const numero = Number(total) || 0;
    contador.textContent = `Eventos registrados: ${numero} / ${META_EVENTOS}`;
    contador.classList.toggle('is-meta', numero >= META_EVENTOS);
    contador.setAttribute('data-tabla', tabla || '');

    const operativos = calcularOperativos(porTipo);
    const meta = document.getElementById('metaEventos');
    if (meta) {
      meta.textContent = `Operativos: ${operativos} · Interacción: ${Math.max(0, numero - operativos)}`;
    }

    const progreso = document.getElementById('progresoEventos');
    if (progreso) {
      const porcentaje = Math.min(100, Math.round((numero / META_EVENTOS) * 100));
      progreso.setAttribute('aria-valuenow', String(Math.min(numero, META_EVENTOS)));
      const barra = progreso.querySelector('.bitacora-eventos__progreso-barra');
      if (barra) barra.style.width = `${porcentaje}%`;
    }

    const origen = document.getElementById('origenEventos');
    if (origen) {
      origen.textContent = tabla === TABLA_NUEVA
        ? 'Origen: tabla bitacora_eventos (Semana 4)'
        : 'Origen: tabla actividad_clientes (tabla oficial). Puedes cambiar a bitacora_eventos cuando el SQL ya esté ejecutado.';
    }
    const reintentar = document.getElementById('btnEventosReintentar');
    if (reintentar) reintentar.hidden = tabla === TABLA_NUEVA;
  }

  function pintarDesglose(porTipo) {
    const contenedor = document.getElementById('desgloseEventos');
    if (!contenedor) return;
    contenedor.textContent = '';
    const entradas = Object.entries(porTipo || {}).sort((a, b) => b[1] - a[1]);
    if (!entradas.length) {
      const vacio = document.createElement('span');
      vacio.className = 'muted';
      vacio.textContent = 'Sin datos por tipo todavía.';
      contenedor.appendChild(vacio);
      return;
    }
    for (const [tipo, cantidad] of entradas) {
      const chip = document.createElement('span');
      chip.className = 'tag';
      chip.textContent = `${tipo} · ${cantidad}`;
      contenedor.appendChild(chip);
    }
  }

  function pintarSello(ultimo) {
    const sello = document.getElementById('selloServidor');
    if (!sello) return;
    if (!ultimo) {
      sello.textContent = 'Sello de tiempo: pendiente de confirmación del servidor.';
      return;
    }
    sello.textContent = `Último sello del servidor: ${formatearFechaHora(ultimo)} (columna creado_en).`;
  }

  async function contarRemoto(tabla) {
    const cfg = config();
    if (!cfg) return { ok: false, total: 0, porTipo: {} };
    const columna = tabla === TABLA_NUEVA ? 'tipo_evento' : 'accion';
    const cabeceras = { apikey: cfg.clave, Authorization: `Bearer ${cfg.clave}` };
    const base = `${cfg.url}/rest/v1/${tabla}?proyecto=eq.${encodeURIComponent(cfg.proyecto)}`;
    let total = 0;
    const porTipo = {};
    let disponible = true;

    try {
      const res = await fetch(`${base}&select=id&limit=1`, {
        headers: { ...cabeceras, Prefer: 'count=exact', Range: '0-0' }
      });
      if (res.ok || res.status === 206) {
        const rango = res.headers.get('content-range') || '';
        const partes = rango.split('/');
        total = Number(partes[1]) || 0;
      } else {
        disponible = false;
      }
    } catch (_) {
      disponible = false;
    }

    if (disponible) {
      try {
        const res = await fetch(`${base}&select=${columna}&order=creado_en.desc&limit=1000`, { headers: cabeceras });
        if (res.ok) {
          const filas = await res.json();
          for (const fila of filas) {
            const tipo = texto(fila[columna]) || 'EVENTO';
            porTipo[tipo] = (porTipo[tipo] || 0) + 1;
          }
        }
      } catch (_) {}
    }

    return { ok: disponible, total, porTipo };
  }

  async function listarRemotos(limite, desde, tabla) {
    const cfg = config();
    if (!cfg) return [];
    const objetivo = tabla || tablaActual();
    const columnas = objetivo === TABLA_NUEVA
      ? 'id,usuario,rol,tipo_evento,modulo,detalle,creado_en'
      : 'id,cliente,accion,detalle,creado_en';
    try {
      const url = `${cfg.url}/rest/v1/${objetivo}?proyecto=eq.${encodeURIComponent(cfg.proyecto)}&select=${columnas}&order=creado_en.desc&limit=${limite}&offset=${desde}`;
      const res = await fetch(url, { headers: { apikey: cfg.clave, Authorization: `Bearer ${cfg.clave}` } });
      if (!res.ok) return [];
      const filas = await res.json();
      return Array.isArray(filas) ? filas.map(filaDesdeRemota) : [];
    } catch (_) {
      return [];
    }
  }

  async function hidratarPanel() {
    const lista = document.getElementById('listaEventos');
    if (!lista) return;

    // Se muestra de inmediato lo que ya está guardado en este navegador.
    const locales = leerLocal().slice(0, 50);
    if (locales.length) pintarLista(locales);
    pintarRespaldo();

    let tabla = tablaActual();
    let datos = await contarRemoto(tabla);

    // Solo si el administrador activo la tabla nueva y no existe, se vuelve.
    if (!datos.ok && tabla === TABLA_NUEVA) {
      fijarDestino(TABLA_RESPALDO);
      tabla = TABLA_RESPALDO;
      datos = await contarRemoto(tabla);
    }

    pintarContador(datos.total, tabla, datos.porTipo);
    pintarDesglose(datos.porTipo);

    estado.pagina = 0;
    const remotas = await listarRemotos(50, 0, tabla);
    if (remotas.length) {
      pintarLista(remotas);
      pintarSello(remotas[0].creado_en);
      await refrescarRespaldoDesdeRemoto(tabla);
    } else {
      pintarSello('');
    }
  }

  async function cargarMas() {
    const tabla = tablaActual();
    estado.pagina += 1;
    const nuevas = await listarRemotos(50, estado.pagina * 50, tabla);
    if (!nuevas.length) {
      const boton = document.getElementById('btnEventosVerMas');
      if (boton) {
        boton.disabled = true;
        boton.textContent = 'No hay más eventos';
      }
      return;
    }
    pintarLista([...estado.listaEnPantalla, ...nuevas]);
    const contador = document.getElementById('contadorEventos');
    if (contador) contador.focus({ preventScroll: true });
  }

  function limpiarPantalla() {
    const lista = document.getElementById('listaEventos');
    if (!lista) return;
    lista.textContent = '';
    const aviso = document.createElement('p');
    aviso.className = 'muted';
    aviso.textContent = 'Lista limpia en pantalla. Los eventos siguen guardados en Supabase y en el respaldo local.';
    lista.appendChild(aviso);
    estado.listaEnPantalla = [];
    estado.pagina = 0;
  }

  async function exportarCsv() {
    const tabla = tablaActual();
    const filas = await listarRemotos(1000, 0, tabla);
    if (!filas.length) {
      window.alert('No hay eventos en Supabase para exportar.');
      return;
    }
    const escape = (valor) => `"${String(valor == null ? '' : valor).replace(/"/g, '""')}"`;
    const encabezado = ['id', 'fecha_servidor', 'tipo', 'modulo', 'usuario', 'detalle'].join(',');
    const cuerpo = filas.map((fila) => [
      fila.id || '',
      fila.creado_en || '',
      fila.tipo,
      fila.modulo || '',
      fila.usuario,
      fila.detalle
    ].map(escape).join(','));
    const csv = [encabezado, ...cuerpo].join('\r\n');
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    enlace.download = `bitacora-eventos-${tabla}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(enlace.href);
  }

  // ------------------------------------------------------------
  // Reporte imprimible (Guardar como PDF)
  // ------------------------------------------------------------
  function crearElemento(doc, etiqueta, clase, contenido) {
    const el = doc.createElement(etiqueta);
    if (clase) el.className = clase;
    if (contenido != null) el.textContent = String(contenido);
    return el;
  }

  function tituloSeccion(doc, titulo) {
    return crearElemento(doc, 'h2', null, titulo);
  }

  function tablaTiposReporte(doc, porTipo, total) {
    const tabla = doc.createElement('table');
    const cabecera = doc.createElement('thead');
    const filaCabecera = doc.createElement('tr');
    for (const titulo of ['Tipo de evento', 'Cantidad', 'Porcentaje']) {
      filaCabecera.appendChild(crearElemento(doc, 'th', null, titulo));
    }
    cabecera.appendChild(filaCabecera);
    tabla.appendChild(cabecera);

    const cuerpo = doc.createElement('tbody');
    const entradas = Object.entries(porTipo || {}).sort((a, b) => b[1] - a[1]);
    if (!entradas.length) {
      const fila = doc.createElement('tr');
      const celda = crearElemento(doc, 'td', null, 'Sin eventos registrados.');
      celda.colSpan = 3;
      fila.appendChild(celda);
      cuerpo.appendChild(fila);
    }
    for (const [tipo, cantidad] of entradas) {
      const fila = doc.createElement('tr');
      fila.appendChild(crearElemento(doc, 'td', null, tipo));
      fila.appendChild(crearElemento(doc, 'td', null, cantidad));
      fila.appendChild(crearElemento(doc, 'td', null, `${total ? Math.round((cantidad / total) * 100) : 0}%`));
      cuerpo.appendChild(fila);
    }
    tabla.appendChild(cuerpo);
    return tabla;
  }

  function tablaEventosReporte(doc, filas) {
    const tabla = doc.createElement('table');
    const cabecera = doc.createElement('thead');
    const filaCabecera = doc.createElement('tr');
    for (const titulo of ['Fecha y hora (servidor)', 'Tipo', 'Módulo', 'Usuario', 'Detalle']) {
      filaCabecera.appendChild(crearElemento(doc, 'th', null, titulo));
    }
    cabecera.appendChild(filaCabecera);
    tabla.appendChild(cabecera);

    const cuerpo = doc.createElement('tbody');
    if (!filas.length) {
      const fila = doc.createElement('tr');
      const celda = crearElemento(doc, 'td', null, 'Sin eventos para mostrar.');
      celda.colSpan = 5;
      fila.appendChild(celda);
      cuerpo.appendChild(fila);
    }
    for (const evento of filas) {
      const fila = doc.createElement('tr');
      fila.appendChild(crearElemento(doc, 'td', null, formatearFechaHora(evento.creado_en)));
      fila.appendChild(crearElemento(doc, 'td', null, evento.tipo));
      fila.appendChild(crearElemento(doc, 'td', null, evento.modulo || '—'));
      fila.appendChild(crearElemento(doc, 'td', null, evento.usuario));
      fila.appendChild(crearElemento(doc, 'td', null, evento.detalle));
      cuerpo.appendChild(fila);
    }
    tabla.appendChild(cuerpo);
    return tabla;
  }

  function abrirReporte() {
    return (async () => {
      const tabla = tablaActual();
      const datos = await contarRemoto(tabla);
      if (!datos.ok) {
        window.alert('No se pudo leer Supabase para generar el reporte. Revisa la conexión.');
        return;
      }
      const filas = await listarRemotos(200, 0, tabla);
      const respaldo = leerRespaldo();
      const ventana = window.open('', '_blank');
      if (!ventana) {
        window.alert('El navegador bloqueó la ventana del reporte. Permite las ventanas emergentes para este sitio.');
        return;
      }

      const doc = ventana.document;
      doc.title = 'Reporte de bitácora — Solo Gelatos';

      const estilo = doc.createElement('style');
      estilo.textContent = [
        '*{box-sizing:border-box}',
        'body{margin:0;padding:24px;font-family:"Segoe UI",Roboto,Arial,sans-serif;color:#1b1b1b;background:#fff}',
        'h1{font-size:22px;margin:0 0 4px;color:#b3004a}',
        'h2{font-size:15px;margin:26px 0 8px;border-bottom:2px solid #E80F61;padding-bottom:4px}',
        '.sub{color:#555;font-size:12px;margin:0 0 14px}',
        '.acciones{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:16px 0;padding:10px 12px;border:1px solid #E80F61;border-radius:8px;background:#fff5f9}',
        '.acciones button{min-height:44px;padding:0 18px;border:0;border-radius:8px;background:#E80F61;color:#fff;font-size:14px;font-weight:700;cursor:pointer}',
        '.acciones span{font-size:12px;color:#555}',
        '.kpis{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}',
        '.kpi{border:1px solid #ddd;border-radius:8px;padding:10px 14px;min-width:132px}',
        '.kpi small{display:block;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:.4px}',
        '.kpi b{font-size:19px}',
        '.barra{height:10px;background:#eee;border-radius:5px;overflow:hidden;margin-top:6px}',
        '.barra span{display:block;height:100%;background:#E80F61}',
        'table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:18px}',
        'th,td{border:1px solid #ddd;padding:5px 6px;text-align:left;vertical-align:top}',
        'th{background:#f4f4f4}',
        'footer{margin-top:24px;border-top:1px solid #ddd;padding-top:8px;color:#666;font-size:10px}',
        '@media print{body{padding:0}.acciones{display:none}@page{margin:14mm}}'
      ].join('\n');
      doc.head.appendChild(estilo);

      const main = crearElemento(doc, 'main', 'reporte');
      main.appendChild(crearElemento(doc, 'h1', null, 'Reporte de Bitácora DOM y Eventos'));
      const proyecto = config() ? config().proyecto : 'solo_gelatos';
      main.appendChild(crearElemento(doc, 'p', 'sub', `Solo Gelatos · Proyecto ${proyecto} · Tabla ${tabla} · Generado ${new Date().toLocaleString('es-BO')}`));

      const acciones = crearElemento(doc, 'div', 'acciones');
      const botonImprimir = crearElemento(doc, 'button', null, 'Imprimir / Guardar como PDF');
      botonImprimir.type = 'button';
      acciones.appendChild(botonImprimir);
      acciones.appendChild(crearElemento(doc, 'span', null, 'En el diálogo de impresión elige «Guardar como PDF».'));
      main.appendChild(acciones);

      const operativos = calcularOperativos(datos.porTipo);
      const kpis = [
        ['Eventos totales', String(datos.total)],
        ['Meta', String(META_EVENTOS)],
        ['Operativos', String(operativos)],
        ['Interacción', String(Math.max(0, datos.total - operativos))],
        ['Marca de agua', respaldo.marca_agua ? `#${respaldo.marca_agua}` : '—'],
        ['Respaldo local', `${(respaldo.eventos || []).length} eventos`]
      ];
      const contenedorKpis = crearElemento(doc, 'section', 'kpis');
      for (const [etiqueta, valor] of kpis) {
        const caja = crearElemento(doc, 'div', 'kpi');
        caja.appendChild(crearElemento(doc, 'small', null, etiqueta));
        caja.appendChild(crearElemento(doc, 'b', null, valor));
        contenedorKpis.appendChild(caja);
      }
      main.appendChild(contenedorKpis);

      const porcentaje = Math.min(100, Math.round((datos.total / META_EVENTOS) * 100));
      const barra = crearElemento(doc, 'div', 'barra');
      const relleno = crearElemento(doc, 'span');
      relleno.style.width = `${porcentaje}%`;
      barra.appendChild(relleno);
      main.appendChild(barra);
      main.appendChild(crearElemento(doc, 'p', 'sub', `Avance hacia la meta de ${META_EVENTOS} eventos: ${porcentaje}%`));

      main.appendChild(tituloSeccion(doc, 'Desglose por tipo de evento'));
      main.appendChild(tablaTiposReporte(doc, datos.porTipo, datos.total));

      main.appendChild(tituloSeccion(doc, 'Últimos eventos registrados'));
      main.appendChild(tablaEventosReporte(doc, filas.slice(0, 100)));

      const ultimoSello = filas[0] && filas[0].creado_en ? formatearFechaHora(filas[0].creado_en) : 'sin eventos';
      const pie = crearElemento(doc, 'footer', null,
        `Sello de tiempo del servidor: ${ultimoSello} · Respaldo local: ${(respaldo.eventos || []).length} eventos · Marca de agua: ${respaldo.marca_agua || '—'} · Documento generado por Solo Gelatos.`
      );
      main.appendChild(pie);

      doc.body.appendChild(main);
      botonImprimir.addEventListener('click', () => ventana.print());
      ventana.focus();
    })();
  }

  // ------------------------------------------------------------
  // Formulario de evento manual + botones del panel
  // ------------------------------------------------------------
  function registrarEventoManual(evento) {
    evento.preventDefault();
    const selector = document.getElementById('eventoManualModulo');
    const campo = document.getElementById('eventoManualDetalle');
    const estadoEl = document.getElementById('eventoManualEstado');
    const detalle = recortar(campo ? campo.value : '', 120);
    if (!detalle) {
      if (estadoEl) estadoEl.textContent = 'Escribe un detalle para registrar el evento.';
      if (campo) campo.focus();
      return;
    }
    const modulo = selector ? selector.value : 'Eventos';
    registrarOperacion(detalle, modulo);
    if (campo) campo.value = '';
    if (estadoEl) estadoEl.textContent = `Evento de ${modulo} registrado. Se enviará a Supabase en los próximos segundos.`;
    setTimeout(() => { hidratarPanel(); }, 1600);
  }

  function enlazarPanel() {
    document.addEventListener('click', (evento) => {
      const objetivo = evento.target;
      if (!objetivo || !objetivo.closest) return;
      if (objetivo.closest('#btnEventosVerMas')) { cargarMas(); return; }
      if (objetivo.closest('#btnEventosLimpiar')) { limpiarPantalla(); return; }
      if (objetivo.closest('#btnEventosReintentar')) { activarTablaNueva(); return; }
      if (objetivo.closest('#btnEventosCsv')) { exportarCsv(); return; }
      if (objetivo.closest('#btnEventosPdf')) { abrirReporte(); return; }
      if (objetivo.closest('#btnEventosRespaldo')) { descargarRespaldo(); }
    });

    document.addEventListener('submit', (evento) => {
      const formulario = evento.target;
      if (!formulario || formulario.id !== 'formEventoManual') return;
      registrarEventoManual(evento);
    });
  }

  // ------------------------------------------------------------
  // Arranque
  // ------------------------------------------------------------
  function iniciar() {
    if (window.__bitacoraEventosActiva) return;
    window.__bitacoraEventosActiva = true;

    document.addEventListener('click', alHacerClick, true);
    document.addEventListener('dblclick', alHacerDobleClick, true);
    document.addEventListener('keyup', alEscribir, true);
    document.addEventListener('change', alCambiar, true);
    document.addEventListener('submit', alEnviar, true);
    document.addEventListener('mouseover', alPasarRaton, true);

    window.addEventListener('hashchange', alCambiarHash);
    window.addEventListener('pagehide', () => { vaciarBuffer(); });
    window.addEventListener('beforeunload', () => { vaciarBuffer(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') vaciarBuffer();
    });

    vigilarModales();
    enlazarPanel();
    alCambiarHash();
    pintarRespaldo();

    // Si la pagina ya abrio la vista de administrador antes de que este
    // archivo terminara de cargar, se hidrata el panel aqui mismo.
    if (document.getElementById('listaEventos')) {
      setTimeout(hidratarPanel, 0);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  window.BitacoraEventos = {
    META_EVENTOS,
    TIPOS,
    TIPOS_OPERACION,
    TABLA_NUEVA,
    TABLA_RESPALDO,
    TABLA_POR_DEFECTO,
    EventoBitacora,
    registrar,
    registrarOperacion,
    vaciarBuffer,
    tablaActual,
    activarTablaNueva,
    hidratarPanel,
    exportarCsv,
    descargarRespaldo,
    abrirReporte,
    contarRemoto,
    listarRemotos,
    leerLocal,
    leerRespaldo
  };
})();
