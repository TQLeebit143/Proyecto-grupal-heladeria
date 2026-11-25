// ============================================================
// Solo Gelatos · Validación de formularios
// ------------------------------------------------------------
// Reglas reutilizables. Se usa antes de enviar cualquier dato a
// Supabase y muestra el error debajo del campo, con aria-invalid.
// ============================================================
(function () {
  const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  const PATRON_USUARIO = /^[a-z0-9._@-]{3,60}$/i;
  const PATRON_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]{2,60}$/;
  const PATRON_CELULAR = /^[67][0-9]{7}$/;
  const PATRON_FIJO = /^2[0-9]{7}$/;

  function limpiar(valor) {
    return String(valor == null ? '' : valor).trim();
  }

  function pareceTextoAlAzar(valor) {
    const v = limpiar(valor).toLowerCase();
    if (v.length < 4) return false;
    if (!/[aeiouáéíóúü]/.test(v)) return true;
    if (/(.)\1{3,}/.test(v)) return true;
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/.test(v)) return true;
    return ['asdasd', 'asdf', 'qwerty', 'ksdjfie', 'zxcv', 'sdasd'].some((x) => v.includes(x));
  }

  const reglas = {
    usuario(valor) {
      const v = limpiar(valor).toLowerCase();
      if (v.length < 3) return 'Ingresa tu usuario o correo (mínimo 3 caracteres).';
      if (!PATRON_USUARIO.test(v)) return 'El usuario solo admite letras, números, punto, guion y @.';
      if (pareceTextoAlAzar(v)) return 'Escribe un usuario o correo real.';
      return '';
    },
    correo(valor) {
      const v = limpiar(valor).toLowerCase();
      if (!v) return 'Ingresa tu correo electrónico.';
      if (!PATRON_CORREO.test(v)) return 'El correo no tiene un formato válido (ejemplo@dominio.com).';
      return '';
    },
    nombre(valor) {
      const v = limpiar(valor);
      if (v.length < 2) return 'Ingresa tu nombre completo.';
      if (!PATRON_NOMBRE.test(v)) return 'El nombre solo puede tener letras, espacios, punto, guion o apóstrofo.';
      if (pareceTextoAlAzar(v)) return 'Escribe un nombre real.';
      return '';
    },
    claveLogin(valor) {
      const v = limpiar(valor);
      if (!v) return 'Ingresa tu contraseña.';
      if (v.length < 4) return 'La contraseña debe tener al menos 4 caracteres.';
      return '';
    },
    claveNueva(valor) {
      const v = limpiar(valor);
      if (v.length < 6) return 'Usa una contraseña de al menos 6 caracteres.';
      if (!/[a-z]/i.test(v)) return 'La contraseña debe incluir al menos una letra.';
      if (!/[0-9]/.test(v)) return 'La contraseña debe incluir al menos un número.';
      if (/(.)\1{3,}/.test(v)) return 'La contraseña es demasiado repetitiva.';
      return '';
    },
    celular(valor) {
      const v = limpiar(valor);
      if (!PATRON_CELULAR.test(v)) return 'El celular debe tener 8 dígitos y empezar con 6 o 7.';
      return '';
    },
    fijoOpcional(valor) {
      const v = limpiar(valor);
      if (!v) return '';
      if (!PATRON_FIJO.test(v)) return 'El teléfono fijo debe tener 8 dígitos y empezar con 2.';
      return '';
    },
    mensaje(valor) {
      const v = limpiar(valor);
      if (v.length < 10) return 'Escribe tu consulta con al menos 10 caracteres.';
      if (v.length > 600) return 'La consulta no puede superar los 600 caracteres.';
      if (!/[a-záéíóúüñ]/i.test(v)) return 'La consulta debe contener texto.';
      if (pareceTextoAlAzar(v)) return 'Escribe una consulta comprensible.';
      return '';
    },
    texto(valor, minimo) {
      const v = limpiar(valor);
      if (v.length < (minimo || 2)) return `Escribe al menos ${minimo || 2} caracteres.`;
      if (pareceTextoAlAzar(v)) return 'Escribe un texto comprensible.';
      return '';
    },
    numero(valor) {
      const n = Number(valor);
      if (!Number.isFinite(n) || n <= 0) return 'Ingresa un número mayor que cero.';
      return '';
    }
  };

  function quitarError(input) {
    if (!input) return;
    input.removeAttribute('aria-invalid');
    const descrito = input.getAttribute('aria-describedby');
    if (descrito) {
      const nodo = document.getElementById(descrito);
      if (nodo && nodo.classList.contains('validacion-error')) nodo.remove();
      input.removeAttribute('aria-describedby');
    }
  }

  function mostrarError(input, mensaje) {
    if (!input) return;
    input.setAttribute('aria-invalid', 'true');
    let contenedor = input.closest('.campo-grupo') || input.parentElement;
    if (!contenedor) return;
    let nodo = contenedor.querySelector('.validacion-error');
    if (!nodo) {
      nodo = document.createElement('p');
      nodo.className = 'msg-error validacion-error';
      nodo.setAttribute('role', 'alert');
      const idError = `err-${input.id || Math.random().toString(36).slice(2)}`;
      nodo.id = idError;
      input.setAttribute('aria-describedby', idError);
      contenedor.appendChild(nodo);
    }
    nodo.textContent = mensaje;
  }

  // reglas: { idDelCampo: 'nombreDeRegla' | { regla, etiqueta } | funcion }
  function validarFormulario(form, mapaReglas) {
    if (!form) return { ok: false, campos: [] };
    const errores = [];
    for (const [id, definicion] of Object.entries(mapaReglas || {})) {
      const input = document.getElementById(id);
      if (!input) continue;
      quitarError(input);
      let mensaje = '';
      if (typeof definicion === 'function') {
        mensaje = definicion(input.value) || '';
      } else if (typeof definicion === 'string') {
        const fn = reglas[definicion];
        mensaje = fn ? fn(input.value) : '';
      } else if (definicion && typeof definicion === 'object') {
        const fn = reglas[definicion.regla];
        mensaje = fn ? fn(input.value, definicion.parametro) : '';
      }
      if (mensaje) {
        mostrarError(input, mensaje);
        errores.push({ id, input, mensaje });
      }
    }
    if (errores.length) {
      try { errores[0].input.focus(); } catch (_) {}
      return { ok: false, campos: errores };
    }
    return { ok: true, campos: [] };
  }

  function limpiarFormulario(form) {
    if (!form) return;
    form.querySelectorAll('.validacion-error').forEach((n) => n.remove());
    form.querySelectorAll('[aria-invalid]').forEach((n) => n.removeAttribute('aria-invalid'));
  }

  function enlazarLimpieza(form) {
    if (!form || form.dataset.validacionEnlazada === '1') return;
    form.dataset.validacionEnlazada = '1';
    form.addEventListener('input', (e) => {
      if (e.target && e.target.matches('input, textarea, select')) quitarError(e.target);
    });
    form.addEventListener('change', (e) => {
      if (e.target && e.target.matches('input, textarea, select')) quitarError(e.target);
    });
  }

  window.Validacion = { reglas, validarFormulario, limpiarFormulario, enlazarLimpieza, mostrarError, quitarError, pareceTextoAlAzar };
})();
