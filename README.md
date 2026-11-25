# Solo Gelatos — Proyecto consolidado y autocontenido

Aplicación web de heladería artesanal (La Paz, Bolivia) con **un solo sistema** que reúne:

- **Vista cliente:** inicio, catálogo, carrito, pedidos, reservas y consultas.
- **Vista encargado:** panel operativo, gestión de pedidos, reservas, consultas y productos.
- **Vista administrador:** todo lo anterior + POS interno, inventario, compras, proveedores, sucursales, caja, reportes, auditoría y la **Bitácora DOM y eventos**.

Nace de **SOLO-GELATOS-V2**, corregido para que el login, las validaciones y Supabase funcionen de verdad. Las carpetas `SOLO-GELATOS-V1` y `SOLO-GELATOS-V2` se conservan como respaldo.

> **Importante:** las carpetas de ejercicios `semana1`, `semana2` y `semana3` se movieron fuera del proyecto, a `Diseño Web II\EJERCICIOS-SEMANAS`. No son necesarias para que la app funcione.

---

## 1. ¿Es autocontenido?

**Sí.** Todo lo visual y funcional está dentro de esta carpeta:

| Recurso | Antes | Ahora |
|---|---|---|
| jQuery | CDN de cdnjs | `js/vendor/jquery-3.7.1.min.js` |
| DOMPurify | CDN de jsDelivr | `js/vendor/purify-3.1.6.min.js` |
| Tipografías | Google Fonts | `fonts/*.woff2` + `css/fuentes.css` |
| Imágenes de productos | Unsplash | `images/productos/*.jpg` |
| Imagen principal | Unsplash | `images/hero-helado.jpg` |
| Ejercicios de clase | `semana1/2/3` dentro del proyecto | Movidos a `EJERCICIOS-SEMANAS` |

**Única conexión externa:** Supabase, que es la base de datos del sistema. Sin ella no habría login real ni pedidos compartidos, pero la app incluye modo demo/local para seguir funcionando sin internet.

No hay rutas absolutas ni referencias a otras carpetas del computador. Todo usa rutas relativas (`./`, `images/`, `js/`), por lo que funciona igual en GitHub Pages o en cualquier hosting estático.

### ¿Por qué solo hay un `index.html`?

Porque es una **SPA (Single Page Application)**: las vistas de cliente, encargado y administrador no son archivos HTML separados. Se generan dentro del mismo `index.html` desde `js/main.js` y `js/navegacion.js`, cambiando la URL con `#inicio`, `#productos`, `#panel-operativo`, etc. Por eso no hay páginas sueltas que puedan quedar fuera de la carpeta.

### ¿Y la carpeta `pages` de las versiones anteriores?

**No se necesita y no tiene relación con GitHub Pages.** Aunque se llame `pages`, era una carpeta de `SOLO-GELATOS-V1` con archivos HTML sueltos (`productos.html`, `caja.html`, `reportes.html`, …) que solo servían para abrir cada pantalla por separado.

- `SOLO-GELATOS-V2` (la base de este proyecto) **no la usa**: no hay ni una referencia a `pages/`.
- En este proyecto consolidado todas esas pantallas se generan dentro del `index.html`.
- La carpeta `pages` de GitHub Pages es otra cosa: es la opción de configuración **Settings → Pages**, no una carpeta del proyecto.

Verificado: en todo el proyecto no existe ninguna ruta que apunte a `pages/`.

---

## 2. Cómo ejecutarlo en local

No abras `index.html` con doble clic: la app usa `fetch` a Supabase y un Service Worker, y necesita un servidor local.

### Opción A — script incluido (Windows)

```powershell
cd "C:\Users\GENESIS TARQUI\Desktop\Diseño Web II\SOLO-GELATOS"
powershell -NoProfile -ExecutionPolicy Bypass -File .\servir.ps1
```

Abre: <http://localhost:8080/>

### Opción B — VS Code

Instala **Live Server**, clic derecho sobre `index.html` → *Open with Live Server*.

### Opción C — Python

```bash
cd "C:/Users/GENESIS TARQUI/Desktop/Diseño Web II/SOLO-GELATOS"
python -m http.server 8080
```

---

## 3. Publicar en GitHub Pages

### La forma correcta: subir el **contenido**, no la carpeta

1. Crea un repositorio nuevo en GitHub.
2. Abre la carpeta `SOLO-GELATOS` en el Explorador de Windows.
3. Selecciona **todo lo que está dentro** (Ctrl + E, Ctrl + A) — es decir `index.html`, `manifest.json`, `sw.js`, `.gitignore`, `.nojekyll`, `README.md`, `servir.ps1`, `css/`, `js/`, `images/`, `fonts/`, `data/` y `supabase/`.
4. Arrástralo a la página de subida de GitHub (*Add file → Upload files*). Se conservan las subcarpetas.
5. Haz *Commit changes*.

En la **raíz** del repositorio debe verse así:

```
TU-REPO/
├─ index.html
├─ manifest.json
├─ sw.js
├─ .nojekyll
├─ .gitignore
├─ README.md
├─ servir.ps1
├─ css/
├─ data/
├─ fonts/
├─ images/
├─ js/
└─ supabase/
```

6. En GitHub: **Settings → Pages → Build and deployment**.
7. Elige **Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guarda.
8. Espera un minuto y abre `https://TU-USUARIO.github.io/TU-REPO/`.

### ¿Qué pasa si subo la carpeta `SOLO-GELATOS` como carpeta?

Entonces en el repo quedaría `TU-REPO/SOLO-GELATOS/index.html`. GitHub Pages seguiría mostrando **404 en la raíz**, porque no encuentra un `index.html` en `/`. La app solo se vería en `https://TU-USUARIO.github.io/TU-REPO/SOLO-GELATOS/`, y los enlaces de la raíz quedarían vacíos.

No se pierde nada de código (las rutas internas son relativas), pero es más ordenado y correcto subir el contenido a la raíz.

### `copiar y pegar` sí funciona, con una condición

Arrastrar o copiar los **archivos y carpetas** desde el Explorador conserva la estructura: `css/`, `js/`, `images/`, `fonts/`, `data/` y `supabase/` se mantienen. Lo que **no** debes hacer es copiar solo `index.html` o pegar texto de los archivos: eso sí rompería todo.

### Ya está el ZIP listo

En `Diseño Web II\SOLO-GELATOS-github.zip` tienes el proyecto comprimido **con los archivos en la raíz del ZIP**. Solo descomprímelo y arrastra su contenido al repo.

Recomendaciones:

- El archivo `.nojekyll` (vacío) evita que GitHub Pages procese el sitio con Jekyll y garantiza que `js/vendor/`, `fonts/` e `images/` se sirvan tal cual. **No lo borres.**
- Si actualizas archivos, sube también el cambio de versión de caché en `sw.js` (`solo-gelatos-v16-r1`). Así los navegadores no muestran una versión vieja.
- `servir.ps1` y `README.md` pueden quedarse en el repo; no afectan a GitHub Pages.
- GitHub Pages sirve el sitio por HTTPS, así que el Service Worker y la PWA funcionarán.
- Probado en un servidor con subruta (`http://localhost:8081/SOLO-GELATOS/`): carga, fuentes, imágenes, login, Service Worker y rutas `#` funcionan igual que en la raíz.

---

## 4. Cuentas de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente | `cliente@sologelatos.bo` | `1234` |
| Encargado | `encargado@sologelatos.bo` | `1234` |
| Administrador | `admin@sologelatos.bo` | `1234` |

También existe **“Explorar como invitado”**.

> La base tiene además las cuentas `admin1`, `admin2`, `encargado1` y `encargado2`. Sus claves no se documentan aquí por seguridad.

---

## 5. Qué valida el sistema

- **Login:** correo o usuario + contraseña; mensaje claro si son incorrectos.
- **Registro:** nombre, correo válido, contraseña mínima y control de duplicados.
- **Checkout:** dirección o sucursal de retiro obligatoria (mínimo 4 caracteres).
- **Reservas:** nombre y fecha obligatorios; no permite fechas pasadas.
- **Consultas:** nombre, correo válido y mensaje obligatorio.
- **Productos:** nombre y precio obligatorios; URL de imagen opcional y validada.
- **Promociones:** título y descripción con longitud mínima.
- **Proveedores, inventario y compras:** validaciones de campos y correo.

Los errores aparecen en español junto al campo, con `aria-invalid` para accesibilidad.

---

## 6. Conexión a Supabase

- **Proyecto:** `https://bmcdlimkoxnlyqeyksdk.supabase.co`
- **Filtro:** `proyecto = 'solo_gelatos'`
- **Clave:** *publishable key* (pública, solo para cliente)

La capa de datos está en `js/supabase-api.js` y usa las columnas **reales**:

| Tabla | Columnas reales |
|---|---|
| `cuentas` | `id, proyecto, usuario, clave, rol, creado_en` |
| `pedidos` | `id, proyecto, cliente, modalidad, forma_pago, monto_total, items, estado, creado_en` |
| `reservas` | `id, proyecto, cliente, detalle_sala, estado, creado_en, estacion_codigo, fecha_reserva, horario, duracion_horas` |
| `productos_extra` | `id, proyecto, nombre, categoria, precio, imagen, creado_en` |
| `consultas` | `id, proyecto, cliente, mensaje, respuesta, estado, creado_en` |
| `promociones` | `id, proyecto, titulo, descripcion, precio, duracion_minutos, expira_en, activa, actualizada_por, actualizada_en` |
| `actividad_clientes` | `id, proyecto, cliente, accion, detalle, creado_en` |
| `bitacora_eventos` | `id, proyecto, usuario, rol, tipo_evento, modulo, detalle, creado_en` (opcional, ver sección 7) |

Detalles importantes:

- `reservas.detalle_sala` es **NOT NULL**; se llena con el tipo de reserva + notas.
- `promociones.expira_en` es **NOT NULL**; se calcula automáticamente (+24 h).
- El login usa `usuario` + `clave`, no `correo` + `password`.

### Modo sin internet

La app guarda una copia local y una **cola de sincronización**. Si una escritura falla, queda pendiente y se reintenta al volver la conexión. El indicador `ONLINE` de la cabecera muestra el estado.

---

## 7. Bitácora DOM y eventos (Semana 4)

**Archivo nuevo:** `js/bitacora-eventos.js` (se carga con `defer` en `index.html` y está en `ARCHIVOS_APP` de `sw.js`).
**SQL opcional:** `supabase/bitacora-eventos.sql` (lo ejecuta el compañero una sola vez en *Supabase → SQL Editor*).

### Qué registra

Un oyente delegado en `document` captura `click`, `dblclick`, `keyup`, `change`, `submit` y `mouseover` sobre botones, enlaces y tarjetas de producto, con un límite de **1 evento DOM por segundo** (el `HOVER` tiene su propio límite de 2,5 s para no consumir el turno de los clics).

Tipos con nombre fijo (solo se emiten si el elemento existe en la página):

`PAGE_VIEW`, `MENU_OPEN`, `THEME_CHANGE`, `CONTRAST_TOGGLE`, `CATEGORY_SELECT`, `SUBCATEGORY_SELECT`, `PRODUCT_SEARCH`, `PRODUCT_VIEW`, `ADD_TO_CART`, `REMOVE_FROM_CART`, `FORM_OPEN`, `FORM_SUBMIT`, `ORDER_CONFIRM`, `LOGIN`, `LOGOUT`, `CLICK`, `DBLCLICK`, `KEY_INPUT`, `FIELD_CHANGE`, `HOVER`.

Además, cada alta, edición o eliminación de **ventas, pedidos, proveedores, inventario, compras, caja, productos, promociones, reservas y consultas** llama a `addBitacora()` en `main.js`, que genera un evento de operación (`OP_VENTA`, `OP_PROVEEDOR`, `OP_INVENTARIO`, `OP_COMPRA`, `OP_CAJA`, `OP_PRODUCTO`, …) y lo envía una sola vez a Supabase.

### Privacidad

- En campos de **contraseña no se registra nada** (se detecta por `type="password"`, por el `id`/`name` o por un contenedor `data-privado`).
- En el resto del teclado solo se guarda el **id del campo y la cantidad de caracteres**, nunca el texto.
- `PRODUCT_SEARCH` es la única excepción: guarda el término buscado, recortado a **60 caracteres**.
- `FORM_SUBMIT` de un formulario con contraseña registra solo “Formulario de acceso enviado”, sin datos.

### Destino en Supabase

1. Tabla principal: **`bitacora_eventos`** → `proyecto, usuario, rol, tipo_evento, modulo, detalle, creado_en`.
2. Respaldo automático: **`actividad_clientes`** → `proyecto, cliente, accion, detalle, creado_en`.

Mientras `bitacora_eventos` no exista, la app escribe en `actividad_clientes` sin perder eventos. Cuando el compañero ejecuta `supabase/bitacora-eventos.sql`, el siguiente envío entra a la tabla nueva; si ya estaba en respaldo, aparece el botón **“Usar tabla bitacora_eventos”** en el panel para reintentar sin recargar.

### Envío en lotes y sin conexión

- Buffer de **5 eventos** o envío automático cada **3 segundos**.
- Si falla la red, el lote se encola en la **cola offline FIFO existente** (`SupabaseAPI.encolarOperacion`) y se reintenta al volver la conexión.
- También se vacía al cambiar de pestaña, cerrar o recargar (`visibilitychange`, `pagehide`, `beforeunload`).

### Panel del administrador

En **Control y Auditoría → `#auditoria-admin`** hay una tarjeta nueva **“Bitácora DOM y eventos”** con:

- **Últimos 50 eventos** (hora, tipo, detalle) en un contenedor `role="log"` + `aria-live="polite"`.
- Contador **“Eventos registrados: N / 200”** leído de Supabase (`count=exact`), que se marca en verde al llegar a la meta.
- **Desglose por tipo** en chips.
- **Ver más**: carga 50 eventos adicionales por clic.
- **Limpiar bitácora**: limpia **solo la lista en pantalla**; nunca borra filas de Supabase.
- **Exportar CSV**: descarga hasta 1000 filas reales de Supabase, con BOM para que Excel respete los acentos.
- Texto de origen: indica si se está leyendo `bitacora_eventos` o el respaldo `actividad_clientes`.

### Cómo llegar a los 200 eventos (para la demostración)

1. Abre la app con `http://localhost:8080/` y entra como `admin@sologelatos.bo` / `1234`.
2. Recorre las vistas (`#inicio`, `#productos`, `#consultas`, `#panel-operativo`, `#inventario`, `#ventas`, `#caja`, …). Cada cambio de vista genera `PAGE_VIEW`.
3. En el catálogo: cambia de categoría (`CATEGORY_SELECT`), escribe en el buscador (`PRODUCT_SEARCH`), abre fichas (`PRODUCT_VIEW`) y agrega al carrito (`ADD_TO_CART`).
4. Cambia el tema y el alto contraste (`THEME_CHANGE`, `CONTRAST_TOGGLE`).
5. Abre modales (`FORM_OPEN`), envía formularios (`FORM_SUBMIT`), inicia y cierra sesión (`LOGIN`, `LOGOUT`).
6. Genera operaciones reales: ajusta stock, registra una venta, crea un proveedor, una compra o un movimiento de caja. Cada una suma un evento `OP_*`.
7. Vuelve a **Control y Auditoría** y pulsa **Ver más** para refrescar; el contador muestra el total real de Supabase.

> Consejo: la meta es acumulativa. No hace falta hacerlo en una sola sesión; los eventos quedan en Supabase y el contador los suma todos.

### Pruebas ya realizadas

| Prueba | Resultado |
|---|---|
| `PAGE_VIEW`, `FORM_OPEN`, `THEME_CHANGE`, `CATEGORY_SELECT`, `PRODUCT_SEARCH`, `PRODUCT_VIEW`, `ADD_TO_CART`, `HOVER`, `DBLCLICK`, `FIELD_CHANGE`, `FORM_SUBMIT`, `LOGIN`, `LOGOUT`, `ORDER_CONFIRM` | registrados y persistidos |
| Ráfaga de 5 clics seguidos | 1 solo evento (límite de 1/segundo correcto) |
| Escritura en campo `type="password"` | 0 eventos, sin fuga de datos |
| Lote de 5 eventos | insertado en Supabase con el mismo `creado_en` |
| Cola offline | se vacía a 0 al recuperar conexión |
| Panel | contador, chips por tipo, 50 filas, `role="log"`, `aria-live="polite"` |
| Con 200 filas inyectadas | `219 / 200`, contador en verde |
| Ver más | 50 → 100 filas |
| Limpiar bitácora | 0 filas en pantalla, contador intacto, Supabase intacto |
| Consola F12 | sin errores (solo el 404 esperado de `bitacora_eventos` mientras no exista) |

---

## 8. Estructura del proyecto

```
SOLO-GELATOS/
├─ index.html
├─ manifest.json
├─ sw.js                    ← caché solo-gelatos-v16-r1
├─ .nojekyll               ← evita el procesado de Jekyll en GitHub Pages
├─ .gitignore
├─ servir.ps1
├─ README.md
├─ css/
│  ├─ fuentes.css          ← @font-face local
│  ├─ estilos.css
│  ├─ responsive.css
│  ├─ animaciones.css
│  ├─ accesibilidad.css
│  └─ temas.css
├─ data/
│  └─ catalogo.json
├─ fonts/
│  ├─ inter-normal.woff2
│  ├─ cormorant-garamond-normal.woff2
│  └─ cormorant-garamond-italic-600.woff2
├─ images/
│  ├─ logo.png
│  ├─ hero-helado.jpg
│  ├─ app-icon-192.png
│  ├─ app-icon-512.png
│  └─ productos/*.jpg
├─ supabase/
│  └─ bitacora-eventos.sql ← SQL opcional de la Semana 4
└─ js/
   ├─ supabase-api.js      ← conexión, autenticación y cola offline
   ├─ validacion.js        ← reglas de validación reutilizables
   ├─ navegacion.js        ← login, roles, vistas y formularios
   ├─ main.js              ← plantillas de las vistas + addBitacora
   ├─ bitacora-eventos.js  ← captura DOM, lotes y panel (Semana 4)
   ├─ categorias.js        ← catálogo
   ├─ menu.js, chrome.js, iconos.js, pwa.js, temas.js
   ├─ accesibilidad.js, auditoria-a11y.js, smoke-test.js
   └─ vendor/
      ├─ jquery-3.7.1.min.js
      └─ purify-3.1.6.min.js
```

---

## 9. Seguridad — leer antes de publicar

Este proyecto está pensado para **demostración académica**. Antes de usarlo en producción:

1. **Las contraseñas están en texto plano** en `cuentas.clave`. Deben migrarse a hash (bcrypt/scrypt/Argon2) y validarse en el servidor.
2. **La clave publicable permite leer y escribir** en las tablas desde el navegador. Hay que activar **Row Level Security (RLS)** y políticas por rol.
3. **No subas credenciales reales** al repositorio ni las compartas.
4. Para un login seguro, mueve la verificación a una función RPC de Supabase o a un backend propio.

El login por RPC es opcional y está desactivado por defecto. Si algún día instalas una función `login_solo_gelatos`, actívalo así antes de cargar `supabase-api.js`:

```html
<script>
  window.SOLO_GELATOS_CONFIG = { usarRpcLogin: true };
</script>
```

> `supabase/bitacora-eventos.sql` crea la tabla con una política **abierta para `anon`**, igual que el resto de la Guía: sirve para la clase, **no para producción**.

---

## 10. Problemas frecuentes

- **No cargan productos ni guarda:** usa `http://localhost:8080` o GitHub Pages, no `file://`.
- **Se ve una versión antigua:** recarga con `Ctrl+F5`. La caché actual es `solo-gelatos-v16-r1`.
- **No aparece el login:** usa el botón de cuenta en la cabecera (arriba a la derecha).
- **Un pedido quedó pendiente:** revisa el indicador `ONLINE`; la cola se sincroniza sola al volver la conexión.
- **GitHub Pages muestra 404 en `sw.js`:** verifica que subiste `sw.js` en la raíz del repositorio y que Pages está en la rama/carpeta correcta.
- **La bitácora dice “Origen: actividad_clientes”:** es normal mientras el compañero no ejecute `supabase/bitacora-eventos.sql`. Los eventos se guardan igual en el respaldo. Cuando la tabla exista, pulsa **“Usar tabla bitacora_eventos”** en el panel.
- **El contador no llega a 200:** el contador lee Supabase, no el navegador. Si estás sin conexión, los eventos esperan en la cola; al volver la red se envían y el número sube.
