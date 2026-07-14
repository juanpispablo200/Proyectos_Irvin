/* BachesLoja - Leaflet Map Module */

/*
 * Integration Summary (Requirements 8 + 9):
 *
 * Data flow:
 *   1. app.js init() → SupabaseDB.fetchReports() → state.reports (offline fallback: loadSampleData)
 *   2. citizen-interface.js handleFormSubmit() → SupabaseDB.uploadPhoto() → SupabaseDB.insertReport()
 *   3. municipal-dashboard.js changeReportStatus() → app.js updateReportStatus() → SupabaseDB.updateReportStatus()
 *   4. municipal-dashboard.js exportCSV() → getDateFilteredReports() → Blob download
 *   5. municipal-dashboard.js updateNeighborhoodMap() → BachesLojaMap.init() + renderMarkers()
 *   6. citizen-interface.js location picker → L.marker (draggable) → currentLocation → report.location
 *
 * Map containers:
 *   - #leaflet-map       : municipal dashboard full map (420px)
 *   - #location-picker-map : citizen form mini-map (250px, hidden by default)
 */

window.BachesLojaMap = {
    // Internal state
    _map: null,
    _clusterGroup: null,
    _initialized: false,

    // Priority colors matching Requirement 6 / 9.3
    _priorityColors: {
        'Alta':  '#E8590C',
        'Media': '#F2B705',
        'Baja':  '#2F9E44'
    },

    /**
     * Initialize the Leaflet map in the given container.
     * Safe to call multiple times — re-uses the existing map instance.
     * Centers on Loja, Ecuador (lat: -3.9931, lng: -79.2042), zoom 13.
     * @param {string} containerId - DOM element ID for the map container
     */
    init(containerId) {
        if (this._initialized && this._map) {
            // Already initialized — just invalidate size in case container resized
            this._map.invalidateSize();
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('[BachesLojaMap] Container not found:', containerId);
            return;
        }

        // Create Leaflet map centered on Loja
        this._map = L.map(containerId, {
            center: [-3.9931, -79.2042],
            zoom: 13,
            zoomControl: true,
            attributionControl: true
        });

        // Add OpenStreetMap tile layer (no API key required)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this._map);

        // Create a marker cluster group
        this._clusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 50
        });
        this._map.addLayer(this._clusterGroup);

        this._initialized = true;
        console.log('[BachesLojaMap] Map initialized on container:', containerId);

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this._map) {
                this._map.invalidateSize();
            }
        });
    },

    /**
     * Remove all markers from the cluster group.
     */
    clearMarkers() {
        if (this._clusterGroup) {
            this._clusterGroup.clearLayers();
        }
    },

    /**
     * Render one circleMarker per report, colored by priority.
     * Clears existing markers first to avoid duplicates.
     * @param {Object[]} reports - Array of report objects from app.js state
     */
    renderMarkers(reports) {
        if (!this._initialized || !this._map) {
            console.warn('[BachesLojaMap] Map not initialized. Call init() first.');
            return;
        }

        this.clearMarkers();

        reports.forEach(report => {
            if (!report.location || report.location.lat == null || report.location.lng == null) return;

            const color = this._priorityColors[report.priority] || '#1C1F26';

            const marker = L.circleMarker(
                [report.location.lat, report.location.lng],
                {
                    radius: 10,
                    fillColor: color,
                    color: '#1C1F26',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.85
                }
            );

            marker.bindPopup(this._buildPopupContent(report), {
                maxWidth: 260,
                className: 'baches-popup'
            });

            // Hover tooltip: shows report ID and priority without requiring a click
            marker.bindTooltip(
                `<strong>${report.id}</strong> — Prioridad: <span style="color:${color};font-weight:600;">${report.priority}</span>`,
                { direction: 'top', offset: [0, -8], opacity: 0.95 }
            );

            this._clusterGroup.addLayer(marker);
        });

        console.log(`[BachesLojaMap] Rendered ${reports.length} markers`);
    },

    /**
     * Fit the map viewport to show all markers.
     * Falls back to Loja center if no valid coordinates found.
     * @param {Object[]} reports
     */
    fitBounds(reports) {
        if (!this._map) return;

        const coords = reports
            .filter(r => r.location && r.location.lat != null)
            .map(r => [r.location.lat, r.location.lng]);

        if (coords.length === 0) {
            this._map.setView([-3.9931, -79.2042], 13);
        } else if (coords.length === 1) {
            this._map.setView(coords[0], 15);
        } else {
            this._map.fitBounds(L.latLngBounds(coords), { padding: [30, 30] });
        }
    },

    /**
     * Build HTML popup content for a report marker.
     * @param {Object} report
     * @returns {string} HTML string
     */
    _buildPopupContent(report) {
        const color = this._priorityColors[report.priority] || '#1C1F26';
        const photoHtml = report.photo
            ? `<img src="${typeof report.photo === 'string' ? report.photo : (report.photo.dataUrl || '')}"
                    alt="Foto del bache"
                    style="width:100%;height:120px;object-fit:cover;border-radius:6px;margin-bottom:8px;"
                    onerror="this.style.display='none'">`
            : '';
        const desc = report.description
            ? (report.description.length > 80 ? report.description.slice(0, 80) + '…' : report.description)
            : '';

        return `
            <div style="font-family:Inter,sans-serif;font-size:13px;min-width:180px;">
                ${photoHtml}
                <p style="margin:0 0 6px;color:#1C1F26;line-height:1.4;">${desc}</p>
                <p style="margin:0 0 4px;color:#6B7280;">
                    <strong>Barrio:</strong> ${report.neighborhood || '—'}
                </p>
                <p style="margin:0 0 4px;">
                    <strong>Prioridad:</strong>
                    <span style="color:${color};font-weight:600;">${report.priority}</span>
                </p>
                <p style="margin:0;color:#6B7280;">
                    <strong>Estado:</strong> ${report.status}
                </p>
            </div>
        `;
    }
};
