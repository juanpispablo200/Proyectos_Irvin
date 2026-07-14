-- =============================================================================
-- BachesLoja - Supabase Schema
-- Proyecto: Sistema de Gestión de Baches - Loja, Ecuador
-- Requisitos: 8.1, 8.5, 10.1, 10.2, 10.7
--
-- INSTRUCCIONES DE USO:
--   1. Accede al SQL Editor de tu proyecto en https://supabase.com/dashboard
--   2. Copia y pega este archivo completo
--   3. Ejecuta el script (Run)
--   4. Configura las variables de entorno según la sección al final del archivo
--
-- NOTA MIGRACIÓN:
--   Si ya ejecutaste el schema anterior (sin tabla usuarios), usa la
--   SECCIÓN 7 (Migración) al final del archivo en lugar de re-ejecutar
--   las secciones 1-2 desde cero.
-- =============================================================================


-- =============================================================================
-- SECCIÓN 1: TABLA `usuarios`
-- Req 10.1: perfil de usuario ligado a auth.users de Supabase
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.usuarios (
    -- UUID que coincide con el id del usuario en auth.users
    id                  UUID            PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Nombre completo del usuario
    nombre              TEXT            NOT NULL,

    -- Email único del usuario (espejo de auth.users.email para consultas rápidas)
    email               TEXT            NOT NULL UNIQUE,

    -- Rol del usuario dentro de la aplicación
    -- 'ciudadano' → puede crear y ver sus propios reportes
    -- 'admin'     → puede ver y gestionar todos los reportes
    rol                 TEXT            NOT NULL DEFAULT 'ciudadano'
                            CHECK (rol IN ('ciudadano', 'admin')),

    -- Barrio de referencia del ciudadano (opcional, usado para sugerencias)
    barrio_preferido    TEXT            NULL,

    -- Fecha y hora de registro (automática)
    fecha_registro      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.usuarios                    IS 'Perfiles de usuario del sistema BachesLoja ligados a auth.users';
COMMENT ON COLUMN public.usuarios.id                 IS 'UUID de auth.users; PK y FK al mismo tiempo';
COMMENT ON COLUMN public.usuarios.rol                IS 'ciudadano: acceso propio | admin: acceso total';
COMMENT ON COLUMN public.usuarios.barrio_preferido   IS 'Barrio favorito del ciudadano; nullable';


-- =============================================================================
-- SECCIÓN 2: TABLA PRINCIPAL `reportes`
-- Req 8.5: columnas obligatorias con tipos exactos
-- Req 10.7: ciudadano_id ahora es UUID que referencia usuarios(id)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.reportes (
    -- Identificador único del reporte (generado en el cliente, ej: RPT001)
    id              TEXT            PRIMARY KEY,

    -- Descripción libre del bache ingresada por el ciudadano
    descripcion     TEXT            NOT NULL,

    -- Barrio / zona de Loja donde se ubica el bache
    barrio          TEXT            NOT NULL,

    -- Tipo de vía: 'Principal' | 'Secundaria' | 'Vecinal'
    tipo_via        TEXT            NOT NULL,

    -- Prioridad asignada por la IA: 'Alta' | 'Media' | 'Baja'
    prioridad       TEXT            NOT NULL,

    -- Estado del reporte: 'Pendiente' | 'En proceso' | 'Resuelto'
    estado          TEXT            NOT NULL DEFAULT 'Pendiente',

    -- Coordenadas geográficas (WGS 84)
    lat             FLOAT8          NOT NULL,
    lng             FLOAT8          NOT NULL,

    -- URL pública de la foto en Supabase Storage (opcional)
    foto_url        TEXT            NULL,

    -- UUID del ciudadano que envió el reporte (referencia a usuarios)
    ciudadano_id    UUID            NOT NULL REFERENCES public.usuarios(id),

    -- UUID del funcionario municipal que gestionó el reporte (nullable)
    gestionado_por  UUID            NULL     REFERENCES public.usuarios(id),

    -- Fecha y hora de creación (automática al insertar)
    fecha_creacion  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Puntaje calculado por el clasificador de IA (0–10+)
    puntaje_ia      INT2            NOT NULL DEFAULT 0
);

-- Índices para consultas frecuentes en el dashboard municipal
CREATE INDEX IF NOT EXISTS idx_reportes_barrio         ON public.reportes (barrio);
CREATE INDEX IF NOT EXISTS idx_reportes_prioridad      ON public.reportes (prioridad);
CREATE INDEX IF NOT EXISTS idx_reportes_estado         ON public.reportes (estado);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha_creacion ON public.reportes (fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_reportes_ciudadano_id   ON public.reportes (ciudadano_id);
CREATE INDEX IF NOT EXISTS idx_reportes_gestionado_por ON public.reportes (gestionado_por);

-- Restricciones de dominio (valores válidos)
ALTER TABLE public.reportes
    ADD CONSTRAINT chk_prioridad CHECK (prioridad IN ('Alta', 'Media', 'Baja')),
    ADD CONSTRAINT chk_estado    CHECK (estado    IN ('Pendiente', 'En proceso', 'Resuelto')),
    ADD CONSTRAINT chk_tipo_via  CHECK (tipo_via  IN ('Principal', 'Secundaria', 'Vecinal'));

COMMENT ON TABLE  public.reportes                IS 'Reportes de baches enviados por ciudadanos de Loja';
COMMENT ON COLUMN public.reportes.id             IS 'ID único generado en el cliente (ej: RPT001)';
COMMENT ON COLUMN public.reportes.ciudadano_id   IS 'UUID del ciudadano; FK a public.usuarios(id)';
COMMENT ON COLUMN public.reportes.gestionado_por IS 'UUID del admin que atendió el reporte; nullable';
COMMENT ON COLUMN public.reportes.puntaje_ia     IS 'Puntaje 0-10+ calculado por el clasificador IA de BachesLoja';
COMMENT ON COLUMN public.reportes.foto_url       IS 'URL pública del bucket fotos-baches en Supabase Storage';
COMMENT ON COLUMN public.reportes.fecha_creacion IS 'Timestamp UTC de creación; se asigna automáticamente';


-- =============================================================================
-- SECCIÓN 3: STORAGE BUCKET `fotos-baches`
-- Req 8.4: almacenamiento de fotos con URL pública
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'fotos-baches',
    'fotos-baches',
    TRUE,                          -- bucket público: las URLs no requieren autenticación
    10485760,                      -- límite 10 MB por archivo (Req 1.3)
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;      -- idempotente: no falla si ya existe

/*
  OPCIÓN MANUAL — Si la inserción SQL da error de permisos:
  1. Ve a Storage → "New bucket"
  2. Nombre: fotos-baches
  3. Marca "Public bucket" como activo
  4. File size limit: 10 MB
  5. Allowed MIME types: image/jpeg, image/png, image/webp
*/


-- =============================================================================
-- SECCIÓN 4: ROW LEVEL SECURITY — tabla `reportes`
-- Req 10.2, 10.7: reemplaza las políticas permisivas del MVP por RLS basada en rol
--
-- Roles de PostgreSQL usados:
--   anon          → visitante sin sesión
--   authenticated → cualquier usuario con sesión activa en Supabase Auth
--
-- Roles de aplicación (columna usuarios.rol):
--   'ciudadano'   → solo ve / crea sus propios reportes
--   'admin'       → ve y modifica todos los reportes
-- =============================================================================

-- Activar RLS en la tabla reportes
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------
-- Eliminar políticas permisivas del MVP (no fallan si no existen)
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS "Lectura publica de reportes" ON public.reportes;
DROP POLICY IF EXISTS "Insercion de reportes"       ON public.reportes;
DROP POLICY IF EXISTS "Actualizacion de estado"     ON public.reportes;

-- -----------------------------------------------------------------------
-- Política SELECT:
--   • Ciudadano autenticado → solo sus propios reportes
--   • Admin autenticado     → todos los reportes
-- -----------------------------------------------------------------------
CREATE POLICY "reportes_select_policy"
    ON public.reportes
    FOR SELECT
    TO authenticated
    USING (
        -- El ciudadano solo ve reportes donde él es el ciudadano_id
        ciudadano_id = auth.uid()
        OR
        -- El admin ve todos (verificado contra la tabla usuarios)
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid()
              AND rol = 'admin'
        )
    );

-- -----------------------------------------------------------------------
-- Política INSERT:
--   • Solo ciudadanos autenticados pueden crear reportes
--   • El ciudadano_id del reporte DEBE coincidir con auth.uid()
--     (impide que un ciudadano inserte reportes a nombre de otro)
-- -----------------------------------------------------------------------
CREATE POLICY "reportes_insert_policy"
    ON public.reportes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        ciudadano_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------
-- Política UPDATE:
--   • Solo admins pueden cambiar el estado / gestionado_por de un reporte
-- -----------------------------------------------------------------------
CREATE POLICY "reportes_update_policy"
    ON public.reportes
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid()
              AND rol = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid()
              AND rol = 'admin'
        )
    );


-- =============================================================================
-- SECCIÓN 5: ROW LEVEL SECURITY — tabla `usuarios`
-- Req 10.2: cada usuario gestiona solo su propia fila; admin puede leer todas
-- =============================================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------
-- Política SELECT para usuarios:
--   • Un usuario autenticado puede leer su propia fila
--   • Un admin puede leer todas las filas
-- -----------------------------------------------------------------------
CREATE POLICY "usuarios_select_policy"
    ON public.usuarios
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.usuarios u
            WHERE u.id = auth.uid()
              AND u.rol = 'admin'
        )
    );

-- -----------------------------------------------------------------------
-- Política INSERT para usuarios:
--   • Solo se puede insertar la propia fila (id = auth.uid())
--   • Esto permite que el signup trigger/función cree el perfil
-- -----------------------------------------------------------------------
CREATE POLICY "usuarios_insert_policy"
    ON public.usuarios
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- -----------------------------------------------------------------------
-- Política UPDATE para usuarios:
--   • Un usuario puede actualizar solo su propia fila
-- -----------------------------------------------------------------------
CREATE POLICY "usuarios_update_policy"
    ON public.usuarios
    FOR UPDATE
    TO authenticated
    USING    (id = auth.uid())
    WITH CHECK (id = auth.uid());


-- =============================================================================
-- SECCIÓN 6: RLS EN STORAGE (bucket fotos-baches)
-- =============================================================================

-- Lectura pública de objetos en el bucket
CREATE POLICY "Lectura publica fotos-baches"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'fotos-baches');

-- Subida de fotos (INSERT) permitida para usuarios autenticados
CREATE POLICY "Subida de fotos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'fotos-baches');

-- Eliminación restringida a usuarios autenticados
CREATE POLICY "Eliminacion de fotos autenticada"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'fotos-baches');


-- =============================================================================
-- SECCIÓN 7: MIGRACIÓN DESDE SCHEMA ANTERIOR
-- Usar solo si ya tienes la tabla `reportes` con ciudadano_id TEXT
-- NO ejecutar si estás creando el schema desde cero
-- =============================================================================

/*
-- PASO 1: Eliminar el índice existente sobre ciudadano_id (si existe)
DROP INDEX IF EXISTS public.idx_reportes_ciudadano_id;

-- PASO 2: Crear la tabla usuarios primero (ya está en Sección 1 arriba,
--         pero debe existir antes de alterar la FK en reportes)

-- PASO 3: Convertir ciudadano_id de TEXT a UUID
--   OJO: Este cast solo funciona si los valores TEXT actuales son UUIDs válidos.
--   Si usas IDs como 'citizen_001', primero debes limpiar o mapear los datos.
ALTER TABLE public.reportes
    ALTER COLUMN ciudadano_id TYPE UUID
        USING ciudadano_id::UUID;

-- PASO 4: Agregar la restricción FK hacia usuarios
ALTER TABLE public.reportes
    ADD CONSTRAINT fk_reportes_ciudadano
        FOREIGN KEY (ciudadano_id) REFERENCES public.usuarios(id);

-- PASO 5: Agregar columna gestionado_por (si no existe)
ALTER TABLE public.reportes
    ADD COLUMN IF NOT EXISTS gestionado_por UUID NULL
        REFERENCES public.usuarios(id);

-- PASO 6: Recrear el índice sobre ciudadano_id
CREATE INDEX IF NOT EXISTS idx_reportes_ciudadano_id ON public.reportes (ciudadano_id);
CREATE INDEX IF NOT EXISTS idx_reportes_gestionado_por ON public.reportes (gestionado_por);

-- PASO 7: Eliminar políticas permisivas y aplicar las de Sección 4
--   (ya incluidas en Sección 4 con DROP POLICY IF EXISTS)
*/


-- =============================================================================
-- SECCIÓN 8: DATOS DE PRUEBA (opcional — comentar en producción)
-- NOTA: Con el nuevo schema, ciudadano_id debe ser un UUID válido de auth.users.
-- Los datos de muestra con IDs de texto ('citizen_001') ya no son compatibles.
-- Para probar, crea primero usuarios reales con Supabase Auth y usa sus UUIDs.
-- =============================================================================

/*
-- Ejemplo (reemplaza los UUIDs con los reales de tus usuarios de prueba):

INSERT INTO public.usuarios (id, nombre, email, rol)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Juan Pérez',   'juan@example.com',   'ciudadano'),
    ('00000000-0000-0000-0000-000000000002', 'Ana García',   'ana@example.com',    'ciudadano'),
    ('00000000-0000-0000-0000-000000000099', 'Admin Loja',   'admin@loja.gob.ec',  'admin');

INSERT INTO public.reportes
    (id, descripcion, barrio, tipo_via, prioridad, estado, lat, lng, foto_url, ciudadano_id, fecha_creacion, puntaje_ia)
VALUES
    ('RPT001', 'Bache profundo que causa daño a los vehículos. Es muy peligroso especialmente para motos.',
     'Centro Histórico', 'Principal', 'Alta',    'En proceso', -3.9939, -79.2042, NULL,
     '00000000-0000-0000-0000-000000000001', '2024-07-15 09:30:00+00', 8),
    ('RPT002', 'Pequeño bache en la vía secundaria cerca del mercado.',
     'Sucre',            'Secundaria','Baja',    'Pendiente',  -3.9955, -79.2055, NULL,
     '00000000-0000-0000-0000-000000000002', '2024-07-14 14:45:00+00', 1);
*/


-- =============================================================================
-- SECCIÓN 9: CONFIGURACIÓN DE VARIABLES DE ENTORNO
-- =============================================================================
--
-- PASO 1 — Obtener las credenciales del proyecto Supabase:
--   1. Abre https://supabase.com/dashboard y selecciona tu proyecto
--   2. Ve a Settings → API
--   3. Copia los valores de:
--        • "Project URL"       → SUPABASE_URL
--        • "anon / public key" → SUPABASE_ANON_KEY
--
-- PASO 2 — Agregar las constantes en el frontend:
--   Abre el archivo  scripts/supabase-client.js  y define:
--
--     const SUPABASE_URL      = 'https://<tu-proyecto>.supabase.co';
--     const SUPABASE_ANON_KEY = 'eyJhbGci...';   // clave pública, no secreta
--
--   NUNCA incluyas la "service_role key" en el frontend.
--   La anon key es segura para el cliente porque RLS controla el acceso.
--
-- PASO 3 — Verificar la conexión:
--   Después de configurar las credenciales, ejecuta en la consola del navegador:
--
--     const { data, error } = await window.SupabaseDB.fetchReports();
--     console.log(data, error);
--
--   Si `data` es un array (vacío o con reportes) y `error` es null → OK.
--
-- RESUMEN DE VARIABLES:
--   ┌─────────────────────┬──────────────────────────────────────────────┐
--   │ Variable            │ Dónde definirla                              │
--   ├─────────────────────┼──────────────────────────────────────────────┤
--   │ SUPABASE_URL        │ scripts/supabase-client.js (línea 1)         │
--   │ SUPABASE_ANON_KEY   │ scripts/supabase-client.js (línea 2)         │
--   └─────────────────────┴──────────────────────────────────────────────┘
--
-- =============================================================================
