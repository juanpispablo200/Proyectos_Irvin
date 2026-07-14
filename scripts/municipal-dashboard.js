/* BachesLoja - Municipal Dashboard Logic */

window.MunicipalDashboard = {
    // Current filter state
    currentFilters: {
        priority: null,
        status: null,
        zone: null,
        dateFrom: null,
        dateTo: null
    },

    // Initialize municipal dashboard
    init() {
        console.log('Initializing Municipal Dashboard...');
        this.setupEventListeners();
    },

    // Setup event listeners
    setupEventListeners() {
        // Filter controls
        const priorityFilter = document.getElementById('priority-filter');
        const statusFilter = document.getElementById('status-filter');
        const zoneFilter = document.getElementById('zone-filter');
        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        const refreshBtn = document.getElementById('refresh-reports-btn');

        if (priorityFilter) {
            priorityFilter.addEventListener('change', (e) => {
                this.currentFilters.priority = e.target.value || null;
                this.applyFilters();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value || null;
                this.applyFilters();
            });
        }

        if (zoneFilter) {
            zoneFilter.addEventListener('change', (e) => {
                this.currentFilters.zone = e.target.value || null;
                this.applyFilters();
            });
        }

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }

        const dateFromFilter = document.getElementById('date-from-filter');
        const dateToFilter = document.getElementById('date-to-filter');
        const exportCsvBtn = document.getElementById('export-csv-btn');

        if (dateFromFilter) {
            dateFromFilter.addEventListener('change', (e) => {
                this.currentFilters.dateFrom = e.target.value || null;
                this.applyFilters();
            });
        }

        if (dateToFilter) {
            dateToFilter.addEventListener('change', (e) => {
                this.currentFilters.dateTo = e.target.value || null;
                this.applyFilters();
            });
        }

        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                this.exportCSV();
            });
        }

        // Report status change buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="change-status"]')) {
                const reportId = e.target.getAttribute('data-report-id');
                const newStatus = e.target.getAttribute('data-new-status');
                this.changeReportStatus(reportId, newStatus);
            }

            if (e.target.matches('[data-action="view-report"]')) {
                const reportId = e.target.getAttribute('data-report-id');
                this.viewReportDetails(reportId);
            }
        });
    },

    // Apply current filters
    applyFilters() {
        // Update BachesLoja state filters
        window.BachesLoja.applyFilters(this.currentFilters);
        
        // Update displays
        this.updateStatistics();
        this.updateReportsList();
        this.updateNeighborhoodMap();
        
        console.log('Filters applied:', this.currentFilters);
    },

    // Clear all filters
    clearAllFilters() {
        // Reset filter controls
        const priorityFilter = document.getElementById('priority-filter');
        const statusFilter = document.getElementById('status-filter');
        const zoneFilter = document.getElementById('zone-filter');

        if (priorityFilter) priorityFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        if (zoneFilter) zoneFilter.value = '';

        // Reset filter state
        this.currentFilters = {
            priority: null,
            status: null,
            zone: null,
            dateFrom: null,
            dateTo: null
        };

        // Clear date inputs
        const dateFromFilter = document.getElementById('date-from-filter');
        const dateToFilter = document.getElementById('date-to-filter');
        if (dateFromFilter) dateFromFilter.value = '';
        if (dateToFilter) dateToFilter.value = '';

        // Clear BachesLoja filters
        window.BachesLoja.clearFilters();

        // Update displays
        this.render();
    },

    // Refresh dashboard data
    refreshDashboard() {
        const refreshBtn = document.getElementById('refresh-reports-btn');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span aria-hidden="true">🔄</span>Actualizando...';
        }

        // Simulate refresh delay
        setTimeout(() => {
            this.render();

            if (window.BachesLojaMap && window.BachesLojaMap._initialized) {
                window.BachesLojaMap.fitBounds(window.BachesLoja.getFilteredReports());
            }
            
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<span aria-hidden="true">🔄</span>Actualizar';
            }
            
            this.showToast('Dashboard actualizado', 'success');
        }, 1000);
    },

    // Update statistics cards
    updateStatistics() {
        const stats = window.BachesLoja.calculateStatistics();
        
        // Update stat cards
        this.updateStatCard('total-reports', stats.total, this.formatNumber(stats.total));
        this.updateStatCard('high-priority-reports', stats.highPriority, this.formatNumber(stats.highPriority));
        this.updateStatCard('in-progress-reports', stats.inProgress, this.formatNumber(stats.inProgress));
        this.updateStatCard('resolved-reports', stats.resolved, this.formatNumber(stats.resolved));
        this.updateStatCard('avg-response-time', stats.avgResponseTime, stats.avgResponseTime);
        
        console.log('Statistics updated:', stats);
    },

    // Update individual stat card
    updateStatCard(elementId, value, displayValue) {
        const element = document.getElementById(elementId);
        if (element) {
            // Animate number change
            this.animateNumber(element, element.textContent, displayValue);
            
            // Add visual feedback for changes
            element.parentElement.classList.add('updated');
            setTimeout(() => {
                element.parentElement.classList.remove('updated');
            }, 1000);
        }
    },

    // Animate number changes
    animateNumber(element, startValue, endValue) {
        const isNumeric = !isNaN(parseFloat(endValue));
        
        if (!isNumeric) {
            element.textContent = endValue;
            return;
        }

        const start = parseFloat(startValue) || 0;
        const end = parseFloat(endValue);
        const duration = 500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            const current = start + (end - start) * easeOut;
            element.textContent = Math.round(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },

    // Format numbers for display
    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    },

    // Update neighborhood map — delegates to BachesLojaMap (Leaflet)
    updateNeighborhoodMap() {
        const filteredReports = this.getDateFilteredReports();

        // Initialize Leaflet map (idempotent — safe to call multiple times)
        if (window.BachesLojaMap) {
            window.BachesLojaMap.init('leaflet-map');
            window.BachesLojaMap.renderMarkers(filteredReports);
        }
    },

    // Calculate stats by neighborhood
    calculateNeighborhoodStats(reports) {
        const stats = {};
        
        // Initialize neighborhoods
        window.BachesLoja.config.neighborhoods.forEach(neighborhood => {
            stats[neighborhood] = {
                name: neighborhood,
                total: 0,
                highPriority: 0,
                pending: 0,
                inProgress: 0,
                resolved: 0
            };
        });

        // Count reports by neighborhood
        reports.forEach(report => {
            const neighborhood = report.neighborhood;
            if (stats[neighborhood]) {
                stats[neighborhood].total++;
                
                if (report.priority === 'Alta') {
                    stats[neighborhood].highPriority++;
                }
                
                switch (report.status) {
                    case 'Pendiente':
                        stats[neighborhood].pending++;
                        break;
                    case 'En proceso':
                        stats[neighborhood].inProgress++;
                        break;
                    case 'Resuelto':
                        stats[neighborhood].resolved++;
                        break;
                }
            }
        });

        return stats;
    },

    // Create neighborhood map HTML
    createNeighborhoodMapHTML(stats) {
        const neighborhoods = Object.values(stats);
        const maxReports = Math.max(...neighborhoods.map(n => n.total), 1);
        
        return `
            <div class="map-grid">
                ${neighborhoods.map(neighborhood => this.createNeighborhoodPin(neighborhood, maxReports)).join('')}
            </div>
            <div class="map-legend">
                <div class="legend-item">
                    <div class="legend-color" style="background-color: var(--priority-alta);"></div>
                    <span>Alta Prioridad</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: var(--priority-media);"></div>
                    <span>Media Prioridad</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: var(--priority-baja);"></div>
                    <span>Baja Prioridad</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #E5E7EB;"></div>
                    <span>Sin Reportes</span>
                </div>
            </div>
        `;
    },

    // Create neighborhood pin
    createNeighborhoodPin(neighborhood, maxReports) {
        const intensity = neighborhood.total / maxReports;
        let pinColor = '#E5E7EB'; // Default gray
        
        if (neighborhood.highPriority > 0) {
            pinColor = 'var(--priority-alta)';
        } else if (neighborhood.total > 0) {
            pinColor = neighborhood.pending > neighborhood.resolved ? 'var(--priority-media)' : 'var(--priority-baja)';
        }
        
        const size = Math.max(40, 80 * intensity);
        
        return `
            <div class="neighborhood-pin" 
                 style="background-color: ${pinColor}; width: ${size}px; height: ${size}px;"
                 data-neighborhood="${neighborhood.name}"
                 title="${neighborhood.name}: ${neighborhood.total} reportes"
                 onclick="MunicipalDashboard.filterByNeighborhood('${neighborhood.name}')">
                <div class="pin-content">
                    <div class="pin-name">${this.getNeighborhoodShortName(neighborhood.name)}</div>
                    <div class="pin-count">${neighborhood.total}</div>
                </div>
                <div class="pin-tooltip">
                    <strong>${neighborhood.name}</strong><br>
                    Total: ${neighborhood.total}<br>
                    Alta Prioridad: ${neighborhood.highPriority}<br>
                    Pendientes: ${neighborhood.pending}<br>
                    En Proceso: ${neighborhood.inProgress}<br>
                    Resueltos: ${neighborhood.resolved}
                </div>
            </div>
        `;
    },

    // Get short name for neighborhood
    getNeighborhoodShortName(fullName) {
        const shortNames = {
            'Centro Histórico': 'CH',
            'Sucre': 'SUC',
            'El Valle': 'VLL',
            'San Sebastián': 'SS',
            'Punzara': 'PUN',
            'Zamora Huayco': 'ZH',
            'Carigán': 'CAR',
            'Yahuarcuna': 'YAH',
            'La Argelia': 'ARG',
            'San Cayetano': 'SC'
        };
        return shortNames[fullName] || fullName.substring(0, 3).toUpperCase();
    },

    // Filter by neighborhood
    filterByNeighborhood(neighborhood) {
        const zoneFilter = document.getElementById('zone-filter');
        if (zoneFilter) {
            zoneFilter.value = neighborhood;
        }
        
        this.currentFilters.zone = neighborhood;
        this.applyFilters();
        
        this.showToast(`Filtrado por ${neighborhood}`, 'info');
    },

    // Update reports list/table
    updateReportsList() {
        const reportsTableBody = document.getElementById('reports-table-body');
        const emptyState = document.getElementById('empty-reports-state');
        
        if (!reportsTableBody) return;

        const filteredReports = this.getDateFilteredReports();
        
        if (filteredReports.length === 0) {
            reportsTableBody.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            reportsTableBody.style.display = '';
            if (emptyState) emptyState.style.display = 'none';
            
            reportsTableBody.innerHTML = filteredReports
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map(report => this.createReportRow(report))
                .join('');
        }
    },

    // Create report table row
    createReportRow(report) {
        const priorityColor = window.BachesLoja.getPriorityColor(report.priority);
        const statusColor = window.BachesLoja.getStatusColor(report.status);
        
        return `
            <tr class="report-row" data-report-id="${report.id}">
                <td class="photo-cell">
                    ${report.photo ? 
                        `<div class="photo-thumbnail">
                            <img src="${typeof report.photo === 'string' ? report.photo : (report.photo.dataUrl || '')}" alt="Foto del reporte" onerror="this.style.display='none'" />
                         </div>` : 
                        `<div class="no-photo">📷</div>`
                    }
                </td>
                <td class="zone-cell">
                    <div class="zone-info">
                        <div class="zone-name">${report.neighborhood}</div>
                        <div class="road-type">${report.roadType}</div>
                    </div>
                </td>
                <td class="priority-cell">
                    <div class="priority-badge" style="background-color: ${priorityColor}20; color: ${priorityColor};">
                        <div class="road-triangle priority-${report.priority.toLowerCase()}"></div>
                        ${report.priority}
                    </div>
                </td>
                <td class="status-cell">
                    <select class="status-select" 
                            data-report-id="${report.id}" 
                            data-current-status="${report.status}"
                            onchange="MunicipalDashboard.changeReportStatus('${report.id}', this.value)">
                        <option value="Pendiente" ${report.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="En proceso" ${report.status === 'En proceso' ? 'selected' : ''}>En proceso</option>
                        <option value="Resuelto" ${report.status === 'Resuelto' ? 'selected' : ''}>Resuelto</option>
                    </select>
                </td>
                <td class="date-cell">
                    <div class="date-info">
                        <div class="date-main">${window.BachesLoja.formatDate(report.timestamp)}</div>
                        <div class="report-id">${report.id}</div>
                    </div>
                </td>
                <td class="actions-cell">
                    <div class="action-buttons">
                        <button class="action-btn view-btn" 
                                data-action="view-report" 
                                data-report-id="${report.id}"
                                title="Ver detalles">
                            👁️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    // Change report status
    async changeReportStatus(reportId, newStatus) {
        const previousReport = window.BachesLoja.state.reports.find(r => r.id === reportId);
        const previousStatus = previousReport ? previousReport.status : '';

        try {
            const updatedReport = await window.BachesLoja.updateReportStatus(reportId, newStatus);

            if (updatedReport) {
                // Update displays after successful update
                this.updateStatistics();
                this.updateNeighborhoodMap();

                // Show success toast
                this.showToast('Estado actualizado en base de datos', 'success');

                // Log action
                console.log(`Report ${reportId} status changed from ${previousStatus} to ${newStatus}`);
            } else {
                // updateReportStatus returned null (validation error before Supabase call)
                const select = document.querySelector(`select[data-report-id="${reportId}"]`);
                if (select) {
                    select.value = previousStatus;
                }
                this.showToast('Error al guardar. Inténtalo de nuevo.', 'error');
            }
        } catch (error) {
            console.warn(`[MunicipalDashboard] changeReportStatus failed for ${reportId}:`, error);

            // Revert in-memory status back to previous
            const report = window.BachesLoja.state.reports.find(r => r.id === reportId);
            if (report) {
                report.status = previousStatus;
            }

            // Revert the <select> element value
            const select = document.querySelector(`select[data-report-id="${reportId}"]`);
            if (select) {
                select.value = previousStatus;
            }

            this.showToast('Error al guardar. Inténtalo de nuevo.', 'error');
        }
    },

    // View report details in modal
    viewReportDetails(reportId) {
        const report = window.BachesLoja.state.reports.find(r => r.id === reportId);
        if (!report) {
            this.showToast('Reporte no encontrado', 'error');
            return;
        }

        const modal = document.getElementById('report-modal');
        const modalBody = document.getElementById('modal-body');
        
        if (modal && modalBody) {
            modalBody.innerHTML = this.createReportDetailsHTML(report);
            modal.classList.add('active');
            
            // Setup modal close handlers
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.matches('.modal-backdrop')) {
                    this.closeModal();
                }
            });
            
            modal.querySelector('.modal-close-btn')?.addEventListener('click', () => {
                this.closeModal();
            });
        }
    },

    // Create report details HTML
    createReportDetailsHTML(report) {
        const priorityColor = window.BachesLoja.getPriorityColor(report.priority);
        
        return `
            <div class="report-details">
                <div class="report-details-header">
                    <div class="report-id-large">${report.id}</div>
                    <div class="report-date-large">${window.BachesLoja.formatDate(report.timestamp)}</div>
                </div>
                
                ${report.photo ? `
                    <div class="report-photo-section">
                        <img src="${typeof report.photo === 'string' ? report.photo : (report.photo.dataUrl || '')}" alt="Foto del reporte" class="report-photo-large" onerror="this.style.display='none'" />
                    </div>
                ` : ''}
                
                <div class="report-info-grid">
                    <div class="info-item">
                        <label>Descripción:</label>
                        <p>${report.description}</p>
                    </div>
                    
                    <div class="info-item">
                        <label>Ubicación:</label>
                        <p>${report.neighborhood} - Vía ${report.roadType}</p>
                    </div>
                    
                    <div class="info-item">
                        <label>Prioridad:</label>
                        <div class="priority-badge" style="background-color: ${priorityColor}20; color: ${priorityColor};">
                            <div class="road-triangle priority-${report.priority.toLowerCase()}"></div>
                            ${report.priority} (Puntaje: ${report.priorityScore})
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <label>Estado Actual:</label>
                        <div class="status-badge ${report.status.toLowerCase().replace(' ', '-')}">${report.status}</div>
                    </div>
                    
                    <div class="info-item">
                        <label>Citizen ID:</label>
                        <code>${report.citizenId}</code>
                    </div>
                    
                    ${report.location ? `
                        <div class="info-item">
                            <label>Coordenadas:</label>
                            <code>${report.location.lat.toFixed(6)}, ${report.location.lng.toFixed(6)}</code>
                        </div>
                    ` : ''}
                </div>
                
                ${report.reasoning && report.reasoning.length > 0 ? `
                    <div class="ai-analysis-section">
                        <h4>Análisis IA:</h4>
                        <ul class="reasoning-list">
                            ${report.reasoning.map(reason => `<li>${reason}</li>`).join('')}
                        </ul>
                        ${report.confidence ? `
                            <div class="confidence-score">
                                Nivel de confianza: ${Math.round(report.confidence * 100)}%
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    },

    // Close modal
    closeModal() {
        const modal = document.getElementById('report-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    // Show toast notification — delegates to the central BachesLoja.showToast
    // to keep a single toast implementation and consistent styling across the app.
    showToast(message, type = 'info') {
        if (window.BachesLoja && typeof window.BachesLoja.showToast === 'function') {
            window.BachesLoja.showToast(message, type);
        } else {
            // Fallback in case BachesLoja hasn't loaded yet (should not happen in normal flow)
            console.warn('[MunicipalDashboard] BachesLoja.showToast unavailable:', message);
        }
    },

    // Get reports filtered by all active filters including date range
    getDateFilteredReports() {
        let reports = window.BachesLoja.getFilteredReports();
        if (this.currentFilters.dateFrom) {
            const from = new Date(this.currentFilters.dateFrom);
            reports = reports.filter(r => new Date(r.timestamp) >= from);
        }
        if (this.currentFilters.dateTo) {
            const to = new Date(this.currentFilters.dateTo);
            to.setHours(23, 59, 59, 999);
            reports = reports.filter(r => new Date(r.timestamp) <= to);
        }
        return reports;
    },

    // Export currently filtered reports to a CSV file download
    exportCSV() {
        const reports = this.getDateFilteredReports();
        if (reports.length === 0) {
            this.showToast('No hay reportes para exportar con los filtros actuales', 'warning');
            return;
        }
        const csvContent = this.buildCSV(reports);
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `baches-loja-${timestamp}.csv`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        this.showToast(`${reports.length} reportes exportados`, 'success');
    },

    // Build a CSV string from an array of reports
    buildCSV(reports) {
        const escapeField = (value) => {
            const str = value == null ? '' : String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };

        const headers = [
            'ID', 'Descripcion', 'Barrio', 'TipoVia', 'Prioridad',
            'Estado', 'Lat', 'Lng', 'FotoURL', 'CiudadanoID',
            'FechaCreacion', 'PuntajeIA'
        ];

        const rows = reports.map(r => [
            escapeField(r.id),
            escapeField(r.description),
            escapeField(r.neighborhood),
            escapeField(r.roadType),
            escapeField(r.priority),
            escapeField(r.status),
            escapeField(r.location ? r.location.lat : ''),
            escapeField(r.location ? r.location.lng : ''),
            escapeField(r.photo ? (typeof r.photo === 'string' ? r.photo : (r.photo.dataUrl || '')) : ''),
            escapeField(r.citizenId),
            escapeField(r.timestamp instanceof Date ? r.timestamp.toISOString() : new Date(r.timestamp).toISOString()),
            escapeField(r.priorityScore)
        ].join(','));

        return [headers.join(','), ...rows].join('\r\n');
    },

    // Main render function
    render() {
        console.log('Rendering Municipal Dashboard...');
        this.updateStatistics();
        this.updateReportsList();
        this.updateNeighborhoodMap();
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.MunicipalDashboard.init();
});