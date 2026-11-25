-- ============================================================
-- Solo Gelatos · Tabla propia para la Bitacora DOM y eventos
-- Semana 4
-- ------------------------------------------------------------
-- Ejecutar este script UNA vez en:
--   Supabase -> SQL Editor -> New query -> Run
--
-- La aplicacion detecta sola la tabla: si existe, escribe aqui;
-- mientras no exista, usa actividad_clientes como respaldo.
-- No hace falta cambiar ninguna linea de JavaScript.
-- ============================================================

CREATE TABLE IF NOT EXISTS bitacora_eventos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  proyecto TEXT NOT NULL,
  usuario TEXT NOT NULL DEFAULT 'Invitado',
  rol TEXT NOT NULL DEFAULT 'cliente',
  tipo_evento TEXT NOT NULL,
  modulo TEXT,
  detalle TEXT NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Politica abierta, igual al estilo del resto de la Guia:
-- cualquiera con la clave publica de la pagina puede leer y escribir.
-- Sirve para la clase, NO para produccion.
ALTER TABLE bitacora_eventos ENABLE ROW LEVEL SECURITY;

GRANT ALL ON bitacora_eventos TO anon, authenticated;
GRANT ALL ON SEQUENCE bitacora_eventos_id_seq TO anon, authenticated;

DROP POLICY IF EXISTS acceso_bitacora_anon ON bitacora_eventos;
CREATE POLICY acceso_bitacora_anon ON bitacora_eventos
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_bitacora_proyecto
  ON bitacora_eventos (proyecto, creado_en DESC);

-- Comprobacion rapida (debe devolver 0 filas, sin error):
-- SELECT * FROM bitacora_eventos LIMIT 1;

-- ============================================================
-- RESPALDO DEL LADO DEL SERVIDOR
-- ------------------------------------------------------------
-- Cada fila que se inserta, actualiza o elimina en la bitacora
-- queda copiada en una tabla de respaldo. Asi el respaldo NO
-- depende del navegador: aunque se borre el localStorage, el
-- historial sigue en Supabase.
--
-- El respaldo es idempotente: si este script se ejecuta dos
-- veces, solo reemplaza funciones y triggers, no duplica datos.
-- ============================================================

-- Respaldo de la tabla nueva de la Semana 4
CREATE TABLE IF NOT EXISTS bitacora_eventos_respaldo (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  origen_id BIGINT,
  proyecto TEXT,
  usuario TEXT,
  rol TEXT,
  tipo_evento TEXT,
  modulo TEXT,
  detalle TEXT,
  creado_en TIMESTAMPTZ,
  operacion TEXT NOT NULL,
  respaldado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Respaldo de la tabla oficial actividad_clientes
CREATE TABLE IF NOT EXISTS actividad_clientes_respaldo (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  origen_id BIGINT,
  proyecto TEXT,
  cliente TEXT,
  accion TEXT,
  detalle TEXT,
  creado_en TIMESTAMPTZ,
  operacion TEXT NOT NULL,
  respaldado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bitacora_eventos_respaldo ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividad_clientes_respaldo ENABLE ROW LEVEL SECURITY;

GRANT ALL ON bitacora_eventos_respaldo TO anon, authenticated;
GRANT ALL ON actividad_clientes_respaldo TO anon, authenticated;
GRANT ALL ON SEQUENCE bitacora_eventos_respaldo_id_seq TO anon, authenticated;

DROP POLICY IF EXISTS acceso_bitacora_respaldo_anon ON bitacora_eventos_respaldo;
CREATE POLICY acceso_bitacora_respaldo_anon ON bitacora_eventos_respaldo
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS acceso_actividad_respaldo_anon ON actividad_clientes_respaldo;
CREATE POLICY acceso_actividad_respaldo_anon ON actividad_clientes_respaldo
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_bitacora_respaldo_fecha
  ON bitacora_eventos_respaldo (respaldado_en DESC);

CREATE INDEX IF NOT EXISTS idx_actividad_respaldo_fecha
  ON actividad_clientes_respaldo (respaldado_en DESC);

-- Funcion de respaldo para bitacora_eventos
CREATE OR REPLACE FUNCTION fn_respaldo_bitacora_eventos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fila bitacora_eventos;
  v_operacion TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_fila := OLD;
    v_operacion := 'DELETE';
  ELSIF TG_OP = 'UPDATE' THEN
    v_fila := NEW;
    v_operacion := 'UPDATE';
  ELSE
    v_fila := NEW;
    v_operacion := 'INSERT';
  END IF;

  -- Evita duplicar la copia si el trigger se dispara dos veces
  -- por la misma fila y operacion.
  IF NOT EXISTS (
    SELECT 1 FROM bitacora_eventos_respaldo
    WHERE origen_id = v_fila.id AND operacion = v_operacion
  ) THEN
    INSERT INTO bitacora_eventos_respaldo (
      origen_id, proyecto, usuario, rol, tipo_evento, modulo, detalle, creado_en, operacion
    ) VALUES (
      v_fila.id, v_fila.proyecto, v_fila.usuario, v_fila.rol,
      v_fila.tipo_evento, v_fila.modulo, v_fila.detalle, v_fila.creado_en, v_operacion
    );
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_respaldo_bitacora_eventos ON bitacora_eventos;
CREATE TRIGGER trg_respaldo_bitacora_eventos
  AFTER INSERT OR UPDATE OR DELETE ON bitacora_eventos
  FOR EACH ROW EXECUTE FUNCTION fn_respaldo_bitacora_eventos();

-- Funcion de respaldo para actividad_clientes
CREATE OR REPLACE FUNCTION fn_respaldo_actividad_clientes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fila actividad_clientes;
  v_operacion TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_fila := OLD;
    v_operacion := 'DELETE';
  ELSIF TG_OP = 'UPDATE' THEN
    v_fila := NEW;
    v_operacion := 'UPDATE';
  ELSE
    v_fila := NEW;
    v_operacion := 'INSERT';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM actividad_clientes_respaldo
    WHERE origen_id = v_fila.id AND operacion = v_operacion
  ) THEN
    INSERT INTO actividad_clientes_respaldo (
      origen_id, proyecto, cliente, accion, detalle, creado_en, operacion
    ) VALUES (
      v_fila.id, v_fila.proyecto, v_fila.cliente, v_fila.accion,
      v_fila.detalle, v_fila.creado_en, v_operacion
    );
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_respaldo_actividad_clientes ON actividad_clientes;
CREATE TRIGGER trg_respaldo_actividad_clientes
  AFTER INSERT OR UPDATE OR DELETE ON actividad_clientes
  FOR EACH ROW EXECUTE FUNCTION fn_respaldo_actividad_clientes();

-- ------------------------------------------------------------
-- Comprobaciones utiles (ejecutar a mano si se desea):
--   SELECT COUNT(*) FROM bitacora_eventos_respaldo;
--   SELECT COUNT(*) FROM actividad_clientes_respaldo;
--   SELECT * FROM bitacora_eventos_respaldo ORDER BY respaldado_en DESC LIMIT 20;
--
-- Restaurar una fila eliminada de la bitacora:
--   INSERT INTO bitacora_eventos (proyecto, usuario, rol, tipo_evento, modulo, detalle, creado_en)
--   SELECT proyecto, usuario, rol, tipo_evento, modulo, detalle, creado_en
--   FROM bitacora_eventos_respaldo
--   WHERE origen_id = <ID_BORRADO> AND operacion = 'DELETE'
--   ORDER BY respaldado_en DESC LIMIT 1;
-- ------------------------------------------------------------
