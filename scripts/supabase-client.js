/* BachesLoja - Supabase Client
 *
 * CONFIGURACIÓN REQUERIDA:
 * Antes de usar la aplicación con base de datos real, reemplaza los valores
 * de las constantes de abajo con las credenciales de tu proyecto Supabase.
 *
 * Cómo obtenerlas:
 *   1. Abre https://supabase.com/dashboard y selecciona tu proyecto
 *   2. Ve a Settings → API
 *   3. Copia "Project URL" → SUPABASE_URL
 *   4. Copia "anon / public key" → SUPABASE_ANON_KEY
 *
 * IMPORTANTE: Usa SIEMPRE la "anon key", nunca la "service_role key".
 * La anon key es segura en el cliente porque Row Level Security controla el acceso.
 */

// ─────────────────────────────────────────────────────────────────────────────
// REEMPLAZA ESTOS VALORES CON LAS CREDENCIALES DE TU PROYECTO SUPABASE
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL     = 'https://TU-PROYECTO.supabase.co';   // ← reemplazar
const SUPABASE_ANON_KEY = 'TU-ANON-KEY-AQUI';                 // ← reemplazar
// ─────────────────────────────────────────────────────────────────────────────

// Inicializar cliente Supabase (usa el global `supabase` cargado desde CDN)
// Si las credenciales son los valores placeholder, el cliente se crea igualmente
// pero fallará en las llamadas a la red; la app caerá al modo offline gracefully.
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Mapea una fila de la tabla `reportes` (esquema Supabase) al formato de objeto
 * que usa el estado en memoria de la aplicación (app.js).
 *
 * @param {Object} row - Fila devuelta por Supabase
 * @returns {Object} Objeto reporte con los campos de app.js
 */
function mapRowToReport(row) {
    return {
        id:            row.id,
        description:   row.descripcion,
        neighborhood:  row.barrio,
        roadType:      row.tipo_via,
        priority:      row.prioridad,
        status:        row.estado,
        location: {
            lat: row.lat,
            lng: row.lng
        },
        photo:         row.foto_url || null,
        citizenId:     row.ciudadano_id,
        timestamp:     row.fecha_creacion ? new Date(row.fecha_creacion) : new Date(),
        priorityScore: row.puntaje_ia ?? 0,
        reasoning:     [],   // No persisted in DB; restored as empty array
        gestionadoPor: row.gestionado_por || null  // Req 10.7
    };
}

/**
 * Mapea un objeto reporte del estado en memoria de app.js a las columnas
 * de la tabla `reportes` en Supabase.
 *
 * @param {Object} report - Objeto reporte de app.js
 * @returns {Object} Objeto con los nombres de columna de Supabase
 */
function mapReportToRow(report) {
    return {
        id:             report.id,
        descripcion:    report.description,
        barrio:         report.neighborhood,
        tipo_via:       report.roadType,
        prioridad:      report.priority,
        estado:         report.status || 'Pendiente',
        lat:            report.location ? report.location.lat : 0,
        lng:            report.location ? report.location.lng : 0,
        foto_url:       report.photo || null,
        ciudadano_id:   report.citizenId,
        fecha_creacion: report.timestamp instanceof Date
                            ? report.timestamp.toISOString()
                            : (report.timestamp || new Date().toISOString()),
        puntaje_ia:     report.priorityScore ?? 0,
        gestionado_por: report.gestionadoPor || null  // Req 10.7
    };
}

/**
 * window.SupabaseDB
 *
 * Interfaz pública para todas las operaciones de base de datos.
 * Cada método lanza un Error en caso de fallo para que el llamador
 * pueda manejar la situación offline de forma controlada.
 */
window.SupabaseDB = {

    /**
     * Obtiene reportes ordenados por fecha de creación (más reciente primero).
     * Req 8.2 — SELECT * FROM reportes ORDER BY fecha_creacion DESC
     * Req 10.4 — Ciudadanos solo ven sus propios reportes; admins ven todos
     *
     * Si hay una sesión activa y el perfil del usuario tiene rol 'ciudadano',
     * se aplica un filtro .eq('ciudadano_id', uid) para que RLS y la capa
     * de aplicación coincidan. Los admins (y usuarios sin sesión) obtienen todos.
     *
     * @returns {Promise<Object[]>} Array de objetos reporte en el formato de app.js
     * @throws {Error} Si la consulta a Supabase falla
     */
    async fetchReports() {
        // Determinar si el usuario autenticado es ciudadano para filtrar sus reportes
        let currentUserId = null;
        let isCitizen = false;

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user) {
                currentUserId = user.id;
                // Consultar rol del usuario en la tabla `usuarios`
                const { data: profile } = await window.supabaseClient
                    .from('usuarios')
                    .select('rol')
                    .eq('id', user.id)
                    .single();
                if (profile && profile.rol === 'ciudadano') {
                    isCitizen = true;
                }
            }
        } catch (_) {
            // Sin sesión o error al obtener perfil — no filtrar
        }

        let query = window.supabaseClient
            .from('reportes')
            .select('*')
            .order('fecha_creacion', { ascending: false });

        // Req 10.4 — ciudadanos solo cargan sus propios reportes
        if (isCitizen && currentUserId) {
            query = query.eq('ciudadano_id', currentUserId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[SupabaseDB] fetchReports error:', error);
            throw new Error(`Error al obtener reportes: ${error.message}`);
        }

        return (data || []).map(mapRowToReport);
    },

    /**
     * Inserta un nuevo reporte en la tabla `reportes`.
     * Req 8.1 — INSERT INTO reportes
     * Req 10.4 — asignar ciudadano_id desde auth.uid() si no viene en el reporte
     *
     * @param {Object} report - Objeto reporte con el formato de app.js
     * @returns {Promise<Object>} El reporte insertado, mapeado al formato de app.js
     * @throws {Error} Si el INSERT falla
     */
    async insertReport(report) {
        const row = mapReportToRow(report);

        // Req 10.4 — si el reporte no trae ciudadano_id, obtenerlo de auth.uid()
        if (!row.ciudadano_id) {
            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user) {
                    row.ciudadano_id = user.id;
                }
            } catch (_) {
                // Sin sesión activa — ciudadano_id queda null; RLS rechazará si es requerido
            }
        }

        const { data, error } = await window.supabaseClient
            .from('reportes')
            .insert([row])
            .select()
            .single();

        if (error) {
            console.error('[SupabaseDB] insertReport error:', error);
            throw new Error(`Error al guardar el reporte: ${error.message}`);
        }

        return mapRowToReport(data);
    },

    /**
     * Actualiza el campo `estado` de un reporte existente.
     * Req 8.3, 10.7 — UPDATE reportes SET estado=newStatus, gestionado_por=gestionadoPor WHERE id=id
     *
     * @param {string} id            - ID del reporte a actualizar (ej: "RPT001")
     * @param {string} newStatus     - Nuevo estado: 'Pendiente' | 'En proceso' | 'Resuelto'
     * @param {string} gestionadoPor - UUID del admin que realiza el cambio (opcional)
     * @returns {Promise<Object>} El reporte actualizado, mapeado al formato de app.js
     * @throws {Error} Si el UPDATE falla o el reporte no existe
     */
    async updateReportStatus(id, newStatus, gestionadoPor) {
        const updateData = { estado: newStatus };
        
        // Req 10.7 — include gestionado_por if provided
        if (gestionadoPor) {
            updateData.gestionado_por = gestionadoPor;
        }

        const { data, error } = await window.supabaseClient
            .from('reportes')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[SupabaseDB] updateReportStatus error:', error);
            throw new Error(`Error al actualizar el estado del reporte ${id}: ${error.message}`);
        }

        return mapRowToReport(data);
    },

    /**
     * Sube una foto al bucket público `fotos-baches` en Supabase Storage
     * y devuelve la URL pública resultante.
     * Req 8.4 — upload to fotos-baches, return public URL
     *
     * @param {File} file - Objeto File del input tipo file del formulario
     * @returns {Promise<string>} URL pública de la foto subida
     * @throws {Error} Si la subida falla o no se puede obtener la URL pública
     */
    async uploadPhoto(file) {
        // Construir un nombre de archivo único para evitar colisiones
        const extension = file.name.split('.').pop() || 'jpg';
        const fileName  = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${extension}`;
        const filePath  = `reportes/${fileName}`;

        const { error: uploadError } = await window.supabaseClient.storage
            .from('fotos-baches')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert:       false,
                contentType:  file.type || 'image/jpeg'
            });

        if (uploadError) {
            console.error('[SupabaseDB] uploadPhoto upload error:', uploadError);
            throw new Error(`Error al subir la foto: ${uploadError.message}`);
        }

        // Obtener la URL pública del archivo recién subido
        const { data: urlData } = window.supabaseClient.storage
            .from('fotos-baches')
            .getPublicUrl(filePath);

        if (!urlData || !urlData.publicUrl) {
            throw new Error('No se pudo obtener la URL pública de la foto subida.');
        }

        return urlData.publicUrl;
    },

    // ─────────────────────────────────────────────────────────────────────────
    // AUTENTICACIÓN (Req 10.1, 10.2, 10.5, 10.8)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Registra un nuevo usuario en Supabase Auth y crea su perfil en la tabla `usuarios`.
     * Req 10.1 — Citizen registration with email/password
     *
     * Flujo:
     *   1. supabase.auth.signUp → crea la cuenta en auth.users
     *   2. INSERT en `usuarios` con el UUID devuelto + nombre + rol
     *
     * @param {string} email    - Correo electrónico del nuevo usuario
     * @param {string} password - Contraseña (mínimo 6 caracteres, validado por Supabase Auth)
     * @param {string} nombre   - Nombre visible del usuario
     * @param {string} rol      - 'ciudadano' | 'admin'
     * @returns {Promise<{ authUser: Object, profile: Object }>}
     * @throws {Error} Con mensaje descriptivo si el registro o la inserción fallan
     */
    async signUp(email, password, nombre, rol) {
        // 1. Crear cuenta en Supabase Auth
        const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
            email,
            password
        });

        if (authError) {
            console.error('[SupabaseDB] signUp auth error:', authError);
            // Traducir mensajes comunes al español para mostrarse como toast (Req 10.8)
            if (authError.message.toLowerCase().includes('already registered') ||
                authError.message.toLowerCase().includes('user already registered')) {
                throw new Error('Este correo ya está registrado. Intenta iniciar sesión.');
            }
            throw new Error(`Error al crear la cuenta: ${authError.message}`);
        }

        const authUser = authData.user;
        if (!authUser) {
            throw new Error('No se pudo crear la cuenta. Intenta nuevamente.');
        }

        // 2. Insertar perfil en la tabla `usuarios`
        const { data: profile, error: profileError } = await window.supabaseClient
            .from('usuarios')
            .insert([{
                id:     authUser.id,
                nombre: nombre,
                email:  email,
                rol:    rol || 'ciudadano'
            }])
            .select()
            .single();

        if (profileError) {
            console.error('[SupabaseDB] signUp profile insert error:', profileError);
            // El usuario de auth fue creado pero el perfil no; limpiar sesión para evitar estado inconsistente
            await window.supabaseClient.auth.signOut();
            throw new Error(`Error al guardar el perfil de usuario: ${profileError.message}`);
        }

        return { authUser, profile };
    },

    /**
     * Inicia sesión con email y contraseña, y verifica el rol del usuario
     * consultando la tabla `usuarios`.
     * Req 10.2 — Admin/citizen login with role verification
     *
     * @param {string} email    - Correo electrónico
     * @param {string} password - Contraseña
     * @returns {Promise<{ authUser: Object, profile: Object }>}
     * @throws {Error} Si las credenciales son inválidas o el perfil no existe
     */
    async signIn(email, password) {
        const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error('[SupabaseDB] signIn error:', authError);
            // Normalizar mensaje para toast (Req 10.8)
            if (authError.message.toLowerCase().includes('invalid login credentials') ||
                authError.message.toLowerCase().includes('invalid credentials')) {
                throw new Error('Correo o contraseña incorrectos.');
            }
            throw new Error(`Error al iniciar sesión: ${authError.message}`);
        }

        const authUser = authData.user;

        // Obtener perfil del usuario desde la tabla `usuarios` para leer el rol
        const { data: profile, error: profileError } = await window.supabaseClient
            .from('usuarios')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (profileError || !profile) {
            console.error('[SupabaseDB] signIn profile fetch error:', profileError);
            // Cerrar sesión si no existe perfil para evitar estado inconsistente
            await window.supabaseClient.auth.signOut();
            throw new Error('No se encontró un perfil para este usuario. Contacta al administrador.');
        }

        return { authUser, profile };
    },

    /**
     * Cierra la sesión activa del usuario.
     * Req 10.5 — Session management
     *
     * @returns {Promise<void>}
     * @throws {Error} Si signOut falla
     */
    async signOut() {
        const { error } = await window.supabaseClient.auth.signOut();

        if (error) {
            console.error('[SupabaseDB] signOut error:', error);
            throw new Error(`Error al cerrar sesión: ${error.message}`);
        }
    },

    /**
     * Devuelve el usuario autenticado actualmente junto con su perfil de `usuarios`,
     * o null si no hay sesión activa.
     * Req 10.5 — Session persistence across page reloads
     *
     * @returns {Promise<{ authUser: Object, profile: Object } | null>}
     */
    async getCurrentUser() {
        const { data: { user: authUser }, error: authError } = await window.supabaseClient.auth.getUser();

        if (authError || !authUser) {
            // Sin sesión activa — no es un error, es el estado esperado cuando no está logueado
            return null;
        }

        const { data: profile, error: profileError } = await window.supabaseClient
            .from('usuarios')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (profileError || !profile) {
            console.warn('[SupabaseDB] getCurrentUser: sesión activa pero sin perfil en usuarios.', profileError);
            // Retornar authUser sin perfil para que el llamador pueda decidir qué hacer
            return { authUser, profile: null };
        }

        return { authUser, profile };
    },

    /**
     * Suscribe un callback a los cambios de estado de autenticación (login, logout,
     * restauración de sesión al recargar la página).
     * Req 10.5 — Auth state change listener
     *
     * El callback recibe `{ authUser, profile }` cuando hay sesión activa,
     * o `null` cuando se cierra sesión o no hay sesión.
     *
     * @param {Function} callback - función(userOrNull) donde userOrNull es
     *                              { authUser, profile } | null
     * @returns {Object} Objeto de suscripción con método `.unsubscribe()` para
     *                   limpiar el listener cuando ya no sea necesario
     */
    onAuthStateChange(callback) {
        const { data: subscription } = window.supabaseClient.auth.onAuthStateChange(
            async (event, session) => {
                if (!session || !session.user) {
                    // Sesión cerrada o expirada
                    callback(null);
                    return;
                }

                const authUser = session.user;

                // Obtener perfil actualizado desde `usuarios`
                const { data: profile, error: profileError } = await window.supabaseClient
                    .from('usuarios')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (profileError || !profile) {
                    console.warn('[SupabaseDB] onAuthStateChange: sin perfil para', authUser.id);
                    callback({ authUser, profile: null });
                    return;
                }

                callback({ authUser, profile });
            }
        );

        // Devolver la suscripción para que el llamador pueda cancelarla con .unsubscribe()
        return subscription;
    }
};
