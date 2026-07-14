# Implementation Plan

- [x] 1. Set up project structure and core HTML foundation



  - Create main index.html file with semantic HTML structure
  - Set up basic HTML for both citizen and municipal views
  - Include meta tags for responsive design and PWA capabilities
  - _Requirements: 1.1, 6.7_

- [x] 2. Implement design system and core styles


  - Create CSS custom properties for the road infrastructure color palette
  - Implement typography system with Space Grotesk, Inter, and IBM Plex Mono fonts
  - Create triangular priority indicator components using CSS and SVG
  - Build responsive grid and flexbox utilities
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 3. Create application state management and routing







  - Implement main app.js with application state object
  - Create view switching functionality between citizen and municipal interfaces
  - Build sample data generation for demonstration purposes
  - Add basic error handling utilities
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 4. Build AI classification engine


  - Implement classifyReport function with keyword analysis
  - Create severity, risk, and damage word detection algorithms
  - Build priority scoring system based on road type and photo presence
  - Generate transparent reasoning explanations for classification decisions
  - Add unit tests for classification accuracy
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_


- [x] 5. Develop citizen report submission interface

  - Create responsive report form with description text area
  - Implement photo upload with preview and validation (10MB max, JPEG/PNG)
  - Build neighborhood dropdown with all Loja zones
  - Add geolocation functionality with simulated fallback
  - Create road type selection (Principal/Secundaria/Vecinal)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 6. Implement report submission and AI classification flow


  - Connect form submission to AI classifier
  - Add "Classifying with AI..." loading animation
  - Display classification results with priority and reasoning
  - Store report in application state
  - Add form validation and error handling
  - _Requirements: 1.7, 1.8_

- [x] 7. Create citizen report tracking interface


  - Build "My Reports" section with report history display
  - Show report status for each submission (Pendiente/En proceso/Resuelto)
  - Implement responsive layout for mobile report cards
  - Add filtering and sorting for personal reports
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 8. Develop municipal dashboard statistics cards


  - Create statistics calculation functions for total reports, priorities, and statuses
  - Build responsive statistics card components
  - Implement real-time updates when report statuses change
  - Add average response time calculation and display
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. Build municipal report filtering system

  - Implement filter controls for priority, status, and zone
  - Create filter application logic to update report display
  - Add "Clear Filters" functionality
  - Ensure filters work with both map and list views
  - _Requirements: 5.1_

- [x] 10. Create schematic map view for municipal dashboard

  - Design neighborhood grid layout representing Loja zones
  - Implement colored pin system based on priority levels
  - Add pin grouping by neighborhood functionality
  - Make pins clickable to show report details
  - Ensure responsive behavior on different screen sizes
  - _Requirements: 5.2, 5.3_

- [x] 11. Develop municipal report management list

  - Create report table/list with photo thumbnails, zone, priority, and date
  - Implement status change controls (Pendiente → En proceso → Resuelto)
  - Add report status update functionality with immediate UI updates
  - Include report details modal or expandable view
  - _Requirements: 5.4, 5.5, 5.6_


- [x] 12. Implement responsive design and mobile optimization

  - Test and refine mobile-first citizen interface (320px+)
  - Optimize municipal dashboard for desktop viewing (1024px+)
  - Add touch-friendly interactions for mobile devices
  - Implement swipe gestures for mobile report cards
  - _Requirements: 6.7_

- [x] 13. Add accessibility features and keyboard navigation





  - Implement ARIA labels for all interactive elements
  - Add keyboard navigation support for all components
  - Create visible focus indicators throughout the interface
  - Add screen reader friendly descriptions for complex UI elements
  - Test with keyboard-only navigation
  - _Requirements: 6.8_

- [x] 14. Create comprehensive sample data set
  - Generate 6 realistic sample reports with varying characteristics
  - Distribute reports across different Loja neighborhoods
  - Ensure representation of all priority levels and statuses
  - Include sample photos or placeholders for demonstration
  - Add realistic timestamps and citizen IDs
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 15. Implement error handling and validation
  - Add client-side form validation with clear error messages
  - Implement photo upload error handling (file size, format)
  - Create geolocation error handling with manual fallback
  - Add empty state displays for no reports scenarios
  - Include loading states for all async operations
  - _Requirements: 1.3, 1.5_

- [x] 16. Add final polish and user experience enhancements
  - Implement smooth transitions and micro-interactions
  - Add toast notifications for successful actions
  - Optimize performance for large numbers of reports
  - Add print-friendly styles for municipal reports
  - Include favicon and app icons
  - _Requirements: 6.8_

- [x] 17. Create comprehensive testing and validation
  - Test all form submissions and validations
  - Verify AI classification accuracy with various input combinations
  - Test responsive design across multiple device sizes
  - Validate accessibility features with screen readers
  - Perform cross-browser compatibility testing
  - _Requirements: All requirements validation_

- [x] 18. Crear schema SQL y configurar proyecto Supabase
  - Escribir el script SQL de creación de la tabla `reportes` con todas las columnas del Req 8.5 (id text PK, descripcion, barrio, tipo_via, prioridad, estado, lat float8, lng float8, foto_url text nullable, ciudadano_id, fecha_creacion timestamptz default now(), puntaje_ia int2)
  - Crear el bucket público `fotos-baches` en Supabase Storage
  - Habilitar Row Level Security (RLS) con política de lectura pública e inserción autenticada
  - Documentar en un archivo `supabase/schema.sql` el DDL completo y las instrucciones de configuración de las variables de entorno (SUPABASE_URL y SUPABASE_ANON_KEY)
  - _Requirements: 8.1, 8.5_

- [x] 19. Integrar cliente Supabase en el proyecto frontend
  - Agregar el script CDN de `@supabase/supabase-js` en `index.html` (versión fija, antes de los scripts de la app)
  - Crear el archivo `scripts/supabase-client.js` que inicializa `window.supabaseClient` usando las constantes `SUPABASE_URL` y `SUPABASE_ANON_KEY` (leídas de variables o de un config object)
  - Exponer el cliente como `window.SupabaseDB` con métodos: `fetchReports()`, `insertReport(data)`, `updateReportStatus(id, status)`, `uploadPhoto(file)` → devuelve URL pública
  - Implementar manejo de errores en cada método: si Supabase falla, loguear el error y lanzar excepción para que el llamador maneje offline gracefully
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 20. Migrar carga inicial: reemplazar datos de muestra por lectura desde Supabase
  - Modificar `app.js` → método `init()`: en lugar de llamar `loadSampleData()`, llamar a `SupabaseDB.fetchReports()` de forma asíncrona con await
  - Mostrar el loading screen (`#loading-screen`) mientras se obtienen los datos; ocultarlo al terminar
  - Mapear las filas devueltas por Supabase al formato de objeto reporte existente (mismo shape que los objetos en `state.reports`)
  - Si la llamada falla (sin internet, credenciales inválidas), caer al modo offline cargando `loadSampleData()` y mostrar un banner de advertencia "Trabajando en modo sin conexión"
  - _Requirements: 8.2_

- [x] 21. Migrar inserción de reportes: persistir nuevos reportes en Supabase
  - Modificar `app.js` → método `addReport(reportData)`: después de construir el objeto `newReport`, llamar `await SupabaseDB.insertReport(newReport)` para persistirlo
  - Modificar `citizen-interface.js` → método `handleFormSubmit()`: hacer el flujo async/await y manejar el error de persistencia mostrando toast de error sin perder el reporte en memoria
  - Si hay foto adjunta, primero llamar `await SupabaseDB.uploadPhoto(file)` para obtener la `foto_url` y asignarla al reporte antes del INSERT
  - _Requirements: 8.1, 8.4_

- [x] 22. Migrar actualización de estado: persistir cambios de estado en Supabase
  - Modificar `app.js` → método `updateReportStatus(reportId, newStatus)`: después de actualizar en memoria, llamar `await SupabaseDB.updateReportStatus(reportId, newStatus)`
  - Modificar `municipal-dashboard.js` → método `changeReportStatus()`: convertir a async, manejar error de Supabase revirtiendo el cambio en memoria si el UPDATE falla
  - Mostrar toast de confirmación en éxito ("Estado actualizado en base de datos") y toast de error en fallo ("Error al guardar. Inténtalo de nuevo.")
  - _Requirements: 8.3_

- [x] 23. Implementar exportación CSV de reportes históricos
  - Agregar botón "Exportar CSV" en el panel municipal (junto al botón "Actualizar")
  - Implementar función `exportToCSV(reports)` en `municipal-dashboard.js` que construya un string CSV con cabeceras: ID, Descripcion, Barrio, TipoVia, Prioridad, Estado, Lat, Lng, FotoURL, CiudadanoID, FechaCreacion, PuntajeIA
  - Aplicar los filtros activos (prioridad, estado, zona, rango de fechas) antes de exportar, de modo que se exporte solo lo que está visible
  - Agregar filtro de rango de fechas (fecha desde / fecha hasta) en el panel de filtros del dashboard
  - Usar `URL.createObjectURL(new Blob([csvContent], {type: 'text/csv'}))` para disparar la descarga sin abrir nueva pestaña
  - _Requirements: 8.6_

- [x] 24. Agregar Leaflet.js e integración base en index.html
  - Agregar en `index.html` los scripts CDN de Leaflet.js (versión 1.9.4 fija) y Leaflet.markercluster (versión 1.5.3 fija) — CSS y JS — antes de los scripts de la app
  - Reemplazar el contenedor `#neighborhood-map` (mapa esquemático) por un `<div id="leaflet-map" style="height: 420px;">` en el HTML del dashboard municipal
  - Crear archivo `scripts/map.js` que expone `window.BachesLojaMap` con métodos: `init(containerId)`, `renderMarkers(reports)`, `clearMarkers()`, `fitBounds(reports)`
  - _Requirements: 9.2, 9.6_

- [x] 25. Implementar marcadores coloreados por prioridad y popups
  - En `map.js` → método `renderMarkers(reports)`: iterar los reportes y crear `L.circleMarker` con radio 10 y color de relleno según prioridad (Alta=#E8590C, Media=#F2B705, Baja=#2F9E44) y borde #1C1F26
  - Crear función `buildPopupContent(report)` que devuelva HTML con: foto en miniatura (si existe `foto_url`), descripción (truncada a 80 chars), barrio, prioridad con color institucional, y estado
  - Asociar popup a cada marcador con `marker.bindPopup(buildPopupContent(report))`
  - Agrupar marcadores usando `L.markerClusterGroup()` de Leaflet.markercluster; agregar el cluster group al mapa en lugar de marcadores individuales
  - _Requirements: 9.3, 9.4, 9.5_

- [x] 26. Integrar captura de coordenadas reales en el formulario ciudadano
  - Agregar un mini-mapa Leaflet (`#location-picker-map`, height 250px) en el formulario de reporte ciudadano, debajo del botón "Usar mi ubicación", inicialmente oculto
  - WHEN el usuario hace clic en "Usar mi ubicación" y la geolocalización tiene éxito, centrar el mini-mapa en las coordenadas obtenidas y mostrar un marcador arrastrable; guardar coords en `CitizenInterface.currentLocation`
  - WHEN el usuario hace clic directamente sobre el mini-mapa THEN colocar/mover el marcador en ese punto y actualizar `CitizenInterface.currentLocation` con las coordenadas del clic
  - Agregar botón "Seleccionar en mapa" que muestre/oculte el mini-mapa para que el usuario pueda marcar manualmente si la geolocalización no está disponible
  - _Requirements: 9.1_

- [x] 27. Reemplazar mapa esquemático por mapa Leaflet en el dashboard municipal y pruebas de integración
  - Modificar `municipal-dashboard.js` → método `updateNeighborhoodMap()`: reemplazar la lógica de `createNeighborhoodMapHTML()` por llamadas a `BachesLojaMap.init('leaflet-map')` (si no está inicializado) y `BachesLojaMap.renderMarkers(filteredReports)`
  - Asegurar que `BachesLojaMap.renderMarkers()` limpia marcadores anteriores (`clearMarkers()`) antes de renderizar los nuevos, para evitar duplicados al aplicar filtros
  - Verificar que el mapa se redimensiona correctamente al hacer resize de ventana llamando `map.invalidateSize()` en el evento `resize`
  - Probar flujo completo end-to-end: enviar reporte con foto y coordenadas → verificar que aparece en Supabase → verificar que el pin aparece en el mapa Leaflet con popup correcto → verificar que cambio de estado se persiste
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 28. Crear tabla `usuarios` y actualizar schema SQL

  - Agregar tabla `usuarios` a `supabase/schema.sql`: `id uuid PK references auth.users(id)`, `nombre text`, `email text unique`, `rol text check('ciudadano','admin')`, `barrio_preferido text nullable`, `fecha_registro timestamptz default now()`
  - Alterar `reportes.ciudadano_id` de TEXT a UUID referenciando `usuarios(id)`, agregar columna `gestionado_por uuid references usuarios(id) nullable`
  - Eliminar las políticas RLS permisivas existentes en `reportes` y reemplazarlas con políticas basadas en rol: ciudadano SELECT solo sus propios reportes o admin ve todos; ciudadano INSERT solo con su propio auth.uid(); solo admin puede UPDATE
  - Agregar RLS en tabla `usuarios`: usuarios pueden leer/actualizar su propia fila; admin puede leer todas
  - Agregar índices recomendados en `reportes(barrio, prioridad, estado, fecha_creacion)`
  - _Requirements: 10.1, 10.2, 10.7_

- [x] 29. Implementar autenticación Supabase Auth en `supabase-client.js`

  - Agregar `window.SupabaseDB.signUp(email, password, nombre, rol)`: llama `supabase.auth.signUp`, luego inserta en la tabla `usuarios`; lanza error con mensaje descriptivo en caso de fallo
  - Agregar `window.SupabaseDB.signIn(email, password)`: llama `supabase.auth.signInWithPassword`; tras el login, obtiene la fila del usuario desde `usuarios` para verificar el rol; lanza error si las credenciales son inválidas o el usuario no existe
  - Agregar `window.SupabaseDB.signOut()`: llama `supabase.auth.signOut`
  - Agregar `window.SupabaseDB.getCurrentUser()`: retorna `{ authUser, profile }` combinando `supabase.auth.getUser()` con la fila de `usuarios`, o null si no hay sesión activa
  - Agregar `window.SupabaseDB.onAuthStateChange(callback)`: envuelve `supabase.auth.onAuthStateChange`; el callback recibe `{ authUser, profile }` o null
  - _Requirements: 10.1, 10.2, 10.5, 10.8_

- [x] 30. Crear pantalla de inicio (landing) con selección de rol

  - Crear sección `#landing-view` en `index.html`: layout a pantalla completa con ilustración SVG hero de calle, dos tarjetas grandes con tap-targets ("Soy ciudadano" y "Soy funcionario municipal"), y una línea de subtítulo con branding de la app
  - Agregar estilos del landing view a `styles/main.css`: grid de dos columnas en desktop, apiladas en móvil; las tarjetas usan colores de marca (amarillo para ciudadano, asfalto oscuro para municipal)
  - En `app.js` → `init()`: verificar `SupabaseDB.getCurrentUser()` al cargar; si existe sesión restaurar la vista correcta; si no hay sesión mostrar `#landing-view` en lugar de la vista ciudadana directamente
  - Conectar botón "Soy ciudadano" para mostrar `#auth-modal` en modo ciudadano; conectar "Soy funcionario municipal" para mostrar `#auth-modal` en modo admin
  - _Requirements: 10.3, 10.5_

- [x] 31. Crear modal de autenticación (login/registro) reutilizable

  - Agregar `#auth-modal` a `index.html` con: input de email, input de contraseña, input opcional de nombre (para registro), toggle entre "Iniciar sesión" y "Registrarse", botón de submit, y área de error inline
  - En `app.js` → `handleAuthSubmit(mode, role)`: llamar `SupabaseDB.signIn` o `SupabaseDB.signUp` según el modo; en caso de éxito llamar `onLoginSuccess(profile)`; en caso de error mostrar toast (no `alert()`) con el mensaje exacto devuelto por Supabase
  - `onLoginSuccess(profile)`: asignar `state.currentUser` al `profile.id` (UUID), asignar `state.currentRole` al rol del perfil; ocultar landing; si rol === 'admin' llamar `switchView('municipal')`, en caso contrario `switchView('citizen')`
  - Si el login de admin tiene éxito pero `profile.rol !== 'admin'`, cerrar sesión inmediatamente y mostrar toast: "Acceso denegado: tu cuenta no tiene permisos de administrador"
  - Manejar el error "email ya registrado" con toast sugiriendo iniciar sesión en su lugar
  - _Requirements: 10.1, 10.2, 10.3, 10.8_

- [x] 32. Persistir sesión y agregar botones de cierre de sesión

  - En `app.js` → `init()`: llamar `SupabaseDB.onAuthStateChange` para escuchar cambios de sesión; al restaurar sesión llamar `onLoginSuccess`; al limpiar sesión mostrar la pantalla de landing
  - Agregar botón de logout al header de la interfaz ciudadana en `index.html`: botón con id `citizen-logout-btn`, etiqueta "Cerrar sesión"
  - Agregar botón de logout al header del dashboard municipal en `index.html`: botón con id `municipal-logout-btn`
  - Conectar ambos botones a `app.js → handleLogout()`: llama `SupabaseDB.signOut`, limpia `state.currentUser` y `state.currentRole`, limpia `state.reports`, muestra la pantalla de landing
  - _Requirements: 10.5, 10.6_

- [x] 33. Actualizar `app.js` para usar `auth.uid()` en lugar de usuario hardcodeado

  - Reemplazar `state.currentUser: 'citizen_001'` por `state.currentUser: null` y agregar `state.currentRole: null`
  - Actualizar `addReport()`: asignar `citizenId: this.state.currentUser` (ahora un UUID); si `state.currentRole === 'admin'` permitir bypass; si no está autenticado lanzar error "Debes iniciar sesión para reportar"
  - Actualizar `getCurrentUserReports()`: filtrar por `report.citizenId === this.state.currentUser` (comparación de UUID, misma lógica pero ahora con UUID real de auth)
  - Actualizar `updateReportStatus()`: agregar campo `gestionadoPor: this.state.currentUser` a la actualización del reporte; pasarlo a `SupabaseDB.updateReportStatus` como segundo argumento
  - Actualizar `SupabaseDB.updateReportStatus(id, newStatus, gestionadoPor)`: incluir `gestionado_por: gestionadoPor` en la llamada UPDATE a Supabase
  - _Requirements: 10.4, 10.7_

- [x] 34. Actualizar mappers de `supabase-client.js` para incluir nuevos campos

  - Actualizar `mapRowToReport(row)`: incluir `gestionadoPor: row.gestionado_por` en el objeto retornado
  - Actualizar `mapReportToRow(report)`: incluir `ciudadano_id: report.citizenId` como UUID (no string), `gestionado_por: report.gestionadoPor || null`
  - Actualizar `SupabaseDB.fetchReports()`: si el usuario está autenticado y su rol es 'ciudadano', agregar filtro `.eq('ciudadano_id', currentUserId)` para que los ciudadanos solo carguen sus propios reportes; si es admin, obtener todos
  - Actualizar `SupabaseDB.insertReport()`: usar `auth.uid()` de `supabase.auth.getUser()` para asignar `ciudadano_id` si no se proporciona
  - _Requirements: 10.4, 10.7_

- [x] 35. Actualizar `supabase/schema.sql` con schema completo final

  - Reemplazar el contenido completo de `supabase/schema.sql` con el schema de producción final que incluye: tabla `usuarios`, tabla `reportes` actualizada (UUID en `ciudadano_id`, columna `gestionado_por`), todos los índices, todas las constraints, políticas RLS completas para ambas tablas, bucket de Storage y sus políticas RLS
  - Agregar una sección de migración que muestre cómo hacer ALTER a la tabla `reportes` existente si se actualiza desde el schema anterior (cambiar `ciudadano_id` de TEXT a UUID con cast, agregar columna `gestionado_por`)
  - Agregar RLS en tabla `usuarios`: usuarios pueden SELECT y UPDATE su propia fila; admins pueden SELECT todas las filas
  - Documentar todas las variables y pasos de configuración en comentarios al inicio del archivo
  - _Requirements: 10.1, 10.2, 10.7_

- [x] 36. Crear pantalla de landing con ilustración SVG y jerarquía visual

  - Crear una ilustración SVG inline (calle minimalista con bache, 2 colores: carretera #1C1F26 + contorno del bache #F2B705) para el hero del landing en `index.html`
  - Estilizar `#landing-view` en `styles/main.css`: altura de viewport completa, fondo asfalto oscuro (#1C1F26), título en amarillo, dos tarjetas grandes con efecto hover lift (transform: translateY(-4px)), iconos con motivo SVG de señal triangular de tránsito
  - Tarjeta ciudadano: acento amarillo (#F2B705), ícono de persona, subtítulo "Reporta baches en tu barrio"
  - Tarjeta municipal: blanco sobre oscuro, ícono de dashboard/gráfico, subtítulo "Gestiona y prioriza reportes"
  - Las tarjetas deben tener mínimo 280px de alto, ser touch-friendly y tener visible focus ring para navegación por teclado
  - _Requirements: 11.1, 11.3, 11.7_

- [x] 37. Implementar micro-interacciones y transiciones de pantalla

  - Agregar transiciones CSS a `styles/main.css`: fade+slide de entrada/salida para los cambios de vista (citizen ↔ municipal ↔ landing) usando `opacity` y `transform: translateY` con 250ms ease
  - En `app.js → switchView()`: agregar/remover la clase CSS `view-entering` en el contenedor de la vista entrante para disparar la transición
  - Agregar animación "clasificando" en `styles/citizen.css` para el estado de carga de la clasificación IA: cono de tráfico SVG animado (keyframes CSS, el cono rota/rebota) que se reproduce durante el estado "Classifying with AI…" en citizen-interface.js
  - Conectar la animación del cono: en `citizen-interface.js` mostrar el elemento `.ai-cone-loader` mientras se ejecuta la clasificación, ocultarlo cuando aparezcan los resultados
  - Agregar animación suave de apertura/cierre del modal: escala desde 0.95 + fade in en 200ms
  - _Requirements: 11.2, 11.6_

- [x] 38. Implementar modo oscuro y reforzar identidad visual de señalética

  - Agregar propiedades CSS custom para modo oscuro en `styles/main.css` usando `@media (prefers-color-scheme: dark)` y toggle de clase `.dark-mode`: la interfaz ciudadana usa dark profundo (#0F1117 de fondo), el dashboard municipal mantiene asfalto (#1C1F26) como primario
  - Agregar botón de toggle de modo oscuro en ambas interfaces en `index.html`: ícono de luna/sol, actualiza `document.documentElement.classList.toggle('dark-mode')`, persiste preferencia en `localStorage`
  - Refactorizar badges de prioridad en `styles/main.css` y `styles/municipal.css` para usar forma triangular con `clip-path` (no solo un cuadrado de color) — reforzar consistentemente el motivo de triángulo de señal vial
  - Aplicar el motivo triangular a: botones de acción primaria (enviar reporte, exportar CSV) como decoración sutil de borde izquierdo o clip; badges de estado (Pendiente/En proceso/Resuelto) con formas de señal vial
  - Asegurar que todas las combinaciones de color de texto/fondo pasen el ratio de contraste WCAG AA (4.5:1 para texto normal) tanto en modo claro como oscuro
  - _Requirements: 11.4, 11.5, 11.7_

- [x] 39. Implementar estados vacíos y estados de carga con identidad

  - Reemplazar el spinner genérico en la pantalla de carga de `index.html` por un cono de tráfico SVG animado (keyframe CSS: rebote + pulso de color usando #F2B705/#E8590C)
  - Agregar componentes de estado vacío a la sección "Mis Reportes" del ciudadano: cuando no existen reportes, mostrar ilustración SVG de bache + mensaje "Aún no has reportado ningún bache 👀 — ¡Sé el primero en tu barrio!" con botón CTA para hacer scroll al formulario
  - Agregar estado vacío a la lista de reportes municipal: cuando los filtros no devuelven resultados, mostrar ícono de cono + "No hay reportes con estos filtros. Intenta cambiar los criterios de búsqueda." con botón "Limpiar filtros"
  - Agregar skeleton loading cards (shimmer animado en CSS) que se muestren mientras `SupabaseDB.fetchReports()` está en progreso — reemplazarlas con tarjetas reales cuando lleguen los datos
  - Todos los mensajes de estado vacío deben usar `font-family: Inter` con lenguaje cálido y directo (sin "No data found" genérico)
  - _Requirements: 11.6, 11.7_

- [x] 40. Corregir bug de foto en tabla y modal del dashboard municipal

  - En `municipal-dashboard.js` → `createReportRow()`: reemplazar `report.photo.dataUrl` por lógica condicional `typeof report.photo === 'string' ? report.photo : (report.photo.dataUrl || '')` para soportar tanto URLs de Supabase Storage como objetos locales con `.dataUrl`
  - Aplicar el mismo fix en `createReportDetailsHTML()` para la foto del modal de detalles
  - Aplicar el mismo fix en `buildCSV()` para la columna FotoURL del export
  - Agregar atributo `onerror="this.style.display='none'"` a los `<img>` de foto para manejar URLs rotas sin mostrar imagen rota
  - _Requirements: 8.4_

- [x] 41. Unificar implementación de showToast en MunicipalDashboard

  - En `municipal-dashboard.js` → método `showToast()`: eliminar la implementación duplicada (que creaba su propio DOM de toast con estilo diferente) y reemplazarla por una delegación a `window.BachesLoja.showToast(message, type)` para mantener una única implementación y estilo consistente en toda la app
  - Agregar fallback a `console.warn` en caso de que `BachesLoja` no esté disponible (protección de orden de carga)
  - _Requirements: 6.8_

- [x] 42. Agregar favicon SVG inline al HTML

  - En `index.html` → sección `<head>`: agregar `<link rel="icon" type="image/svg+xml">` con un favicon SVG codificado como data URI — triángulo amarillo (#F2B705) con borde asfalto (#1C1F26) y símbolo `!`, coherente con la identidad visual de señalética vial de la app
  - No requiere archivo externo; el SVG inline garantiza compatibilidad sin dependencia de assets
  - _Requirements: 6.1, 6.6_
