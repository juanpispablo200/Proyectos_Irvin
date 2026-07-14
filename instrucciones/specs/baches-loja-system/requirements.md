# Requirements Document

## Introduction

BachesLoja is an intelligent pothole management and monitoring platform for Loja, Ecuador. The system enables citizens to report potholes through a mobile-first interface, uses AI to automatically classify priority levels, and provides municipal authorities with a comprehensive dashboard for planning and tracking road maintenance activities. This academic project demonstrates sustainable urban infrastructure management through technology.

## Requirements

### Requirement 1: Citizen Reporting Interface

**User Story:** As a citizen of Loja, I want to report potholes with photos and location details, so that municipal authorities can address road safety issues efficiently.

#### Acceptance Criteria

1. WHEN a citizen accesses the reporting form THEN the system SHALL display a mobile-first responsive interface
2. WHEN a citizen enters a pothole description THEN the system SHALL accept free text input
3. WHEN a citizen uploads a photo THEN the system SHALL show image preview and validate file format
4. WHEN a citizen selects location THEN the system SHALL provide a dropdown with Loja neighborhoods (Centro Histórico, Sucre, El Valle, San Sebastián, Punzara, Zamora Huayco, Carigán, Yahuarcuna, La Argelia, San Cayetano)
5. WHEN a citizen clicks "Use my location" THEN the system SHALL attempt browser geolocation with simulated fallback
6. WHEN a citizen selects road type THEN the system SHALL provide options: Principal, Secundaria, Vecinal
7. WHEN a citizen submits a report THEN the system SHALL show "Classifying with AI..." animation
8. WHEN AI classification completes THEN the system SHALL display assigned priority (Alta/Media/Baja) with explanation of criteria

### Requirement 2: Citizen Report Tracking

**User Story:** As a citizen, I want to track the status of my reported potholes, so that I can see municipal response progress.

#### Acceptance Criteria

1. WHEN a citizen views "My Reports" THEN the system SHALL display all their submitted reports
2. WHEN displaying reports THEN the system SHALL show status for each (Pendiente/En proceso/Resuelto)
3. WHEN a report status changes THEN the system SHALL update the display accordingly

### Requirement 3: AI Priority Classification

**User Story:** As the system, I want to automatically classify pothole reports by priority, so that municipal resources are allocated efficiently.

#### Acceptance Criteria

1. WHEN processing a report THEN the system SHALL analyze description for severity keywords ("profundo", "grande", "enorme") and add 3 points
2. WHEN processing a report THEN the system SHALL analyze description for risk keywords ("accidente", "peligroso", "riesgo") and add 3 points  
3. WHEN processing a report THEN the system SHALL analyze description for vehicle damage mentions ("moto", "llanta", "vehículo") and add 2 points
4. WHEN road type is "Principal" THEN the system SHALL add 2 points
5. WHEN road type is "Secundaria" THEN the system SHALL add 1 point
6. WHEN photo is attached THEN the system SHALL add 1 point
7. WHEN total score is ≥5 THEN the system SHALL assign "Alta" priority
8. WHEN total score is ≥2 and <5 THEN the system SHALL assign "Media" priority
9. WHEN total score is <2 THEN the system SHALL assign "Baja" priority
10. WHEN classification completes THEN the system SHALL display reasoning showing which criteria were triggered

### Requirement 4: Municipal Dashboard Overview

**User Story:** As a municipal administrator, I want to see comprehensive statistics about pothole reports, so that I can understand the overall road maintenance situation.

#### Acceptance Criteria

1. WHEN administrator accesses dashboard THEN the system SHALL display total number of reports
2. WHEN administrator accesses dashboard THEN the system SHALL display count of high priority reports
3. WHEN administrator accesses dashboard THEN the system SHALL display count of reports in progress
4. WHEN administrator accesses dashboard THEN the system SHALL display count of resolved reports
5. WHEN administrator accesses dashboard THEN the system SHALL display average response time indicator

### Requirement 5: Municipal Report Management

**User Story:** As a municipal administrator, I want to view, filter, and manage pothole reports, so that I can efficiently plan and execute road maintenance.

#### Acceptance Criteria

1. WHEN administrator views reports THEN the system SHALL provide filters by priority, status, and zone
2. WHEN administrator views reports THEN the system SHALL display schematic map with colored pins by priority
3. WHEN administrator views reports THEN the system SHALL group map pins by neighborhood
4. WHEN administrator views report list THEN the system SHALL show photo thumbnail, zone, priority, date for each report
5. WHEN administrator updates report status THEN the system SHALL provide controls to change from Pendiente → En proceso → Resuelto
6. WHEN administrator changes status THEN the system SHALL update the report state immediately

### Requirement 6: Visual Design and Branding

**User Story:** As a user, I want the interface to reflect the road infrastructure domain, so that the system feels purposeful and professional.

#### Acceptance Criteria

1. WHEN user views any interface THEN the system SHALL use asphalt dark gray (#1C1F26) for backgrounds/text
2. WHEN user views any interface THEN the system SHALL use road sign yellow (#F2B705) for brand accents
3. WHEN user views high priority items THEN the system SHALL use alert orange (#E8590C)
4. WHEN user views resolved/low priority items THEN the system SHALL use safety green (#2F9E44)
5. WHEN user views surface backgrounds THEN the system SHALL use light gray (#F5F6F8)
6. WHEN user views priority indicators THEN the system SHALL display triangular road sign shapes instead of generic badges
7. WHEN user navigates THEN the system SHALL provide responsive design across devices
8. WHEN user uses keyboard THEN the system SHALL show visible focus indicators

### Requirement 7: Sample Data and Demonstration

**User Story:** As a demonstration user, I want to see realistic sample data, so that I can understand the system's functionality immediately.

#### Acceptance Criteria

1. WHEN system loads THEN it SHALL contain 5-6 pre-loaded sample reports
2. WHEN system loads THEN sample reports SHALL be distributed across different Loja neighborhoods
3. WHEN system loads THEN sample reports SHALL have varying priorities and statuses
4. WHEN system loads THEN municipal dashboard SHALL display meaningful statistics from sample data

### Requirement 8: Persistencia con Base de Datos Real

**User Story:** Como administrador municipal, quiero que los reportes se guarden en una base de datos real, para que no se pierdan al recargar la página y pueda generar reportes históricos.

#### Acceptance Criteria

1. WHEN se envía un nuevo reporte THEN el sistema SHALL guardarlo en Supabase (Postgres) mediante INSERT en la tabla `reportes`
2. WHEN se carga la aplicación THEN el sistema SHALL leer los reportes existentes desde Supabase con SELECT y poblar el estado en memoria
3. WHEN un admin cambia el estado de un reporte THEN el sistema SHALL ejecutar UPDATE en Supabase para persistir el nuevo estado
4. WHEN se sube una foto THEN el sistema SHALL subirla a Supabase Storage y guardar la URL pública resultante en el campo `foto_url` del reporte
5. La tabla `reportes` SHALL tener columnas: `id` (text PK), `descripcion` (text), `barrio` (text), `tipo_via` (text), `prioridad` (text), `estado` (text), `lat` (float8), `lng` (float8), `foto_url` (text nullable), `ciudadano_id` (text), `fecha_creacion` (timestamptz), `puntaje_ia` (int2)
6. WHEN el admin solicita un reporte histórico THEN el sistema SHALL permitir exportar los datos filtrados (por fecha, zona o prioridad) en formato CSV descargable

### Requirement 9: Mapa Interactivo Real con Leaflet

**User Story:** Como usuario, quiero ver un mapa real (no esquemático) con la ubicación exacta de cada bache, para ubicarlo geográficamente de verdad.

#### Acceptance Criteria

1. WHEN el ciudadano reporta un bache THEN el sistema SHALL capturar coordenadas lat/lng reales mediante geolocalización del navegador o clic manual sobre un mini-mapa Leaflet embebido en el formulario
2. WHEN se muestra el mapa municipal THEN el sistema SHALL usar Leaflet.js con tiles de OpenStreetMap (sin API key), centrado en Loja, Ecuador (lat: -3.9931, lng: -79.2042), zoom nivel 13
3. WHEN se renderiza el mapa THEN el sistema SHALL mostrar un marcador por cada reporte, coloreado según prioridad: Alta=#E8590C, Media=#F2B705, Baja=#2F9E44
4. WHEN se hace clic en un marcador THEN el sistema SHALL mostrar un popup con foto (si existe), descripción, barrio, prioridad y estado del reporte
5. WHEN hay múltiples reportes cercanos THEN el sistema SHALL agruparlos usando Leaflet.markercluster
6. El mapa SHALL mantener la paleta de colores institucional definida en Requirement 6 y no alterar el diseño visual existente
