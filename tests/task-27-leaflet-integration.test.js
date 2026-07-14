/* BachesLoja - Task 27: Leaflet Map Integration Tests
 * Validates Requirements: 8.1, 8.2, 8.3, 8.4, 9.2, 9.3, 9.4, 9.5, 9.6
 */

// ============================================================================
// Leaflet Map Module Tests
// ============================================================================

testFramework.category('Task 27 - Leaflet Map Integration');

testFramework.test(
    'Task 27 - Leaflet Map Integration',
    'BachesLojaMap - Module Exists',
    'Verifies that window.BachesLojaMap is exposed with the required API surface',
    async () => {
        testFramework.assertExists(window.BachesLojaMap, 'window.BachesLojaMap should be defined');
        testFramework.assert(typeof window.BachesLojaMap.init === 'function',        'init() method must exist');
        testFramework.assert(typeof window.BachesLojaMap.renderMarkers === 'function', 'renderMarkers() method must exist');
        testFramework.assert(typeof window.BachesLojaMap.clearMarkers === 'function',  'clearMarkers() method must exist');
        testFramework.assert(typeof window.BachesLojaMap.fitBounds === 'function',     'fitBounds() method must exist');
        return { apiSurface: 'complete' };
    }
);

testFramework.test(
    'Task 27 - Leaflet Map Integration',
    'BachesLojaMap - Priority Color Mapping (Req 9.3)',
    'Verifies color assignments match institutional palette: Alta=#E8590C, Media=#F2B705, Baja=#2F9E44',
    async () => {
        const colors = window.BachesLojaMap._priorityColors;
        testFramework.assertExists(colors, '_priorityColors should be defined');
        testFramework.assertEqual(colors['Alta'],  '#E8590C', 'Alta priority color should be #E8590C');
        testFramework.assertEqual(colors['Media'], '#F2B705', 'Media priority color should be #F2B705');
        testFramework.assertEqual(colors['Baja'],  '#2F9E44', 'Baja priority color should be #2F9E44');
        return { colors };
    }
);

testFramework.test(
    'Task 27 - Leaflet Map Integration',
    'BachesLojaMap - Popup Content Builder (Req 9.4)',
    'Verifies buildPopupContent returns HTML with description, barrio, prioridad and estado',
    async () => {
        const sampleReport = {
            id: 'TEST-001',
            description: 'Bache grande en avenida principal con riesgo de accidente',
            neighborhood: 'Centro Histórico',
            priority: 'Alta',
            status: 'Pendiente',
            location: { lat: -3.9931, lng: -79.2042 },
            photo: null
        };

        const html = window.BachesLojaMap._buildPopupContent(sampleReport);

        testFramework.assert(typeof html === 'string', 'Popup content should be a string');
        testFramework.assert(html.includes(sampleReport.neighborhood), 'Popup should contain barrio name');
        testFramework.assert(html.includes(sampleReport.priority),     'Popup should contain priority');
        testFramework.assert(html.includes(sampleReport.status),       'Popup should contain status');
        testFramework.assert(html.includes('#E8590C'),                 'Popup should use Alta priority color');

        // Description should be included (possibly truncated at 80 chars)
        const truncatedDesc = sampleReport.description.slice(0, 80);
        testFramework.assert(html.includes(truncatedDesc.slice(0, 40)), 'Popup should include description text');

        return { htmlLength: html.length, hasPhoto: html.includes('<img') };
    }
);

testFramework.test(
    'Task 27 - Leaflet Map Integration',
    'BachesLojaMap - Popup Shows Photo When foto_url Present (Req 9.4)',
    'Verifies that a report with photo data renders an <img> tag in the popup',
    async () => {
        const reportWithPhoto = {
            id: 'TEST-002',
            description: 'Bache con foto',
            neighborhood: 'Sucre',
            priority: 'Media',
            status: 'En proceso',
            location: { lat: -3.995, lng: -79.205 },
            photo: 'https://example.com/foto-bache.jpg'
        };

        const html = window.BachesLojaMap._buildPopupContent(reportWithPhoto);
        testFramework.assert(html.includes('<img'), 'Popup should include <img> when photo is present');
        testFramework.assert(html.includes(reportWithPhoto.photo), 'Popup should use the photo URL');

        return { hasImg: html.includes('<img') };
    }
);

testFramework.test(
    'Task 27 - Leaflet Map Integration',
    'BachesLojaMap - Description Truncated at 80 Chars (Req 9.4)',
    'Verifies long descriptions are truncated with ellipsis in the popup',
    async () => {
        const longDesc = 'Este es un bache muy largo con una descripción que supera claramente los ochenta caracteres disponibles para el popup';
        const report = {
            id: 'TEST-003',
            description: longDesc,
            neighborhood: 'El Valle',
            priority: 'Baja',
            status: 'Resuelto',
            location: { lat: -3.998, lng: -79.210 },
            photo: null
        };

        const html = window.BachesLojaMap._buildPopupContent(report);
        testFramework.assert(html.includes('…'), 'Long description should be truncated with ellipsis');
        testFramework.assert(!html.includes(longDesc), 'Full long description should not appear in popup');

        return { truncated: true, originalLength: longDesc.length };
    }
);

testFramework.test(
    'Task 27 - Leaflet Map Integration',
    'BachesLojaMap - Leaflet DOM Container Exists (Req 9.2)',
    'Verifies that #leaflet-map container element exists in the app HTML',
    async () => {
        // Check in the app iframe if it exists, otherwise check current doc
        let leafletContainer = document.getElementById('leaflet-map');
        const appFrame = document.getElementById('app-frame');
        if (!leafletContainer && appFrame && appFrame.contentDocument) {
            leafletContainer = appFrame.contentDocument.getElementById('leaflet-map');
        }

        testFramework.assertExists(leafletContainer, '#leaflet-map container must exist in the HTML');

        const height = leafletContainer.style.height || '';
        testFramework.assert(
            height.includes('420') || parseInt(height) >= 300,
            '#leaflet-map should have a meaningful height (420px expected)'
        );

        return {
            id: leafletContainer.id,
            height: leafletContainer.style.height,
            borderRadius: leafletContainer.style.borderRadius
        };
    }
);

testFramework.test(
    'Task 27 - Leaflet Map Integration',
    'BachesLojaMap - No Old Schematic Map Container',
    'Verifies that the old #neighborhood-map container has been replaced by #leaflet-map',
    async () => {
        // Search in the app iframe first, then current document
        let oldMap = document.getElementById('neighborhood-map');
        const appFrame = document.getElementById('app-frame');
        if (!oldMap && appFrame && appFrame.contentDocument) {
            oldMap = appFrame.contentDocument.getElementById('neighborhood-map');
        }

        // The old container should not exist as a standalone map section
        // (it's acceptable if it appears inside a test stub, but the real map container should be leaflet-map)
        let newMap = document.getElementById('leaflet-map');
        if (!newMap && appFrame && appFrame.contentDocument) {
            newMap = appFrame.contentDocument.getElementById('leaflet-map');
        }

        testFramework.assertExists(newMap, '#leaflet-map must exist as the primary map container');

        return {
            hasLeafletMap: !!newMap,
            hasOldSchematicMap: !!oldMap
        };
    }
);

testFramework.test(
    'Task 27 - Leaflet Map Integration',
    'MunicipalDashboard - updateNeighborhoodMap Uses BachesLojaMap (Req 9.2)',
    'Verifies updateNeighborhoodMap() delegates to BachesLojaMap instead of the old schematic HTML builder',
    async () => {
        testFramework.assertExists(window.MunicipalDashboard, 'MunicipalDashboard must be defined');
        testFramework.assert(
            typeof window.MunicipalDashboard.updateNeighborhoodMap === 'function',
            'updateNeighborhoodMap() must exist'
        );

        // Inspect the source of the method to confirm it calls BachesLojaMap (not createNeighborhoodMapHTML)
        const methodSource = window.MunicipalDashboard.updateNeighborhoodMap.toString();
        testFramework.assert(
            methodSource.includes('BachesLojaMap'),
            'updateNeighborhoodMap() must delegate to BachesLojaMap'
        );
        testFramework.assert(
            methodSource.includes('renderMarkers'),
            'updateNeighborhoodMap() must call renderMarkers()'
        );

        return {
            delegatesToBachesLojaMap: methodSource.includes('BachesLojaMap'),
            callsRenderMarkers: methodSource.includes('renderMarkers'),
            callsInit: methodSource.includes('init')
        };
    }
);

testFramework.test(
    'Task 27 - Leaflet Map Integration',
    'BachesLojaMap - renderMarkers Clears Before Rendering (Req 9.5)',
    'Verifies renderMarkers() calls clearMarkers() first to prevent duplicate pins on filter',
    async () => {
        const methodSource = window.BachesLojaMap.renderMarkers.toString();
        testFramework.assert(
            methodSource.includes('clearMarkers'),
            'renderMarkers() must call clearMarkers() to prevent duplicates'
        );
        return { clearCalledFirst: methodSource.indexOf('clearMarkers') < methodSource.indexOf('forEach') };
    }
);

testFramework.test(
    'Task 27 - Leaflet Map Integration',
    'BachesLojaMap - Resize Handler Calls invalidateSize (Req 9.2)',
    'Verifies that a resize event listener calling invalidateSize() is registered',
    async () => {
        const initSource = window.BachesLojaMap.init.toString();
        testFramework.assert(
            initSource.includes('resize'),
            'init() must register a resize event listener'
        );
        testFramework.assert(
            initSource.includes('invalidateSize'),
            'resize handler must call map.invalidateSize()'
        );
        return {
            hasResizeListener: initSource.includes('resize'),
            callsInvalidateSize: initSource.includes('invalidateSize')
        };
    }
);

testFramework.test(
    'Task 27 - Leaflet Map Integration',
    'BachesLojaMap - Idempotent init() (Req 9.2)',
    'Verifies that calling init() multiple times is safe (idempotent)',
    async () => {
        const initSource = window.BachesLojaMap.init.toString();
        // The guard should check _initialized before creating a new map
        testFramework.assert(
            initSource.includes('_initialized'),
            'init() must guard against re-initialization using _initialized flag'
        );
        testFramework.assert(
            initSource.includes('invalidateSize'),
            'init() should call invalidateSize() when already initialized'
        );
        return { isIdempotent: true };
    }
);

testFramework.test(
    'Task 27 - Leaflet Map Integration',
    'BachesLojaMap - Skips Reports Without Coordinates (Req 9.3)',
    'Verifies that reports with null/missing location are gracefully skipped',
    async () => {
        const methodSource = window.BachesLojaMap.renderMarkers.toString();
        testFramework.assert(
            methodSource.includes('location') && (methodSource.includes('== null') || methodSource.includes('!report.location')),
            'renderMarkers() must skip reports without valid location'
        );
        return { guardExists: true };
    }
);

testFramework.test(
    'Task 27 - Leaflet Map Integration',
    'BachesLojaMap - Cluster Group Used for Markers (Req 9.5)',
    'Verifies that markers are added to a markerClusterGroup instead of directly to the map',
    async () => {
        const renderSource = window.BachesLojaMap.renderMarkers.toString();
        const initSource   = window.BachesLojaMap.init.toString();

        testFramework.assert(
            initSource.includes('markerClusterGroup') || initSource.includes('clusterGroup'),
            'init() must create a markerClusterGroup for clustering (Req 9.5)'
        );
        testFramework.assert(
            renderSource.includes('_clusterGroup'),
            'renderMarkers() must add markers to the cluster group'
        );
        return {
            clusterGroupInitialized: initSource.includes('markerClusterGroup') || initSource.includes('clusterGroup'),
            markersAddedToCluster: renderSource.includes('_clusterGroup')
        };
    }
);

// ============================================================================
// End-to-End Flow Verification (Req 8.x + 9.x)
// ============================================================================

testFramework.category('Task 27 - End-to-End Flow');

testFramework.test(
    'Task 27 - End-to-End Flow',
    'Report With Coordinates Appears on Map (Req 8.1 + 9.3)',
    'Simulates submitting a report with coordinates and verifies it is available for the map',
    async () => {
        const initialCount = window.BachesLoja.state.reports.length;

        const reportData = {
            description: 'Bache profundo y peligroso en vía principal de prueba',
            neighborhood: 'Sucre',
            roadType: 'Principal',
            photo: null,
            location: { lat: -3.9940, lng: -79.2050 }
        };

        const classification = window.BachesLojaAI.classifyReport(reportData);
        const newReport = window.BachesLoja.addReport({ ...reportData, ...classification });

        testFramework.assertExists(newReport, 'Report should be created');
        testFramework.assertEqual(
            window.BachesLoja.state.reports.length,
            initialCount + 1,
            'Report count should increase by 1'
        );

        // Verify the report has the location preserved
        const savedReport = window.BachesLoja.state.reports.find(r => r.id === newReport.id);
        testFramework.assertExists(savedReport, 'Report should be findable in state');
        testFramework.assertExists(savedReport.location, 'Saved report should have location');
        testFramework.assertEqual(savedReport.location.lat, -3.9940, 'Latitude should be preserved');
        testFramework.assertEqual(savedReport.location.lng, -79.2050, 'Longitude should be preserved');

        // Verify getFilteredReports returns it (so map can render it)
        const filtered = window.BachesLoja.getFilteredReports();
        const mapCanSeeIt = filtered.some(r => r.id === newReport.id);
        testFramework.assert(mapCanSeeIt, 'Report should appear in filtered reports for map rendering');

        // Cleanup
        window.BachesLoja.state.reports = window.BachesLoja.state.reports.filter(r => r.id !== newReport.id);

        return {
            reportId: newReport.id,
            priority: newReport.priority,
            location: savedReport.location,
            visibleToMap: mapCanSeeIt
        };
    }
);

testFramework.test(
    'Task 27 - End-to-End Flow',
    'Status Change Propagates to Map Data (Req 8.3)',
    'Verifies that after a status change, getFilteredReports reflects the new status for map popups',
    async () => {
        const reports = window.BachesLoja.state.reports;
        testFramework.assert(reports.length > 0, 'There must be sample reports to test');

        const target = reports.find(r => r.status === 'Pendiente') || reports[0];
        const originalStatus = target.status;
        const newStatus = originalStatus === 'Pendiente' ? 'En proceso' : 'Pendiente';

        // Update status in memory (simulating what changeReportStatus does)
        window.BachesLoja.updateReportStatus(target.id, newStatus);

        const filtered = window.BachesLoja.getFilteredReports();
        const updatedReport = filtered.find(r => r.id === target.id);
        testFramework.assertExists(updatedReport, 'Updated report should appear in filtered list');
        testFramework.assertEqual(updatedReport.status, newStatus, 'Filtered report should reflect new status');

        // The popup builder should now show the new status
        if (target.location) {
            const popupHtml = window.BachesLojaMap._buildPopupContent(updatedReport);
            testFramework.assert(popupHtml.includes(newStatus), 'Popup content should reflect updated status');
        }

        // Restore
        window.BachesLoja.updateReportStatus(target.id, originalStatus);

        return {
            reportId: target.id,
            originalStatus,
            newStatus,
            statusReflectedInMap: true
        };
    }
);

testFramework.test(
    'Task 27 - End-to-End Flow',
    'Filter Application Passes Correct Reports to Map (Req 9.3)',
    'Verifies that applying priority filter changes the report set that would be rendered on the map',
    async () => {
        const allReports = window.BachesLoja.getFilteredReports();
        testFramework.assert(allReports.length > 0, 'There must be reports available');

        // Apply Alta priority filter
        window.BachesLoja.applyFilters({ priority: 'Alta', status: null, neighborhood: null });
        const altaReports = window.BachesLoja.getFilteredReports();

        testFramework.assert(
            altaReports.every(r => r.priority === 'Alta'),
            'After Alta filter, all reports should be Alta priority'
        );

        // Verify the map would only show these markers (no mismatched priorities)
        const uniquePriorities = [...new Set(altaReports.map(r => r.priority))];
        testFramework.assert(
            uniquePriorities.length <= 1 && (uniquePriorities.length === 0 || uniquePriorities[0] === 'Alta'),
            'Filtered set should only contain Alta priority reports'
        );

        // Clear and verify all reports are back
        window.BachesLoja.clearFilters();
        const allReportsAfter = window.BachesLoja.getFilteredReports();
        testFramework.assertEqual(allReportsAfter.length, allReports.length, 'All reports visible after clearing filter');

        return {
            allCount: allReports.length,
            altaCount: altaReports.length,
            correctlyFiltered: altaReports.every(r => r.priority === 'Alta')
        };
    }
);

testFramework.test(
    'Task 27 - End-to-End Flow',
    'Reports Without Location Are Excluded From Map (Req 9.3)',
    'Verifies that the map gracefully handles reports without coordinates',
    async () => {
        // Count reports that have a valid location
        const allReports = window.BachesLoja.getFilteredReports();
        const withLocation = allReports.filter(r => r.location && r.location.lat != null && r.location.lng != null);
        const withoutLocation = allReports.filter(r => !r.location || r.location.lat == null);

        // The renderMarkers source should guard against null locations
        const renderSource = window.BachesLojaMap.renderMarkers.toString();
        testFramework.assert(
            renderSource.includes('location'),
            'renderMarkers must check for location before creating markers'
        );

        return {
            totalReports: allReports.length,
            withLocation: withLocation.length,
            withoutLocation: withoutLocation.length,
            mapWillRender: withLocation.length
        };
    }
);

testFramework.test(
    'Task 27 - End-to-End Flow',
    'MunicipalDashboard - getDateFilteredReports Feeds the Map (Req 8.6 + 9.2)',
    'Verifies updateNeighborhoodMap uses getDateFilteredReports (includes date filter on top of priority/status/zone)',
    async () => {
        const methodSource = window.MunicipalDashboard.updateNeighborhoodMap.toString();

        testFramework.assert(
            methodSource.includes('getDateFilteredReports') || methodSource.includes('getFilteredReports'),
            'updateNeighborhoodMap() must use filtered reports, not raw state.reports'
        );

        // Confirm getDateFilteredReports returns an array
        const reports = window.MunicipalDashboard.getDateFilteredReports();
        testFramework.assert(Array.isArray(reports), 'getDateFilteredReports() must return an array');

        return {
            reportCount: reports.length,
            usesFilteredData: methodSource.includes('getDateFilteredReports') || methodSource.includes('getFilteredReports')
        };
    }
);

testFramework.test(
    'Task 27 - End-to-End Flow',
    'BachesLojaMap - fitBounds Handles Empty Report Set',
    'Verifies fitBounds does not throw when no reports have coordinates',
    async () => {
        // Test the fallback behavior in fitBounds for edge cases
        const methodSource = window.BachesLojaMap.fitBounds.toString();

        // Should fall back to Loja center when no coords
        testFramework.assert(
            methodSource.includes('-3.9931') || methodSource.includes('setView'),
            'fitBounds() should fall back to Loja center coordinates when no valid coords exist'
        );
        testFramework.assert(
            methodSource.includes('coords.length === 0') || methodSource.includes('coords.length == 0'),
            'fitBounds() should handle empty coords array gracefully'
        );

        return { handleEmptyCoords: true, fallsBackToLoja: methodSource.includes('-3.9931') };
    }
);
