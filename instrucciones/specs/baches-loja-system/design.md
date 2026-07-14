# Design Document

## Overview

BachesLoja is a single-page web application that demonstrates an intelligent pothole management system for Loja, Ecuador. The system consists of two main interfaces: a mobile-first citizen reporting interface and a comprehensive municipal dashboard. The application will be built as a self-contained HTML/CSS/JavaScript prototype with in-memory data storage to facilitate easy demonstration and testing.

## Architecture

### Application Structure
```
BachesLoja/
├── index.html (Main application file)
├── styles/
│   ├── main.css (Core styles and design system)
│   ├── citizen.css (Citizen interface specific styles)
│   └── municipal.css (Municipal dashboard specific styles)
├── scripts/
│   ├── app.js (Main application logic)
│   ├── ai-classifier.js (AI classification engine)
│   ├── citizen-interface.js (Citizen reporting functionality)
│   └── municipal-dashboard.js (Municipal management functionality)
└── assets/
    ├── icons/ (Road sign triangular icons)
    └── sample-images/ (Sample pothole photos for demo)
```

### Technical Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Data Storage**: In-memory JavaScript objects and arrays
- **Responsive Framework**: Custom CSS Grid and Flexbox
- **Icons**: Custom SVG triangular road sign shapes
- **Image Handling**: FileReader API for photo previews
- **Geolocation**: Navigator.geolocation API with simulated fallback

## Components and Interfaces

### 1. Main Application Component (app.js)
**Responsibility**: Application state management, routing between views, and initialization

**Key Methods**:
- `initApp()`: Initialize application, load sample data
- `switchView(viewName)`: Toggle between citizen and municipal interfaces
- `loadSampleData()`: Create demonstration reports
- `updateStatistics()`: Calculate dashboard statistics

### 2. AI Classification Engine (ai-classifier.js)
**Responsibility**: Analyze report content and assign priority levels with transparent reasoning

**Classification Algorithm**:
```javascript
classifyReport(description, roadType, hasPhoto) {
  let score = 0;
  let reasons = [];
  
  // Severity keywords analysis
  const severityWords = ['profundo', 'grande', 'enorme'];
  const riskWords = ['accidente', 'peligroso', 'riesgo'];
  const damageWords = ['moto', 'llanta', 'vehículo'];
  
  // Scoring logic implementation
  // Return { priority, score, reasoning }
}
```

**Key Methods**:
- `classifyReport(reportData)`: Main classification function
- `analyzeDescription(text)`: Text analysis for keywords
- `calculatePriorityScore(criteria)`: Score calculation
- `generateReasoning(detectedCriteria)`: Explanation generation

### 3. Citizen Interface Component (citizen-interface.js)
**Responsibility**: Handle citizen report submission and personal report tracking

**Key Methods**:
- `renderReportForm()`: Generate report submission form
- `handlePhotoUpload(file)`: Process image upload with preview
- `handleLocationSelection()`: Manage neighborhood selection and geolocation
- `submitReport(reportData)`: Process report submission with AI classification
- `showClassificationResult(result)`: Display priority with reasoning
- `renderMyReports()`: Display user's report history

### 4. Municipal Dashboard Component (municipal-dashboard.js)
**Responsibility**: Provide administrative interface for report management

**Key Methods**:
- `renderDashboard()`: Generate main dashboard layout
- `renderStatisticsCards()`: Display overview statistics
- `renderReportFilters()`: Create filtering controls
- `renderMapView()`: Generate schematic neighborhood map
- `renderReportList()`: Display detailed report table
- `handleStatusUpdate(reportId, newStatus)`: Process status changes
- `applyFilters(criteria)`: Filter reports based on criteria

## Data Models

### Report Model
```javascript
{
  id: string,
  timestamp: Date,
  description: string,
  photo: File | null,
  neighborhood: string,
  roadType: 'Principal' | 'Secundaria' | 'Vecinal',
  location: { lat: number, lng: number } | null,
  priority: 'Alta' | 'Media' | 'Baja',
  priorityScore: number,
  reasoning: string[],
  status: 'Pendiente' | 'En proceso' | 'Resuelto',
  citizenId: string
}
```

### Neighborhood Configuration
```javascript
{
  neighborhoods: [
    'Centro Histórico', 'Sucre', 'El Valle', 'San Sebastián',
    'Punzara', 'Zamora Huayco', 'Carigán', 'Yahuarcuna',
    'La Argelia', 'San Cayetano'
  ]
}
```

### Application State
```javascript
{
  currentView: 'citizen' | 'municipal',
  reports: Report[],
  currentUser: string,
  filters: {
    priority: string | null,
    status: string | null,
    neighborhood: string | null
  }
}
```

## User Interface Design

### Design System
**Color Palette**:
- Primary Dark: #1C1F26 (Asphalt gray for backgrounds/text)
- Brand Yellow: #F2B705 (Road sign yellow for accents)
- Alert Orange: #E8590C (High priority indicators)
- Safety Green: #2F9E44 (Low priority/resolved items)
- Surface Light: #F5F6F8 (Background surfaces)

**Typography**:
- Display Font: Space Grotesk (Headings, technical/industrial feel)
- Body Font: Inter (Readable content)
- Mono Font: IBM Plex Mono (Data, coordinates, IDs)

**Iconography**:
- Priority indicators use triangular road sign shapes (▲)
- Color-coded: Orange for Alta, Yellow for Media, Green for Baja

### Citizen Interface Layout
```
Mobile-First Design (320px+)
┌─────────────────────────────────────┐
│ 🔺 BachesLoja                      │
├─────────────────────────────────────┤
│ Descripción del Bache              │
│ [Text Area]                        │
│                                     │
│ Fotografía                         │
│ [Upload + Preview]                 │
│                                     │
│ Ubicación                          │
│ [Neighborhood Dropdown]            │
│ [📍 Usar mi ubicación]             │
│                                     │
│ Tipo de Vía                        │
│ [Radio: Principal|Secundaria|Vecinal] │
│                                     │
│ [Enviar Reporte]                   │
├─────────────────────────────────────┤
│ Mis Reportes                       │
│ • Reporte 1 [Estado]              │
│ • Reporte 2 [Estado]              │
└─────────────────────────────────────┘
```

### Municipal Dashboard Layout
```
Desktop-First Design (1024px+)
┌───────────────────────────────────────────────────────────┐
│ 🔺 Panel Municipal BachesLoja                            │
├──────────────────┬──────────────────┬──────────────────────┤
│ Total Reportes   │ Alta Prioridad   │ En Proceso          │
│ [123]           │ [45]             │ [67]                │
├──────────────────┴──────────────────┴──────────────────────┤
│ Filtros: [Priority▼] [Status▼] [Zone▼]                 │
├──────────────────────┬──────────────────────────────────────┤
│ Mapa Esquemático     │ Lista de Reportes                   │
│ [Neighborhood Grid   │ ┌─[Photo] [Zone] [Priority] [Date]┐  │
│  with colored pins]  │ │ ▲ Bache en Sucre - Alta        │  │
│                      │ │   [Pendiente ▼]               │  │
│                      │ ├─[Photo] [Zone] [Priority]      │  │
│                      │ │ ▲ Bache en Centro - Media      │  │
│                      │ └─────────────────────────────────┘  │
└──────────────────────┴──────────────────────────────────────┘
```

## Error Handling

### Client-Side Error Handling
- **Photo Upload Errors**: File size validation (max 10MB), format validation (JPEG/PNG)
- **Geolocation Errors**: Fallback to manual neighborhood selection
- **Form Validation**: Required field validation with clear error messages
- **Network Simulation**: Simulated delays for AI classification to demonstrate loading states

### User Experience Error States
- Empty report list: "No hay reportes" with suggestion to create first report
- Failed photo upload: "Error al cargar imagen. Intenta con otro archivo."
- Classification timeout: Fallback to manual priority assignment

## Testing Strategy

### Unit Testing Scope
- AI Classification logic accuracy
- Report data model validation
- Filter functionality correctness
- Statistical calculation accuracy

### Integration Testing Scope
- Form submission to report creation flow
- Status update propagation to statistics
- Filter application to report display
- Photo upload and preview functionality

### User Acceptance Testing
- Mobile responsiveness on various screen sizes (320px to 768px)
- Keyboard navigation and accessibility
- Touch interaction on mobile devices
- Visual design consistency across components

### Sample Data Testing
The system will include 6 pre-configured sample reports to demonstrate:
- Different priority levels (2 Alta, 2 Media, 2 Baja)
- Various neighborhoods across Loja
- Different status states (Pendiente, En proceso, Resuelto)
- Different road types and report characteristics

### Performance Considerations
- Lazy loading for report images
- Efficient DOM manipulation for large report lists
- Optimized CSS for mobile rendering
- Minimal JavaScript bundle size for fast loading

## Accessibility Features
- ARIA labels for interactive elements
- Keyboard navigation support
- High contrast mode compatibility
- Screen reader friendly descriptions
- Focus indicators for all interactive elements
- Alt text for all images including uploaded photos