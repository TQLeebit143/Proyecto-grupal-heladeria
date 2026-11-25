// ============================================================
// Solo Gelatos · Capa de datos (Supabase REST + modo offline)
// ------------------------------------------------------------
// Esta versión está alineada con las columnas REALES de la base:
//   cuentas             → proyecto, usuario, clave, rol
//   pedidos             → proyecto, cliente, modalidad, forma_pago,
//                         monto_total, items, estado
//   reservas            → proyecto, cliente, fecha_reserva, estado
//   productos_extra     → proyecto, nombre, categoria, precio, imagen
//   consultas           → proyecto, cliente, mensaje, respuesta, estado
//   promociones         → proyecto, titulo, descripcion, precio,
//                         duracion_minutos, expira_en, activa
//   actividad_clientes  → proyecto, cliente, accion, detalle
//   bitacora_eventos    → proyecto, usuario, rol, tipo_evento, modulo,
//                         detalle (tabla opcional de la Semana 4)
//
// La app sigue funcionando sin internet: guarda en localStorage y
// sincroniza la cola cuando vuelve la conexión.
// ============================================================

const SUPABASE_URL = 'https://bmcdlimkoxnlyqeyksdk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ci-J9b7yQEoYOqxbm3IDMA_DrOTWRr-';
const PROYECTO_ACTUAL = 'solo_gelatos';
const CLAVE_SESION = `sesionActiva_${PROYECTO_ACTUAL}`;
const CLAVE_COLA = `colaSincronizacion_${PROYECTO_ACTUAL}`;
const TABLAS_OFICIALES = [
  'cuentas',
  'pedidos',
  'reservas',
  'productos_extra',
  'consultas',
  'promociones',
  'actividad_clientes',
  'bitacora_eventos'
];

// Cuentas de demostración: funcionan incluso sin internet.
// La base puede tener además cuentas propias del proyecto Solo Gelatos.
const CUENTAS_DEMO = [
  { id: 'demo-cli', usuario: 'cliente', correo: 'cliente@sologelatos.bo', nombre: 'Camila Rojas', password: '1234', rol: 'cliente' },
  { id: 'demo-enc', usuario: 'encargado', correo: 'encargado@sologelatos.bo', nombre: 'Mateo Paredes', password: '1234', rol: 'encargado' },
  { id: 'demo-adm', usuario: 'admin', correo: 'admin@sologelatos.bo', nombre: 'Administrador', password: '1234', rol: 'admin' }
];

const PROMO_INICIAL = [
  {
    id: 'promo-local-1',
    proyecto: PROYECTO_ACTUAL,
    titulo: '2x1 en Copas Artesanales de Fruta',
    descripcion: 'Válido hoy en pedidos web y retiro en sucursal Central.',
    precio: 35,
    activa: true
  }
];

const MEMORIA_RESPALDO = { session: {}, local: {} };

// El inicio de sesión por RPC es OPCIONAL. Solo se intenta si se activa
// explícitamente con window.SOLO_GELATOS_CONFIG = { usarRpcLogin: true }
// (después de ejecutar supabase/seguridad-login.sql). Así evitamos un 404
// innecesario en la consola mientras la función no exista.
const CONFIG_APP = (typeof window !== 'undefined' && window.SOLO_GELATOS_CONFIG) || {};
let rpcLoginDisponible = CONFIG_APP.usarRpcLogin === true ? null : false;

// ------------------------------------------------------------
// Almacenamiento seguro
// ------------------------------------------------------------
function obtenerStorageSeguro(tipo) {
  try {
    const st = tipo === 'session' ? window.sessionStorage : window.localStorage;
    const prueba = '__sg_test__';
    st.setItem(prueba, '1');
    st.removeItem(prueba);
    return st;
  } catch (_) {
    const mem = tipo === 'session' ? MEMORIA_RESPALDO.session : MEMORIA_RESPALDO.local;
    return {
      getItem: (k) => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null),
      setItem: (k, v) => { mem[k] = String(v); },
      removeItem: (k) => { delete mem[k]; }
    };
  }
}

function leerJson(tipoStorage, clave, respaldo) {
  try {
    const raw = obtenerStorageSeguro(tipoStorage).getItem(clave);
    return raw ? JSON.parse(raw) : respaldo;
  } catch (_) {
    return respaldo;
  }
}

function guardarJson(tipoStorage, clave, valor) {
  try {
    obtenerStorageSeguro(tipoStorage).setItem(clave, JSON.stringify(valor));
    return true;
  } catch (_) {
    return false;
  }
}

function headersSupabase(prefer) {
  const h = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };
  if (prefer) h.Prefer = prefer;
  return h;
}

// ------------------------------------------------------------
// Utilidades de datos
// ------------------------------------------------------------
function normalizarRol(rol) {
  return ['cliente', 'encargado', 'admin'].includes(rol) ? rol : 'cliente';
}

function texto(valor) {
  return String(valor == null ? '' : valor).trim();
}

function correoDe(usuario) {
  return String(usuario || '').includes('@') ? String(usuario).toLowerCase() : `${String(usuario || 'usuario').toLowerCase()}@sologelatos.bo`;
}

function nombreDesdeUsuario(usuario) {
  const u = texto(usuario);
  if (!u) return 'Usuario';
  const base = u.includes('@') ? u.split('@')[0] : u;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function resumenItems(items) {
  if (Array.isArray(items)) {
    return items.map((item) => {
      if (typeof item === 'string') return item;
      const nombre = item.nombre || item.producto || item.name || 'Producto';
      const cantidad = Number(item.cantidad || item.qty || item.unidades || 1);
      return `${nombre} x${cantidad}`;
    }).join(', ');
  }
  if (typeof items === 'string') return items;
  return '';
}

// Convierte los datos "ricos" de la app a las columnas reales de Supabase.
function mapearEntrada(tabla, datos) {
  const d = datos || {};
  switch (tabla) {
    case 'cuentas':
      return {
        usuario: texto(d.usuario || d.correo).toLowerCase(),
        clave: texto(d.clave || d.password),
        rol: normalizarRol(d.rol)
      };

    case 'pedidos':
      return {
        cliente: texto(d.cliente) || 'Cliente web',
        modalidad: texto(d.modalidad || d.direccion || d.detalle) || 'Retiro en tienda',
        forma_pago: texto(d.forma_pago || d.metodoPago || d.pago) || 'Efectivo',
        monto_total: Number(d.monto_total != null ? d.monto_total : d.total) || 0,
        items: Array.isArray(d.items)
          ? d.items
          : texto(d.detalle)
            ? [{ nombre: texto(d.detalle), cantidad: 1 }]
            : [],
        estado: texto(d.estado) || 'Recibido'
      };

    case 'reservas':
      return {
        cliente: texto(d.cliente) || 'Cliente web',
        detalle_sala: texto(d.detalle_sala || d.detalle || d.tipo) || 'Reserva web',
        fecha_reserva: texto(d.fecha_reserva || d.fecha) || new Date().toISOString().slice(0, 10),
        horario: texto(d.horario) || null,
        duracion_horas: Number(d.duracion_horas) || 1,
        estacion_codigo: texto(d.estacion_codigo) || null,
        estado: texto(d.estado) || 'Pendiente'
      };

    case 'consultas':
      return {
        cliente: texto(d.cliente) || 'Cliente web',
        mensaje: texto(d.mensaje),
        respuesta: texto(d.respuesta),
        estado: texto(d.estado) || 'Pendiente'
      };

    case 'productos_extra':
      return {
        nombre: texto(d.nombre),
        categoria: texto(d.categoria) || 'Helados',
        precio: Number(d.precio) || 25,
        imagen: texto(d.imagen)
      };

    case 'promociones':
      return {
        titulo: texto(d.titulo),
        descripcion: texto(d.descripcion),
        precio: Number(d.precio) || 0,
        duracion_minutos: Number(d.duracion_minutos || d.duracion) || 1440,
        expira_en: d.expira_en || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        activa: d.activa !== false
      };

    case 'actividad_clientes':
      return {
        cliente: texto(d.cliente || d.usuario) || 'Sistema',
        accion: texto(d.accion) || 'INTERACCION',
        detalle: texto(d.detalle)
      };

    case 'bitacora_eventos':
      return {
        usuario: texto(d.usuario || d.cliente) || 'Invitado',
        rol: normalizarRol(d.rol),
        tipo_evento: texto(d.tipo_evento || d.accion || d.tipo) || 'CLICK',
        modulo: texto(d.modulo) || 'DOM',
        detalle: texto(d.detalle)
      };

    default:
      return { ...d };
  }
}

// Devuelve la fila con los nombres que espera la interfaz, sin perder los reales.
function normalizarSalida(tabla, fila) {
  const f = fila || {};
  switch (tabla) {
    case 'pedidos':
      return {
        ...f,
        total: Number(f.monto_total != null ? f.monto_total : f.total) || 0,
        detalle: resumenItems(f.items) || texto(f.detalle),
        fecha: f.creado_en || f.fecha
      };

    case 'reservas':
      return {
        ...f,
        fecha: f.fecha_reserva || f.fecha,
        detalle: texto(f.detalle_sala || f.detalle)
      };

    case 'consultas':
      return {
        ...f,
        correo: texto(f.correo)
      };

    case 'productos_extra':
      return {
        ...f,
        descripcion: texto(f.descripcion) || 'Producto especial añadido desde el panel operativo.'
      };

    case 'promociones':
      return {
        ...f,
        descuento: f.precio ? `${f.precio} Bs` : texto(f.descuento)
      };

    case 'cuentas':
      return {
        id: f.id,
        usuario: f.usuario || f.correo || '',
        nombre: f.nombre || nombreDesdeUsuario(f.usuario || f.correo),
        correo: f.correo || correoDe(f.usuario),
        rol: normalizarRol(f.rol)
      };

    case 'bitacora_eventos':
      return {
        ...f,
        tipo: texto(f.tipo_evento || f.accion) || 'EVENTO',
        cliente: texto(f.usuario || f.cliente) || 'Invitado',
        fecha: f.creado_en || f.fecha
      };

    default:
      return { ...f };
  }
}

// ------------------------------------------------------------
// Caché local
// ------------------------------------------------------------
function claveCacheTabla(tabla) {
  return `sg_cache_${PROYECTO_ACTUAL}_${tabla}`;
}

function leerCacheTabla(tabla) {
  const defecto = tabla === 'promociones'
    ? PROMO_INICIAL.map((p) => normalizarSalida('promociones', p))
    : [];
  return leerJson('local', claveCacheTabla(tabla), defecto);
}

function guardarCacheTabla(tabla, lista) {
  const limpia = tabla === 'cuentas'
    ? (Array.isArray(lista) ? lista.map((c) => normalizarSalida('cuentas', c)) : [])
    : lista;
  guardarJson('local', claveCacheTabla(tabla), limpia);
}

// ------------------------------------------------------------
// Sesión
// ------------------------------------------------------------
function getSesion() {
  const activa = leerJson('session', CLAVE_SESION, null);
  if (activa && activa.rol) {
    return {
      nombre: activa.nombre || 'Usuario',
      correo: activa.correo || '',
      usuario: activa.usuario || activa.correo || '',
      rol: normalizarRol(activa.rol),
      invitado: Boolean(activa.invitado)
    };
  }
  return { nombre: 'Invitado', correo: 'invitado@sologelatos.bo', usuario: 'invitado', rol: 'cliente', invitado: true };
}

function setSesion(usuario) {
  const limpio = {
    nombre: texto(usuario.nombre) || 'Usuario',
    correo: texto(usuario.correo).toLowerCase(),
    usuario: texto(usuario.usuario || usuario.correo).toLowerCase(),
    rol: normalizarRol(usuario.rol),
    invitado: Boolean(usuario.invitado)
  };
  guardarJson('session', CLAVE_SESION, limpio);
  return limpio;
}

function cerrarSesion() {
  try { obtenerStorageSeguro('session').removeItem(CLAVE_SESION); } catch (_) {}
  return getSesion();
}

// ------------------------------------------------------------
// Cola offline
// ------------------------------------------------------------
function getCola() {
  return leerJson('local', CLAVE_COLA, []);
}

function encolarOperacion(operacion) {
  const cola = getCola();
  cola.push({ ...operacion, timestamp: Date.now() });
  guardarJson('local', CLAVE_COLA, cola);
  actualizarEstadoConexion();
}

// ------------------------------------------------------------
// Lectura de tablas
// ------------------------------------------------------------
async function consultarCuentasCrudas() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 3500) : null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/cuentas?proyecto=eq.${encodeURIComponent(PROYECTO_ACTUAL)}&select=usuario,clave,rol&order=id.desc`;
    const res = await fetch(url, { method: 'GET', headers: headersSupabase(), signal: controller ? controller.signal : undefined });
    if (timer) clearTimeout(timer);
    if (!res.ok) return null;
    const filas = await res.json();
    return Array.isArray(filas) ? filas : null;
  } catch (_) {
    if (timer) clearTimeout(timer);
    return null;
  }
}

async function consultarTabla(tabla) {
  const locales = leerCacheTabla(tabla);
  if (typeof navigator !== 'undefined' && !navigator.onLine) return locales;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 3500) : null;
  try {
    const columnas = tabla === 'cuentas' ? 'id,usuario,rol' : '*';
    const url = `${SUPABASE_URL}/rest/v1/${tabla}?proyecto=eq.${encodeURIComponent(PROYECTO_ACTUAL)}&select=${columnas}&order=id.desc`;
    const res = await fetch(url, { method: 'GET', headers: headersSupabase(), signal: controller ? controller.signal : undefined });
    if (timer) clearTimeout(timer);
    if (!res.ok) return locales;
    const remotos = await res.json();
    if (Array.isArray(remotos)) {
      const normalizados = remotos.map((fila) => normalizarSalida(tabla, fila));
      const pendientesLocal = locales.filter((fila) => String(fila.id).startsWith('loc-'));
      if (normalizados.length > 0 || pendientesLocal.length > 0) {
        const combinado = [...normalizados, ...pendientesLocal];
        guardarCacheTabla(tabla, combinado);
        return combinado;
      }
      return locales;
    }
    return locales;
  } catch (_) {
    if (timer) clearTimeout(timer);
    return locales;
  }
}

// ------------------------------------------------------------
// Escritura
// ------------------------------------------------------------
async function insertarRegistro(tabla, datos) {
  const mapeado = mapearEntrada(tabla, datos);
  const registro = { ...mapeado, proyecto: PROYECTO_ACTUAL };
  const locales = leerCacheTabla(tabla);
  const registroLocal = {
    ...datos,
    ...mapeado,
    id: `loc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    creado_en: new Date().toISOString()
  };
  guardarCacheTabla(tabla, [registroLocal, ...locales]);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    encolarOperacion({ metodo: 'POST', tabla, datos: registro });
    return { ok: true, offline: true, data: normalizarSalida(tabla, registroLocal) };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}`, {
      method: 'POST',
      headers: headersSupabase('return=representation'),
      body: JSON.stringify(registro)
    });
    if (!res.ok) {
      encolarOperacion({ metodo: 'POST', tabla, datos: registro });
      return { ok: true, offline: true, data: normalizarSalida(tabla, registroLocal) };
    }
    const creado = await res.json();
    const filaRemota = Array.isArray(creado) && creado[0] ? creado[0] : null;
    if (!filaRemota) return { ok: true, offline: false, data: normalizarSalida(tabla, registroLocal) };

    // Se conservan los datos ricos locales (por ejemplo el detalle del pedido)
    const fila = normalizarSalida(tabla, { ...registroLocal, ...filaRemota });
    guardarCacheTabla(tabla, [fila, ...locales]);
    return { ok: true, offline: false, data: fila };
  } catch (_) {
    encolarOperacion({ metodo: 'POST', tabla, datos: registro });
    return { ok: true, offline: true, data: normalizarSalida(tabla, registroLocal) };
  }
}

const COLUMNAS_ACTUALIZABLES = {
  pedidos: ['cliente', 'modalidad', 'forma_pago', 'monto_total', 'items', 'estado'],
  reservas: ['cliente', 'fecha_reserva', 'estado'],
  consultas: ['cliente', 'mensaje', 'respuesta', 'estado'],
  productos_extra: ['nombre', 'categoria', 'precio', 'imagen'],
  promociones: ['titulo', 'descripcion', 'precio', 'duracion_minutos', 'expira_en', 'activa'],
  actividad_clientes: ['cliente', 'accion', 'detalle'],
  // Solo insercion: la bitacora no se edita desde la interfaz.
  bitacora_eventos: []
};

function mapearCambios(tabla, cambios) {
  const permitidas = COLUMNAS_ACTUALIZABLES[tabla] || [];
  const normalizados = mapearEntrada(tabla, { ...cambios, cliente: cambios.cliente, estado: cambios.estado, respuesta: cambios.respuesta });
  const salida = {};
  for (const clave of permitidas) {
    if (Object.prototype.hasOwnProperty.call(cambios, clave)) salida[clave] = normalizados[clave];
  }
  // Casos frecuentes con alias de la interfaz
  if (tabla === 'pedidos' && cambios.total != null) salida.monto_total = Number(cambios.total) || 0;
  if (tabla === 'reservas' && cambios.fecha != null) salida.fecha_reserva = texto(cambios.fecha);
  return salida;
}

async function actualizarRegistro(tabla, id, cambios) {
  const datos = mapearCambios(tabla, cambios);
  const locales = leerCacheTabla(tabla).map((item) => (
    String(item.id) === String(id) ? normalizarSalida(tabla, { ...item, ...datos }) : item
  ));
  guardarCacheTabla(tabla, locales);

  const esLocal = String(id).startsWith('loc-') || String(id).startsWith('promo-local-');
  const sinConexion = typeof navigator !== 'undefined' && !navigator.onLine;
  if (sinConexion || esLocal) {
    if (!esLocal) encolarOperacion({ metodo: 'PATCH', tabla, id, datos });
    return { ok: true, offline: true };
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/${tabla}?id=eq.${encodeURIComponent(id)}&proyecto=eq.${encodeURIComponent(PROYECTO_ACTUAL)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: headersSupabase('return=representation'),
      body: JSON.stringify(datos)
    });
    if (!res.ok) {
      encolarOperacion({ metodo: 'PATCH', tabla, id, datos });
      return { ok: true, offline: true };
    }
    return { ok: true, offline: false };
  } catch (_) {
    encolarOperacion({ metodo: 'PATCH', tabla, id, datos });
    return { ok: true, offline: true };
  }
}

async function sincronizarCola() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;
  const cola = getCola();
  if (!cola.length) return 0;
  const pendientes = [];
  let sincronizados = 0;

  for (const op of cola) {
    try {
      const esPatch = op.metodo === 'PATCH' && op.id;
      const url = esPatch
        ? `${SUPABASE_URL}/rest/v1/${op.tabla}?id=eq.${encodeURIComponent(op.id)}&proyecto=eq.${encodeURIComponent(PROYECTO_ACTUAL)}`
        : `${SUPABASE_URL}/rest/v1/${op.tabla}`;
      const res = await fetch(url, {
        method: esPatch ? 'PATCH' : 'POST',
        headers: headersSupabase('return=minimal'),
        body: JSON.stringify(op.datos)
      });
      if (res.ok) sincronizados += 1;
      else pendientes.push(op);
    } catch (_) {
      pendientes.push(op);
    }
  }
  guardarJson('local', CLAVE_COLA, pendientes);
  actualizarEstadoConexion();
  return sincronizados;
}

// ------------------------------------------------------------
// Actividad y autenticación
// ------------------------------------------------------------
async function registrarActividad(accion, detalle) {
  const sesion = getSesion();
  return insertarRegistro('actividad_clientes', {
    cliente: sesion.nombre,
    accion: texto(accion) || 'INTERACCION',
    detalle: texto(detalle)
  });
}

// Si el administrador ejecutó supabase/seguridad-login.sql, se usa la
// función RPC y la tabla cuentas deja de exponerse al navegador.
async function intentarLoginRPC(usuario, clave) {
  if (rpcLoginDisponible === false) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/login_solo_gelatos`, {
      method: 'POST',
      headers: headersSupabase(),
      body: JSON.stringify({ p_usuario: usuario, p_clave: clave })
    });
    if (res.status === 404 || res.status === 400) {
      rpcLoginDisponible = false;
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    rpcLoginDisponible = true;
    const fila = Array.isArray(data) ? data[0] : data;
    if (fila && fila.rol) {
      return {
        usuario: fila.usuario || usuario,
        nombre: fila.nombre || nombreDesdeUsuario(fila.usuario || usuario),
        correo: fila.correo || correoDe(fila.usuario || usuario),
        rol: normalizarRol(fila.rol)
      };
    }
    return null;
  } catch (_) {
    rpcLoginDisponible = false;
    return null;
  }
}

async function iniciarSesionCuenta(identificador, clave) {
  const usuario = texto(identificador).toLowerCase();
  const pass = texto(clave);
  if (!usuario || !pass) return null;

  // 1) RPC seguro (si está instalado)
  const porRPC = await intentarLoginRPC(usuario, pass);
  if (porRPC) return setSesion({ ...porRPC, invitado: false });

  // 2) Tabla cuentas del proyecto (modo demostración)
  const remotas = await consultarCuentasCrudas();
  const filas = Array.isArray(remotas) ? remotas : [];
  const encontrada = filas.find((c) => {
    const ident = texto(c.usuario || c.correo).toLowerCase();
    const claveFila = texto(c.clave != null ? c.clave : c.password);
    return ident === usuario && claveFila === pass;
  });
  if (encontrada) {
    return setSesion({
      usuario: encontrada.usuario,
      nombre: nombreDesdeUsuario(encontrada.usuario),
      correo: correoDe(encontrada.usuario),
      rol: encontrada.rol,
      invitado: false
    });
  }

  // 3) Cuentas de demostración (funcionan sin internet)
  const demo = CUENTAS_DEMO.find((c) => (
    (texto(c.usuario).toLowerCase() === usuario || texto(c.correo).toLowerCase() === usuario) &&
    texto(c.password) === pass
  ));
  if (demo) {
    return setSesion({
      usuario: demo.usuario,
      nombre: demo.nombre,
      correo: demo.correo,
      rol: demo.rol,
      invitado: false
    });
  }

  return null;
}

async function registrarCuenta({ nombre, correo, password, rol }) {
  const usuario = texto(correo).toLowerCase();
  const clave = texto(password);
  const nombreLimpio = texto(nombre);
  const rolFinal = 'cliente'; // nunca permitir autoasignarse admin

  if (!usuario || !clave || !nombreLimpio) {
    const error = new Error('Completa nombre, correo y contraseña.');
    error.codigo = 'DATOS_INCOMPLETOS';
    throw error;
  }

  // Evitar duplicados en la base y en las cuentas demo
  const remotas = await consultarCuentasCrudas();
  const existeRemota = Array.isArray(remotas) && remotas.some((c) => texto(c.usuario).toLowerCase() === usuario);
  const existeDemo = CUENTAS_DEMO.some((c) => texto(c.correo).toLowerCase() === usuario);
  if (existeRemota || existeDemo) {
    const error = new Error('Ese correo ya tiene una cuenta registrada.');
    error.codigo = 'DUPLICADA';
    throw error;
  }

  await insertarRegistro('cuentas', { usuario, clave, rol: rolFinal });
  return setSesion({ usuario, nombre: nombreLimpio, correo: usuario, rol: rolFinal, invitado: false });
}

// ------------------------------------------------------------
// Estado de conexión
// ------------------------------------------------------------
function actualizarEstadoConexion() {
  const badge = document.getElementById('badgeConexion');
  if (!badge) return;
  const colaLen = getCola().length;
  if (navigator.onLine) {
    badge.classList.remove('offline');
    badge.textContent = 'ONLINE';
    badge.title = colaLen > 0 ? `En línea (${colaLen} pendientes por sincronizar)` : 'Conectado en línea';
  } else {
    badge.classList.add('offline');
    badge.textContent = 'OFFLINE';
    badge.title = colaLen > 0 ? `Sin conexión (${colaLen} en cola local)` : 'Modo sin conexión';
  }
}

window.addEventListener('online', () => {
  actualizarEstadoConexion();
  sincronizarCola();
});
window.addEventListener('offline', actualizarEstadoConexion);
document.addEventListener('DOMContentLoaded', () => {
  actualizarEstadoConexion();
  if (navigator.onLine) sincronizarCola();
});

window.SupabaseAPI = {
  SUPABASE_URL,
  SUPABASE_KEY,
  PROYECTO_ACTUAL,
  TABLAS_OFICIALES,
  CUENTAS_DEMO,
  getSesion,
  setSesion,
  cerrarSesion,
  getCola,
  encolarOperacion,
  sincronizarCola,
  consultarTabla,
  insertarRegistro,
  actualizarRegistro,
  registrarActividad,
  iniciarSesionCuenta,
  registrarCuenta,
  actualizarEstadoConexion
};
